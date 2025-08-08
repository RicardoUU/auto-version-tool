module.exports = {
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
    versionFile: '', // 可选，独立的版本文件，比如 'src/version.ts'
    changelogFile: 'CHANGELOG.md'
  },

  // 钩子配置 - 在特定阶段执行的命令
  hooks: {
    // preVersion: 'npm run test',     // 版本更新前执行
    // postVersion: 'npm run build',   // 版本更新后执行
    // preCommit: 'npm run lint',      // 提交前执行
    // postCommit: 'npm run deploy'    // 提交后执行
  }
};
