import simpleGit, { SimpleGit } from "simple-git";
import { Config } from "../types/Config";
import { GitBranch, GitCommit, GitTag } from "../types/Git";

export class GitService {
  private git: SimpleGit;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.git = simpleGit();
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async isWorkingDirectoryClean(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length === 0;
  }

  async checkoutBranch(branch: string): Promise<void> {
    const branches = await this.git.branchLocal();

    if (branches.all.includes(branch)) {
      await this.git.checkout(branch);
    } else {
      // 尝试检出远程分支
      try {
        await this.git.checkout(["-b", branch, `origin/${branch}`]);
      } catch {
        throw new Error(`分支 '${branch}' 不存在`);
      }
    }
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || "unknown";
  }

  async getLatestTag(): Promise<string | null> {
    try {
      const tags = await this.git.tags(["--sort=-version:refname"]);
      const tagList = tags.all.filter((tag) =>
        tag.startsWith(this.config.git.tagPrefix)
      );
      return tagList[0] || null;
    } catch {
      return null;
    }
  }

  async getCommitsSinceLastTag(branch: string): Promise<GitCommit[]> {
    const latestTag = await this.getLatestTag();
    try {
      if (latestTag) {
        // 获取从最新标签(不含)到当前分支HEAD(含)的提交
        const log = await this.git.log({ from: latestTag, to: branch });
        return log.all
          .filter(
            (c) => c.hash !== log.latest?.hash || log.latest?.hash !== latestTag
          ) // 保守过滤
          .map((commit) => ({
            hash: commit.hash,
            date: commit.date,
            message: commit.message,
            author_name: commit.author_name,
            author_email: commit.author_email,
            refs: commit.refs,
          }));
      }
      // 没有标签时，返回除首次提交外的全部提交以避免把初始化提交也当成“待发布”
      const allLog = await this.git.log();
      return allLog.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        author_email: commit.author_email,
        refs: commit.refs,
      }));
    } catch (error) {
      console.error("获取提交历史失败:", error);
      return [];
    }
  }

  async getCommitsBetweenTags(from: string, to: string): Promise<GitCommit[]> {
    try {
      const log = await this.git.log({
        from,
        to,
        format: {
          hash: "%H",
          date: "%ai",
          message: "%s",
          author_name: "%an",
          author_email: "%ae",
        },
      });

      return log.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        author_email: commit.author_email,
      }));
    } catch {
      return [];
    }
  }

  async getAllTags(): Promise<GitTag[]> {
    try {
      const tags = await this.git.tags([
        "--sort=-version:refname",
        "-l",
        "--format=%(refname:short)|%(objectname)|%(creatordate:iso8601)|%(contents:lines=1)",
      ]);

      return tags.all
        .filter((tag) => tag.startsWith(this.config.git.tagPrefix))
        .map((tagInfo) => {
          const [name, hash, date, message] = tagInfo.split("|");
          return {
            name,
            hash,
            date,
            message: message || undefined,
          };
        });
    } catch {
      return [];
    }
  }

  async commitVersionBump(version: string): Promise<void> {
    // 添加更改的文件
    await this.git.add([
      this.config.files.packageJson,
      this.config.files.changelogFile,
    ]);

    // 提交更改
    const commitMessage = `chore(release): bump version to ${version}`;
    await this.git.commit(commitMessage);
  }

  async createTag(version: string, message?: string): Promise<void> {
    const tagName = `${this.config.git.tagPrefix}${version}`;
    const tagMessage = message || `Release version ${version}`;

    await this.git.addAnnotatedTag(tagName, tagMessage);
  }

  async pushChanges(branch: string, withTags: boolean = true): Promise<void> {
    await this.git.push("origin", branch);

    if (withTags) {
      await this.git.pushTags("origin");
    }
  }

  async safePush(branch: string, withTags: boolean = true): Promise<void> {
    try {
      await this.pushChanges(branch, withTags);
    } catch (e) {
      console.warn('⚠️  push 失败，请手动执行 git push:', (e as any)?.message || e);
    }
  }

  async getBranches(): Promise<GitBranch[]> {
    const branches = await this.git.branchLocal();

    return branches.all.map((name) => ({
      name,
      current: name === branches.current,
      commit: "", // 可以进一步获取每个分支的最新提交
    }));
  }

  async getRemoteUrl(): Promise<string | null> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find((remote) => remote.name === "origin");
      return origin?.refs?.fetch || null;
    } catch {
      return null;
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length > 0 || status.staged.length > 0;
  }

  async getLastCommit(): Promise<GitCommit | null> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      const commit = log.latest;

      if (!commit) return null;

      return {
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        author_email: commit.author_email,
      };
    } catch {
      return null;
    }
  }
}
