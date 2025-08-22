import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Config, RunOptions, CommitInfo, VersionInfo } from '../types/Config';
import { GitService } from '../services/GitService';
import { VersionService } from '../services/VersionService';
import { ChangelogService } from '../services/ChangelogService';
import { ConfigService } from '../services/ConfigService';

export class AutoVersionTool {
  private config: Config;
  private gitService: GitService;
  private versionService: VersionService;
  private changelogService: ChangelogService;
  private configService: ConfigService;

  constructor(configPath?: string) {
    this.configService = new ConfigService();
    this.config = this.configService.loadConfig(configPath);
    this.gitService = new GitService(this.config);
    this.versionService = new VersionService(this.config);
    this.changelogService = new ChangelogService(this.config);
  }

  async run(options: RunOptions): Promise<void> {
    console.log(chalk.blue('📋 检查环境...'));
    
    // 检查是否在git仓库中
    if (!(await this.gitService.isGitRepository())) {
      throw new Error('当前目录不是git仓库');
    }

    // 检查工作区是否干净
    if (!(await this.gitService.isWorkingDirectoryClean())) {
      throw new Error('工作区不干净，请先提交或储藏更改');
    }

    // 切换到指定分支
    await this.gitService.checkoutBranch(options.branch);

    console.log(chalk.blue('📊 分析提交历史...'));
    
    // 获取自上次标签以来的提交
    const commits = await this.gitService.getCommitsSinceLastTag(options.branch);
    
    if (commits.length === 0) {
      console.log(chalk.yellow('⚠️  没有新的提交需要发布'));
      return;
    }

    console.log(chalk.green(`📈 发现 ${commits.length} 个新提交`));

    // 解析提交信息
    const parsedCommits = this.parseCommits(commits);
    
    // 确定版本类型
    const versionInfo = await this.determineVersionBump(parsedCommits, options.versionType);
    
    console.log(chalk.blue(`🎯 版本将从 ${versionInfo.current} 升级到 ${versionInfo.next} (${versionInfo.type})`));

    if (options.dryRun) {
      console.log(chalk.yellow('🏃 试运行模式，不会实际修改文件'));
      await this.showPreview(versionInfo, parsedCommits);
      return;
    }

    // 确认操作
    if (!options.yes) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '确认执行版本更新？',
          default: true
        }
      ]);
      if (!confirm) {
        console.log(chalk.yellow('❌ 操作已取消'));
        return;
      }
    } else {
      console.log(chalk.gray('✅ 已启用 --yes 自动确认'));
    }

    // 执行版本更新
    await this.executeVersionBump(versionInfo, parsedCommits, options);
  }

  async initConfig(): Promise<void> {
    const configPath = path.join(process.cwd(), 'auto-version.config.js');
    
    if (fs.existsSync(configPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: '配置文件已存在，是否覆盖？',
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.yellow('❌ 操作已取消'));
        return;
      }
    }

    await this.configService.createDefaultConfig(configPath);
    console.log(chalk.green(`✅ 配置文件已创建: ${configPath}`));
  }

  async showStatus(branch: string): Promise<void> {
    console.log(chalk.blue('📊 版本状态信息'));
    console.log(''.padEnd(50, '='));

    // 当前版本
    const currentVersion = await this.versionService.getCurrentVersion();
    console.log(chalk.green(`当前版本: ${currentVersion}`));

    // 分支信息
    console.log(chalk.blue(`当前分支: ${branch}`));

    // 最新标签
    const latestTag = await this.gitService.getLatestTag();
    console.log(chalk.yellow(`最新标签: ${latestTag || '无'}`));

    // 待发布的提交
    const commits = await this.gitService.getCommitsSinceLastTag(branch);
    console.log(chalk.cyan(`待发布提交: ${commits.length} 个`));

    if (commits.length > 0) {
      console.log('\n📝 提交列表:');
      commits.slice(0, 10).forEach((commit, index) => {
        const shortHash = commit.hash.substring(0, 7);
        const shortMessage = commit.message.length > 60 
          ? commit.message.substring(0, 60) + '...' 
          : commit.message;
        console.log(chalk.gray(`  ${index + 1}. ${shortHash} ${shortMessage}`));
      });
      
      if (commits.length > 10) {
        console.log(chalk.gray(`  ... 还有 ${commits.length - 10} 个提交`));
      }
    }
  }

  private parseCommits(commits: any[]): CommitInfo[] {
    return commits.map(commit => {
      const parsed = this.parseConventionalCommit(commit.message);
      return {
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: new Date(commit.date),
        ...parsed
      };
    });
  }

  private parseConventionalCommit(message: string): Partial<CommitInfo> {
    // 解析 Conventional Commits 格式
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\(.+\))?(!)?: (.+)$/;
    const match = message.match(conventionalPattern);
    
    if (match) {
      return {
        type: match[1],
        scope: match[2] ? match[2].slice(1, -1) : undefined,
        breaking: !!match[3],
        subject: match[4]
      };
    }
    
    return {
      type: 'other',
      subject: message.split('\n')[0]
    };
  }

  private async determineVersionBump(commits: CommitInfo[], versionType: string): Promise<VersionInfo> {
    const current = await this.versionService.getCurrentVersion();
    
    if (versionType !== 'auto') {
      const next = this.versionService.bumpVersion(current, versionType as any);
      return { current, next, type: versionType as any };
    }

    // 自动确定版本类型
    let type: 'major' | 'minor' | 'patch' = 'patch';
    
    for (const commit of commits) {
      if (commit.breaking) {
        type = 'major';
        break;
      }
      
      if (commit.type === 'feat' && type === 'patch') {
        type = 'minor';
      }
    }

    const next = this.versionService.bumpVersion(current, type);
    return { current, next, type };
  }

  private async showPreview(versionInfo: VersionInfo, commits: CommitInfo[]): Promise<void> {
    console.log('\n📋 预览模式');
    console.log(''.padEnd(50, '-'));
    console.log(chalk.blue(`版本变更: ${versionInfo.current} → ${versionInfo.next}`));
    console.log(chalk.blue(`变更类型: ${versionInfo.type}`));
    console.log(chalk.blue(`影响提交: ${commits.length} 个`));
    
    // 显示将要生成的changelog预览
    const changelogPreview = await this.changelogService.generateChangelog(versionInfo, commits);
    console.log('\n📝 Changelog 预览:');
    console.log(''.padEnd(50, '-'));
    console.log(changelogPreview.substring(0, 500) + (changelogPreview.length > 500 ? '...' : ''));
  }

  private async executeVersionBump(
    versionInfo: VersionInfo, 
    commits: CommitInfo[], 
    options: RunOptions
  ): Promise<void> {
    try {
      // 执行pre-version钩子
      await this.executeHook('preVersion');

      // 更新版本号
      console.log(chalk.blue('📝 更新版本号...'));
      await this.versionService.updateVersion(versionInfo.next);

      // 生成changelog
      if (!options.skipChangelog) {
        console.log(chalk.blue('📜 生成 Changelog...'));
        await this.changelogService.updateChangelog(versionInfo, commits);
      }

      // 执行post-version钩子
      await this.executeHook('postVersion');

      // 提交更改
      if (!options.skipCommit) {
        console.log(chalk.blue('💾 提交更改...'));
        await this.gitService.commitVersionBump(versionInfo.next);
      }

      // 创建标签
      if (!options.skipTag) {
        console.log(chalk.blue('🏷️  创建标签...'));
        await this.gitService.createTag(versionInfo.next);
      }

      // push
      if (options.push && !options.dryRun) {
        console.log(chalk.blue('📤 推送到远程...'));
        await this.gitService.safePush(options.branch, !options.skipTag);
      }

      console.log(chalk.green(`🎉 版本 ${versionInfo.next} 发布成功！`));
      
    } catch (error) {
      console.error(chalk.red('❌ 版本更新失败:'), error);
      throw error;
    }
  }

  private async executeHook(hookName: keyof Config['hooks']): Promise<void> {
    const hookCommand = this.config.hooks[hookName];
    if (hookCommand) {
      console.log(chalk.gray(`🔗 执行 ${hookName} 钩子...`));
      // 这里可以执行shell命令
      // await exec(hookCommand);
    }
  }
}
