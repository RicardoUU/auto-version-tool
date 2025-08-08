# 🚀 快速开始指南

## 安装

```bash
# 全局安装
npm install -g auto-version-tool

# 或者在项目中本地安装
npm install --save-dev auto-version-tool
```

## 初始化

在你的项目根目录运行：

```bash
auto-version init
```

这会创建一个 `auto-version.config.js` 配置文件。

## 基本使用

### 1. 查看当前状态

```bash
auto-version status
```

输出示例：
```
📊 版本状态信息
==================================================
当前版本: 1.0.0
当前分支: main  
最新标签: v1.0.0
待发布提交: 3 个

📝 提交列表:
  1. a1b2c3d feat: add user authentication
  2. e4f5g6h fix: resolve login redirect issue
  3. i7j8k9l docs: update API documentation
```

### 2. 试运行版本更新

```bash
auto-version bump --dry-run
```

这会显示将要进行的更改，但不会实际修改任何文件。

### 3. 执行版本更新

```bash
auto-version bump
```

这会：
- 分析提交历史
- 自动确定版本类型
- 更新 package.json
- 生成/更新 CHANGELOG.md
- 创建 git commit 和 tag

## 常用命令

```bash
# 指定分支
auto-version bump --branch develop

# 手动指定版本类型
auto-version bump --type minor

# 跳过某些步骤
auto-version bump --skip-changelog
auto-version bump --skip-commit
auto-version bump --skip-tag

# 使用自定义配置文件
auto-version bump --config ./my-config.js
```

## 提交规范

工具支持 Conventional Commits 规范：

```
feat: 新功能 (minor版本)
fix: 修复bug (patch版本)  
feat!: 破坏性更改 (major版本)
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
build: 构建
ci: CI/CD
chore: 其他
```

## 配置示例

```javascript
// auto-version.config.js
module.exports = {
  git: {
    defaultBranch: 'main',
    tagPrefix: 'v'
  },
  version: {
    strategy: 'semantic'
  },
  changelog: {
    outputFile: 'CHANGELOG.md',
    groupBy: 'type'
  }
};
```

## 工作流建议

1. **开发阶段**: 按照 Conventional Commits 规范提交代码
2. **发布准备**: 运行 `auto-version bump --dry-run` 检查
3. **版本发布**: 运行 `auto-version bump` 执行发布
4. **推送代码**: `git push origin main --tags`

## 故障排除

### 问题: 不是git仓库
```bash
git init
git add .
git commit -m "feat: initial commit"
```

### 问题: 工作区不干净
```bash
git add .
git commit -m "chore: save work in progress"
```

### 问题: 没有提交历史
确保至少有一个提交，工具需要分析提交历史来确定版本。

## 进阶使用

### 自定义changelog模板

创建 `templates/changelog.mustache`:
```mustache
# 版本 {{version}} - {{date}}

{{#hasFeatures}}
## 🚀 新功能
{{#features}}
- {{subject}}
{{/features}}
{{/hasFeatures}}
```

在配置中指定：
```javascript
changelog: {
  template: './templates/changelog.mustache'
}
```

### 生命周期钩子

```javascript
hooks: {
  preVersion: 'npm run test',
  postVersion: 'npm run build',
  postCommit: 'npm run deploy'
}
```

这样就可以在版本更新的各个阶段自动执行相应的命令。
