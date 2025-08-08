import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../types/Config';

export class ConfigService {
  private defaultConfig: Config = {
    git: {
      defaultBranch: 'main',
      remoteOrigin: 'origin',
      tagPrefix: 'v'
    },
    version: {
      strategy: 'semantic',
      bumpRules: {
        major: ['feat!', 'fix!', 'BREAKING CHANGE', 'breaking'],
        minor: ['feat'],
        patch: ['fix', 'perf', 'refactor']
      },
      prerelease: {
        identifier: 'alpha',
        enable: false
      }
    },
    changelog: {
      outputFile: 'CHANGELOG.md',
      template: '',
      includeTypes: ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'build', 'ci', 'chore'],
      skipEmptyReleases: true,
      groupBy: 'type'
    },
    commitTypes: {
      feat: {
        title: 'Features',
        semver: 'minor',
        emoji: '✨'
      },
      fix: {
        title: 'Bug Fixes',
        semver: 'patch',
        emoji: '🐛'
      },
      docs: {
        title: 'Documentation',
        semver: 'patch',
        emoji: '📚'
      },
      style: {
        title: 'Styles',
        semver: 'patch',
        emoji: '💎'
      },
      refactor: {
        title: 'Code Refactoring',
        semver: 'patch',
        emoji: '📦'
      },
      perf: {
        title: 'Performance Improvements',
        semver: 'patch',
        emoji: '🚀'
      },
      test: {
        title: 'Tests',
        semver: 'none',
        emoji: '🚨'
      },
      build: {
        title: 'Builds',
        semver: 'patch',
        emoji: '🛠'
      },
      ci: {
        title: 'Continuous Integrations',
        semver: 'none',
        emoji: '⚙️'
      },
      chore: {
        title: 'Chores',
        semver: 'patch',
        emoji: '♻️'
      }
    },
    files: {
      packageJson: 'package.json',
      changelogFile: 'CHANGELOG.md'
    },
    hooks: {}
  };

  loadConfig(configPath?: string): Config {
    const configFile = configPath || this.findConfigFile();
    
    if (!configFile || !fs.existsSync(configFile)) {
      console.log('🔧 使用默认配置');
      return this.defaultConfig;
    }

    try {
      console.log(`📄 加载配置文件: ${configFile}`);
      
      // 根据文件扩展名加载配置
      const config = this.loadConfigFromFile(configFile);
      
      // 合并默认配置
      return this.mergeConfig(this.defaultConfig, config);
    } catch (error) {
      console.warn(`⚠️  加载配置文件失败，使用默认配置: ${error}`);
      return this.defaultConfig;
    }
  }

  private findConfigFile(): string | null {
    const cwd = process.cwd();
    const possibleFiles = [
      'auto-version.config.js',
      'auto-version.config.json',
      '.auto-versionrc',
      '.auto-versionrc.json',
      '.auto-versionrc.js'
    ];

    for (const file of possibleFiles) {
      const fullPath = path.join(cwd, file);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    // 检查package.json中的配置
    const packageJsonPath = path.join(cwd, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.autoVersion) {
          return packageJsonPath;
        }
      } catch {
        // 忽略错误
      }
    }

    return null;
  }

  private loadConfigFromFile(configFile: string): Partial<Config> {
    const ext = path.extname(configFile);
    
    if (ext === '.json' || configFile.endsWith('package.json')) {
      const content = fs.readFileSync(configFile, 'utf-8');
      const json = JSON.parse(content);
      
      // 如果是package.json，提取autoVersion字段
      if (configFile.endsWith('package.json')) {
        return json.autoVersion || {};
      }
      
      return json;
    }
    
    if (ext === '.js') {
      // 动态导入JS配置文件
      delete require.cache[require.resolve(configFile)];
      const config = require(configFile);
      return config.default || config;
    }

    throw new Error(`不支持的配置文件格式: ${ext}`);
  }

  private mergeConfig(defaultConfig: Config, userConfig: Partial<Config>): Config {
    return {
      git: { ...defaultConfig.git, ...userConfig.git },
      version: {
        ...defaultConfig.version,
        ...userConfig.version,
        bumpRules: { ...defaultConfig.version.bumpRules, ...userConfig.version?.bumpRules },
        prerelease: { 
          ...defaultConfig.version.prerelease, 
          ...(userConfig.version?.prerelease || {})
        }
      },
      changelog: { ...defaultConfig.changelog, ...userConfig.changelog },
      commitTypes: { ...defaultConfig.commitTypes, ...userConfig.commitTypes },
      files: { ...defaultConfig.files, ...userConfig.files },
      hooks: { ...defaultConfig.hooks, ...userConfig.hooks }
    };
  }

  async createDefaultConfig(outputPath: string): Promise<void> {
    const configContent = this.generateConfigFileContent(outputPath);
    fs.writeFileSync(outputPath, configContent, 'utf-8');
  }

  private generateConfigFileContent(outputPath: string): string {
    const ext = path.extname(outputPath);
    
    if (ext === '.json') {
      return JSON.stringify(this.defaultConfig, null, 2);
    }
    
    // 生成JS配置文件
    return `module.exports = {
  // Git相关配置
  git: {
    defaultBranch: 'main',
    remoteOrigin: 'origin',
    tagPrefix: 'v'
  },

  // 版本控制配置
  version: {
    strategy: 'semantic', // 'semantic' | 'timestamp' | 'build'
    bumpRules: {
      major: ['feat!', 'fix!', 'BREAKING CHANGE', 'breaking'],
      minor: ['feat'],
      patch: ['fix', 'perf', 'refactor']
    },
    prerelease: {
      identifier: 'alpha',
      enable: false
    }
  },

  // Changelog配置
  changelog: {
    outputFile: 'CHANGELOG.md',
    template: '', // 可以指定自定义模板文件路径
    includeTypes: ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'build', 'ci', 'chore'],
    skipEmptyReleases: true,
    groupBy: 'type' // 'type' | 'scope' | 'none'
  },

  // 提交类型配置
  commitTypes: {
    feat: {
      title: 'Features',
      semver: 'minor',
      emoji: '✨'
    },
    fix: {
      title: 'Bug Fixes',
      semver: 'patch',
      emoji: '🐛'
    },
    docs: {
      title: 'Documentation',
      semver: 'patch',
      emoji: '📚'
    },
    style: {
      title: 'Styles',
      semver: 'patch',
      emoji: '💎'
    },
    refactor: {
      title: 'Code Refactoring',
      semver: 'patch',
      emoji: '📦'
    },
    perf: {
      title: 'Performance Improvements',
      semver: 'patch',
      emoji: '🚀'
    },
    test: {
      title: 'Tests',
      semver: 'none',
      emoji: '🚨'
    },
    build: {
      title: 'Builds',
      semver: 'patch',
      emoji: '🛠'
    },
    ci: {
      title: 'Continuous Integrations',
      semver: 'none',
      emoji: '⚙️'
    },
    chore: {
      title: 'Chores',
      semver: 'patch',
      emoji: '♻️'
    }
  },

  // 文件配置
  files: {
    packageJson: 'package.json',
    versionFile: '', // 可选，独立的版本文件
    changelogFile: 'CHANGELOG.md'
  },

  // 钩子配置
  hooks: {
    // preVersion: 'npm run test',
    // postVersion: 'npm run build',
    // preCommit: 'npm run lint',
    // postCommit: 'npm run deploy'
  }
};
`;
  }

  validateConfig(config: Config): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证必要字段
    if (!config.git?.defaultBranch) {
      errors.push('git.defaultBranch 是必须的');
    }

    if (!config.files?.packageJson) {
      errors.push('files.packageJson 是必须的');
    }

    if (!config.files?.changelogFile) {
      errors.push('files.changelogFile 是必须的');
    }

    // 验证版本策略
    const validStrategies = ['semantic', 'timestamp', 'build'];
    if (!validStrategies.includes(config.version?.strategy)) {
      errors.push(`version.strategy 必须是以下之一: ${validStrategies.join(', ')}`);
    }

    // 验证changelog分组方式
    const validGroupBy = ['type', 'scope', 'none'];
    if (config.changelog?.groupBy && !validGroupBy.includes(config.changelog.groupBy)) {
      errors.push(`changelog.groupBy 必须是以下之一: ${validGroupBy.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getDefaultConfig(): Config {
    return { ...this.defaultConfig };
  }
}
