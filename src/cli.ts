#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { AutoVersionTool } from './core/AutoVersionTool';
import { Config } from './types/Config';

const program = new Command();

program
  .name('auto-version')
  .description('根据git commit历史自动修改版本号的前端脚手架工具')
  .version('1.0.0');

program
  .command('bump')
  .description('自动提升版本号并生成changelog')
  .option('-b, --branch <branch>', '指定分支名称', 'main')
  .option('-t, --type <type>', '版本类型 (patch|minor|major|auto)', 'auto')
  .option('-d, --dry-run', '试运行模式，不实际修改文件')
  .option('-c, --config <path>', '配置文件路径', './auto-version.config.js')
  .option('--skip-changelog', '跳过changelog生成')
  .option('--skip-commit', '跳过自动提交')
  .option('--skip-tag', '跳过自动标签')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 启动自动版本工具...'));
      
      const tool = new AutoVersionTool(options.config);
      await tool.run({
        branch: options.branch,
        versionType: options.type,
        dryRun: options.dryRun,
        skipChangelog: options.skipChangelog,
        skipCommit: options.skipCommit,
        skipTag: options.skipTag
      });
      
      console.log(chalk.green('✅ 版本更新完成！'));
    } catch (error) {
      console.error(chalk.red('❌ 错误:'), error.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('初始化配置文件')
  .action(async () => {
    try {
      console.log(chalk.blue('📝 创建配置文件...'));
      const tool = new AutoVersionTool();
      await tool.initConfig();
      console.log(chalk.green('✅ 配置文件创建成功！'));
    } catch (error) {
      console.error(chalk.red('❌ 错误:'), error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('查看当前版本信息和待发布的更改')
  .option('-b, --branch <branch>', '指定分支名称', 'main')
  .action(async (options) => {
    try {
      const tool = new AutoVersionTool();
      await tool.showStatus(options.branch);
    } catch (error) {
      console.error(chalk.red('❌ 错误:'), error.message);
      process.exit(1);
    }
  });

program.parse();
