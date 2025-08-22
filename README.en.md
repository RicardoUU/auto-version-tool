# Auto Version Tool

English documentation for the project. For Chinese version, see [README.md](./README.md).

A CLI tool that automatically bumps your project version and generates a changelog based on your Git commit history. It follows (and helps enforce) the Conventional Commits specification and Semantic Versioning.

## ✨ Features

- 🎯 **Smart version bump**: Detects whether the next release should be `major`, `minor`, or `patch` from commit messages
- 📝 **Automatic Changelog**: Generates a structured changelog section per release
- 🌿 **Multi-branch support**: Choose which branch to analyse
- ⚙️ **Highly configurable**: Customize commit types, bump rules, template, hooks, output files
- 🔗 **Lifecycle hooks**: Run commands before/after version update / commit / tag
- 🚀 **Ready out of the box**: Sensible defaults; simple to extend
- 🧪 **API + CLI**: Use it programmatically or from the terminal

## 🚀 Quick Start

### Install

Global (system-wide):

```bash
npm install -g auto-version-tool
```

Local (dev dependency):

```bash
npm install --save-dev auto-version-tool
```

### Basic Usage

```bash
# Initialize a config file
auto-version init

# Analyse commits and bump version (auto mode)
auto-version bump

# Specify branch
auto-version bump --branch develop

# Force a specific bump type
auto-version bump --type minor

# Dry run (no file modifications)
auto-version bump --dry-run

# Show status (current version + pending commits)
auto-version status
```

## 📋 Commands

### `auto-version bump`

Automatically determine the next version, update version files and generate the changelog.

Options:

- `-b, --branch <branch>`: Branch name (default: `main`)
- `-t, --type <type>`: `patch|minor|major|auto` (default: `auto`)
- `-d, --dry-run`: Simulation mode, no changes written
- `-c, --config <path>`: Config file path (default: `./auto-version.config.js`)
- `--skip-changelog`: Skip generating changelog
- `--skip-commit`: Skip committing changes
- `--skip-tag`: Skip creating git tag

Examples:

```bash
auto-version bump                # auto detect
auto-version bump --type minor   # force minor
auto-version bump --dry-run      # preview only
auto-version bump --skip-changelog
```

### `auto-version init`

Create a default config file in current directory.

### `auto-version status`

Display current version, latest tag and pending commits since last release.

## ⚙️ Configuration

The tool searches for configuration in this precedence:

1. `auto-version.config.js`
2. `auto-version.config.json`
3. `.auto-versionrc`
4. `.auto-versionrc.json`
5. `.auto-versionrc.js`
6. `package.json` field `autoVersion`

Example configuration:

```js
module.exports = {
  git: { defaultBranch: "main", remoteOrigin: "origin", tagPrefix: "v" },
  version: {
    strategy: "semantic",
    bumpRules: {
      major: ["feat!", "fix!", "BREAKING CHANGE"],
      minor: ["feat"],
      patch: ["fix", "perf", "refactor"],
    },
    prerelease: { identifier: "alpha", enable: false },
  },
  changelog: {
    outputFile: "CHANGELOG.md",
    template: "",
    includeTypes: ["feat", "fix", "perf", "refactor", "docs"],
    skipEmptyReleases: true,
    groupBy: "type",
  },
  commitTypes: {
    feat: { title: "Features", semver: "minor", emoji: "✨" },
    fix: { title: "Bug Fixes", semver: "patch", emoji: "🐛" },
  },
  files: {
    packageJson: "package.json",
    versionFile: "",
    changelogFile: "CHANGELOG.md",
  },
  hooks: {
    preVersion: "npm run test",
    postVersion: "npm run build",
    preCommit: "npm run lint",
    postCommit: "npm run deploy",
  },
};
```

## 📝 Conventional Commits

Format:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Supported types (default mapping):

- `feat`: New feature (minor bump)
- `fix`: Bug fix (patch bump)
- `docs`: Documentation
- `style`: Formatting (no code logic changes)
- `refactor`: Refactor
- `perf`: Performance improvement
- `test`: Tests
- `build`: Build system
- `ci`: CI config
- `chore`: Other housekeeping

Breaking changes:

- Add `!` after type: `feat!: new breaking feature`
- Or include `BREAKING CHANGE:` footer

## 🔄 Workflow Overview

1. Collect commits since last tag
2. Parse them using Conventional Commit rules
3. Determine bump type (auto or forced)
4. Update version in files
5. Generate / update `CHANGELOG.md`
6. Commit and tag (unless skipped)

\n## 🎨 Changelog Template
You may supply a custom Mustache template. Default template includes sections for breaking changes, features and fixes.

Example snippet:

```mustache
## [{{version}}] ({{date}})
{{#hasFeatures}}
### ✨ Features
{{#features}}
* {{emoji}} {{message}} ({{shortHash}})
{{/features}}
{{/hasFeatures}}
```

## 🔧 Advanced Usage

Custom template example:

```mustache
# Release {{version}} - {{date}}
{{#hasFixes}}
## Fixes
{{#fixes}}
- {{subject}} ({{shortHash}})
{{/fixes}}
{{/hasFixes}}
```

Programmatic API:

```ts
import { AutoVersionTool } from "auto-version-tool";

const tool = new AutoVersionTool("./my-config.js");
await tool.run({
  branch: "main",
  versionType: "auto",
  dryRun: false,
  skipChangelog: false,
  skipCommit: false,
  skipTag: false,
});
```

## 🧪 Suggestions

- Use a dedicated release branch
- Enforce commit message format via commitlint / Husky
- Add a CI job: run tests → `auto-version bump --dry-run` to preview → on main merges run actual bump

\n## 🤝 Contributing
Issues & PRs are welcome. Please follow Conventional Commits.

\n## 📄 License
MIT

## 🔗 References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
