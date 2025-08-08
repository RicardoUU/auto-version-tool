import * as fs from 'fs';
import * as path from 'path';
import Mustache from 'mustache';
import { Config, CommitInfo, VersionInfo, ChangelogEntry } from '../types/Config';

export class ChangelogService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async generateChangelog(versionInfo: VersionInfo, commits: CommitInfo[]): Promise<string> {
    const changelogEntry = this.createChangelogEntry(versionInfo, commits);
    return this.renderChangelogEntry(changelogEntry);
  }

  async updateChangelog(versionInfo: VersionInfo, commits: CommitInfo[]): Promise<void> {
    const changelogPath = path.resolve(this.config.changelog.outputFile);
    const newEntry = await this.generateChangelog(versionInfo, commits);
    
    // 读取现有的changelog
    let existingContent = '';
    if (fs.existsSync(changelogPath)) {
      existingContent = fs.readFileSync(changelogPath, 'utf-8');
    }

    // 生成新的changelog内容
    const updatedContent = this.mergeChangelog(newEntry, existingContent);
    
    // 写入文件
    fs.writeFileSync(changelogPath, updatedContent, 'utf-8');
    console.log(`✅ 已更新 changelog: ${changelogPath}`);
  }

  private createChangelogEntry(versionInfo: VersionInfo, commits: CommitInfo[]): ChangelogEntry {
    const filteredCommits = this.filterCommits(commits);
    
    return {
      version: versionInfo.next,
      date: new Date().toISOString().split('T')[0],
      commits: filteredCommits,
      breaking: filteredCommits.filter(c => c.breaking),
      features: filteredCommits.filter(c => c.type === 'feat'),
      fixes: filteredCommits.filter(c => c.type === 'fix'),
      others: filteredCommits.filter(c => 
        c.type && !['feat', 'fix'].includes(c.type) && !c.breaking
      )
    };
  }

  private filterCommits(commits: CommitInfo[]): CommitInfo[] {
    return commits.filter(commit => {
      // 过滤掉不需要的提交类型
      if (!commit.type) return false;
      
      return this.config.changelog.includeTypes.includes(commit.type);
    });
  }

  private renderChangelogEntry(entry: ChangelogEntry): string {
    const template = this.getTemplate();
    
    const data = {
      version: entry.version,
      date: entry.date,
      hasBreaking: entry.breaking.length > 0,
      breaking: entry.breaking.map(this.formatCommit.bind(this)),
      hasFeatures: entry.features.length > 0,
      features: entry.features.map(this.formatCommit.bind(this)),
      hasFixes: entry.fixes.length > 0,
      fixes: entry.fixes.map(this.formatCommit.bind(this)),
      hasOthers: entry.others.length > 0,
      others: this.groupOtherCommits(entry.others)
    };

    return Mustache.render(template, data);
  }

  private formatCommit(commit: CommitInfo): any {
    const shortHash = commit.hash.substring(0, 7);
    const scope = commit.scope ? `**${commit.scope}**: ` : '';
    const subject = commit.subject || commit.message.split('\n')[0];
    
    return {
      hash: commit.hash,
      shortHash,
      scope,
      subject,
      scopeDisplay: commit.scope,
      message: `${scope}${subject}`,
      author: commit.author,
      type: commit.type,
      typeTitle: this.getTypeTitle(commit.type),
      emoji: this.getTypeEmoji(commit.type)
    };
  }

  private groupOtherCommits(commits: CommitInfo[]): any[] {
    if (this.config.changelog.groupBy === 'none') {
      return commits.map(this.formatCommit.bind(this));
    }

    const grouped: { [key: string]: CommitInfo[] } = {};
    
    commits.forEach(commit => {
      const key = this.config.changelog.groupBy === 'type' 
        ? commit.type || 'other'
        : commit.scope || 'other';
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(commit);
    });

    return Object.entries(grouped).map(([key, commits]) => ({
      title: this.getGroupTitle(key),
      commits: commits.map(this.formatCommit.bind(this))
    }));
  }

  private getTypeTitle(type?: string): string {
    if (!type) return 'Other';
    
    const typeConfig = this.config.commitTypes[type];
    return typeConfig?.title || type.charAt(0).toUpperCase() + type.slice(1);
  }

  private getTypeEmoji(type?: string): string {
    if (!type) return '';
    
    const typeConfig = this.config.commitTypes[type];
    return typeConfig?.emoji || '';
  }

  private getGroupTitle(group: string): string {
    if (this.config.changelog.groupBy === 'type') {
      return this.getTypeTitle(group);
    }
    return group.charAt(0).toUpperCase() + group.slice(1);
  }

  private getTemplate(): string {
    // 如果配置了自定义模板文件，读取它
    if (this.config.changelog.template && fs.existsSync(this.config.changelog.template)) {
      return fs.readFileSync(this.config.changelog.template, 'utf-8');
    }

    // 使用默认模板
    return this.getDefaultTemplate();
  }

  private getDefaultTemplate(): string {
    return `## [{{version}}]({{compareUrl}}) ({{date}})

{{#hasBreaking}}
### ⚠ BREAKING CHANGES

{{#breaking}}
* {{emoji}} {{message}} ([{{shortHash}}]({{commitUrl}}))
{{/breaking}}

{{/hasBreaking}}
{{#hasFeatures}}
### ✨ Features

{{#features}}
* {{emoji}} {{message}} ([{{shortHash}}]({{commitUrl}}))
{{/features}}

{{/hasFeatures}}
{{#hasFixes}}
### 🐛 Bug Fixes

{{#fixes}}
* {{emoji}} {{message}} ([{{shortHash}}]({{commitUrl}}))
{{/fixes}}

{{/hasFeatures}}
{{#hasOthers}}
### 📦 Other Changes

{{#others}}
{{#title}}
#### {{title}}

{{/title}}
{{#commits}}
* {{emoji}} {{message}} ([{{shortHash}}]({{commitUrl}}))
{{/commits}}
{{/others}}

{{/hasOthers}}
`;
  }

  private mergeChangelog(newEntry: string, existingContent: string): string {
    if (!existingContent.trim()) {
      return this.createInitialChangelog(newEntry);
    }

    // 找到第一个版本标题的位置
    const versionHeaderRegex = /^## \[.*?\]/m;
    const match = existingContent.match(versionHeaderRegex);
    
    if (match && match.index !== undefined) {
      // 在第一个版本之前插入新条目
      const beforeFirstVersion = existingContent.substring(0, match.index);
      const afterFirstVersion = existingContent.substring(match.index);
      
      return beforeFirstVersion + newEntry + '\n' + afterFirstVersion;
    } else {
      // 如果没有找到版本标题，说明是空的changelog
      return this.createInitialChangelog(newEntry);
    }
  }

  private createInitialChangelog(firstEntry: string): string {
    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${firstEntry}`;
  }

  async getChangelogHistory(): Promise<ChangelogEntry[]> {
    const changelogPath = path.resolve(this.config.changelog.outputFile);
    
    if (!fs.existsSync(changelogPath)) {
      return [];
    }

    const content = fs.readFileSync(changelogPath, 'utf-8');
    return this.parseChangelog(content);
  }

  private parseChangelog(content: string): ChangelogEntry[] {
    // 这里可以实现changelog解析逻辑
    // 暂时返回空数组
    return [];
  }

  async validateChangelog(): Promise<boolean> {
    try {
      const changelogPath = path.resolve(this.config.changelog.outputFile);
      
      if (!fs.existsSync(changelogPath)) {
        return true; // 文件不存在时视为有效
      }

      const content = fs.readFileSync(changelogPath, 'utf-8');
      
      // 基本验证：检查是否有有效的markdown格式
      const hasHeader = content.includes('# Changelog') || content.includes('# CHANGELOG');
      const hasVersions = /^## \[.*?\]/.test(content);
      
      return hasHeader || hasVersions;
    } catch {
      return false;
    }
  }
}
