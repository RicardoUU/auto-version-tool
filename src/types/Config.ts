export interface Config {
  // Git相关配置
  git: {
    defaultBranch: string;
    remoteOrigin: string;
    tagPrefix: string;
  };
  
  // 版本控制配置
  version: {
    strategy: 'semantic' | 'timestamp' | 'build';
    bumpRules: {
      major: string[];
      minor: string[];
      patch: string[];
    };
    prerelease?: {
      identifier?: string;
      enable?: boolean;
    };
  };
  
  // Changelog配置
  changelog: {
    outputFile: string;
    template: string;
    includeTypes: string[];
    skipEmptyReleases: boolean;
    groupBy: 'type' | 'scope' | 'none';
  };
  
  // Commit类型配置
  commitTypes: {
    [key: string]: {
      title: string;
      semver: 'major' | 'minor' | 'patch' | 'none';
      emoji?: string;
    };
  };
  
  // 文件配置
  files: {
    packageJson: string;
    versionFile?: string;
    changelogFile: string;
  };
  
  // 钩子配置
  hooks: {
    preVersion?: string;
    postVersion?: string;
    preCommit?: string;
    postCommit?: string;
  };
}

export interface RunOptions {
  branch: string;
  versionType: 'patch' | 'minor' | 'major' | 'auto';
  dryRun: boolean;
  skipChangelog: boolean;
  skipCommit: boolean;
  skipTag: boolean;
  yes?: boolean; // 非交互模式，自动确认
  push?: boolean; // 版本更新后自动 push
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: Date;
  type?: string;
  scope?: string;
  subject?: string;
  body?: string;
  breaking?: boolean;
  issues?: string[];
}

export interface VersionInfo {
  current: string;
  next: string;
  type: 'major' | 'minor' | 'patch';
}

export interface ChangelogEntry {
  version: string;
  date: string;
  commits: CommitInfo[];
  breaking: CommitInfo[];
  features: CommitInfo[];
  fixes: CommitInfo[];
  others: CommitInfo[];
}
