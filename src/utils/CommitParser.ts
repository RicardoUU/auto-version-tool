export class CommitParser {
  /**
   * 解析 Conventional Commits 格式的提交信息
   * 格式：<type>[optional scope]: <description>
   */
  static parseConventionalCommit(message: string): {
    type?: string;
    scope?: string;
    breaking?: boolean;
    subject?: string;
    body?: string;
    footer?: string;
  } {
    const lines = message.split('\n');
    const firstLine = lines[0];
    
    // 匹配 conventional commit 格式
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\([^)]+\))?(!)?: (.+)$/;
    const match = firstLine.match(conventionalPattern);
    
    if (!match) {
      return {
        subject: firstLine,
        body: lines.slice(1).join('\n').trim() || undefined
      };
    }
    
    const [, type, scopeMatch, breaking, subject] = match;
    const scope = scopeMatch ? scopeMatch.slice(1, -1) : undefined;
    const body = lines.slice(1, -1).join('\n').trim() || undefined;
    const footer = lines[lines.length - 1]?.trim() || undefined;
    
    // 检查是否包含 BREAKING CHANGE
    const hasBreakingInBody = /BREAKING CHANGE/i.test(body || '');
    const hasBreakingInFooter = /BREAKING CHANGE/i.test(footer || '');
    
    return {
      type,
      scope,
      breaking: !!breaking || hasBreakingInBody || hasBreakingInFooter,
      subject,
      body,
      footer
    };
  }

  /**
   * 提取提交信息中的 issue 引用
   */
  static extractIssues(message: string): string[] {
    const issuePattern = /#(\d+)|closes?\s+#(\d+)|fixes?\s+#(\d+)|resolves?\s+#(\d+)/gi;
    const matches = [...message.matchAll(issuePattern)];
    
    return matches
      .map(match => match[1] || match[2] || match[3] || match[4])
      .filter(Boolean)
      .map(issue => `#${issue}`);
  }

  /**
   * 检查提交是否包含破坏性更改
   */
  static hasBreakingChange(message: string): boolean {
    // 检查感叹号标记
    if (/^[^:]+!:/.test(message)) return true;
    
    // 检查 BREAKING CHANGE footer
    if (/BREAKING CHANGE/i.test(message)) return true;
    
    return false;
  }

  /**
   * 格式化提交信息用于显示
   */
  static formatCommitForDisplay(commit: any): string {
    const parsed = this.parseConventionalCommit(commit.message);
    const shortHash = commit.hash.substring(0, 7);
    
    let formatted = `${shortHash}`;
    
    if (parsed.type) {
      formatted += ` ${parsed.type}`;
      
      if (parsed.scope) {
        formatted += `(${parsed.scope})`;
      }
      
      if (parsed.breaking) {
        formatted += '!';
      }
      
      formatted += ': ';
    }
    
    formatted += parsed.subject || commit.message.split('\n')[0];
    
    return formatted;
  }
}
