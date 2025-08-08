# Auto Version Tool

一个基于git commit历史自动修改版本号的前端脚手架工具。支持语义化版本控制、自动生成changelog，并可以根据提交信息智能判断版本升级类型。

## ✨ 特性

- 🎯 **智能版本控制**: 根据Conventional Commits自动确定版本升级类型(major/minor/patch)
- 📝 **自动生成Changelog**: 基于提交历史自动生成格式化的更新日志
- 🌿 **多分支支持**: 可以指定不同分支进行版本管理
- ⚙️ **高度可配置**: 支持自定义提交类型、版本策略、输出格式等
- 🔗 **生命周期钩子**: 支持在版本更新的各个阶段执行自定义命令
- 🚀 **开箱即用**: 内置合理的默认配置，也支持完全自定义

## 🚀 快速开始

### 安装

```bash
npm install -g auto-version-tool
```

或者在项目中本地安装：

```bash
npm install --save-dev auto-version-tool
```

### 基本使用

```bash
# 初始化配置文件
auto-version init

# 自动分析提交并更新版本
auto-version bump

# 指定分支
auto-version bump --branch develop

# 手动指定版本类型
auto-version bump --type minor

# 试运行模式（不实际修改文件）
auto-version bump --dry-run

# 查看当前状态
auto-version status
```

## 📋 命令详解

### `auto-version bump`

自动提升版本号并生成changelog

#### 选项

- `-b, --branch <branch>`: 指定分支名称 (默认: main)
- `-t, --type <type>`: 版本类型 patch|minor|major|auto (默认: auto)
- `-d, --dry-run`: 试运行模式，不实际修改文件
- `-c, --config <path>`: 配置文件路径 (默认: ./auto-version.config.js)
- `--skip-changelog`: 跳过changelog生成
- `--skip-commit`: 跳过自动提交
- `--skip-tag`: 跳过自动标签

#### 示例

```bash
# 自动模式 - 根据提交类型自动判断版本升级
auto-version bump

# 指定版本类型
auto-version bump --type minor

# 指定分支并试运行
auto-version bump --branch feature/new-feature --dry-run

# 只更新版本，不生成changelog
auto-version bump --skip-changelog
```

### `auto-version init`

初始化配置文件，会在当前目录创建 `auto-version.config.js`

### `auto-version status`

查看当前版本信息和待发布的更改

```bash
# 查看主分支状态
auto-version status

# 查看指定分支状态
auto-version status --branch develop
```

## ⚙️ 配置

### 配置文件

工具会按以下顺序查找配置文件：
1. `auto-version.config.js`
2. `auto-version.config.json`
3. `.auto-versionrc`
4. `.auto-versionrc.json`
5. `.auto-versionrc.js`
6. `package.json` 中的 `autoVersion` 字段

### 配置选项

```javascript
module.exports = {
  // Git相关配置
  git: {
    defaultBranch: 'main',      // 默认分支
    remoteOrigin: 'origin',     // 远程仓库名
    tagPrefix: 'v'              // 标签前缀
  },

  // 版本控制配置
  version: {
    strategy: 'semantic',       // 版本策略: semantic | timestamp | build
    bumpRules: {
      major: ['feat!', 'fix!', 'BREAKING CHANGE'],
      minor: ['feat'],
      patch: ['fix', 'perf', 'refactor']
    },
    prerelease: {
      identifier: 'alpha',      // 预发布标识符
      enable: false             // 是否启用预发布
    }
  },

  // Changelog配置
  changelog: {
    outputFile: 'CHANGELOG.md',
    template: '',               // 自定义模板文件路径
    includeTypes: ['feat', 'fix', 'perf', 'refactor', 'docs'],
    skipEmptyReleases: true,
    groupBy: 'type'             // 分组方式: type | scope | none
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
    }
    // ... 更多类型
  },

  // 文件配置
  files: {
    packageJson: 'package.json',
    versionFile: '',            // 可选的独立版本文件
    changelogFile: 'CHANGELOG.md'
  },

  // 生命周期钩子
  hooks: {
    preVersion: 'npm run test',
    postVersion: 'npm run build',
    preCommit: 'npm run lint',
    postCommit: 'npm run deploy'
  }
};
```

## 📝 Conventional Commits

工具支持 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 支持的提交类型

- `feat`: 新功能 (minor版本)
- `fix`: Bug修复 (patch版本)
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `build`: 构建系统
- `ci`: CI配置
- `chore`: 其他杂项

### 破坏性更改

以下方式可以标记破坏性更改 (major版本)：
- 在类型后添加 `!`: `feat!: new breaking feature`
- 在footer中包含 `BREAKING CHANGE: description`

## 🔄 工作流程

1. **分析提交**: 获取自上次版本标签以来的所有提交
2. **解析提交**: 按照Conventional Commits规范解析提交信息
3. **确定版本**: 根据提交类型自动确定版本升级类型
4. **更新文件**: 更新package.json和其他版本文件
5. **生成Changelog**: 基于提交历史生成更新日志
6. **提交更改**: 提交版本更新和changelog
7. **创建标签**: 为新版本创建git标签

## 🎨 Changelog模板

默认的changelog模板支持以下变量：

```mustache
## [{{version}}] ({{date}})

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
{{/hasFixes}}
```

## 🔧 高级用法

### 自定义模板

创建自定义changelog模板：

```mustache
# 版本 {{version}} - {{date}}

{{#hasFeatures}}
## 🚀 新功能
{{#features}}
- {{subject}} ({{shortHash}})
{{/features}}
{{/hasFeatures}}

{{#hasFixes}}
## 🐛 修复
{{#fixes}}
- {{subject}} ({{shortHash}})
{{/fixes}}
{{/hasFixes}}
```

在配置中指定模板路径：

```javascript
changelog: {
  template: './templates/changelog.mustache'
}
```

### 版本文件

除了package.json，还可以维护独立的版本文件：

```javascript
files: {
  versionFile: 'src/version.ts'
}
```

生成的版本文件内容：

```typescript
export const VERSION = '1.2.3';
export const BUILD_TIME = '2023-12-01T10:00:00.000Z';
export const BUILD_NUMBER = '1701428400000';
```

### 生命周期钩子

在版本更新过程中执行自定义命令：

```javascript
hooks: {
  preVersion: 'npm run test && npm run lint',
  postVersion: 'npm run build',
  preCommit: 'npm run format',
  postCommit: 'npm run deploy'
}
```

## 📚 API 使用

也可以作为Node.js模块使用：

```typescript
import { AutoVersionTool } from 'auto-version-tool';

const tool = new AutoVersionTool('./my-config.js');

await tool.run({
  branch: 'main',
  versionType: 'auto',
  dryRun: false,
  skipChangelog: false,
  skipCommit: false,
  skipTag: false
});
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT

## 🔗 相关链接

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
