import { CommitParser } from '../utils/CommitParser';

describe('CommitParser', () => {
  describe('parseConventionalCommit', () => {
    it('should parse basic conventional commit', () => {
      const message = 'feat: add new feature';
      const result = CommitParser.parseConventionalCommit(message);
      
      expect(result).toEqual({
        type: 'feat',
        subject: 'add new feature',
        breaking: false,
        scope: undefined,
        body: undefined,
        footer: undefined
      });
    });

    it('should parse commit with scope', () => {
      const message = 'fix(auth): resolve login issue';
      const result = CommitParser.parseConventionalCommit(message);
      
      expect(result).toEqual({
        type: 'fix',
        scope: 'auth',
        subject: 'resolve login issue',
        breaking: false,
        body: undefined,
        footer: undefined
      });
    });

    it('should parse breaking change with exclamation', () => {
      const message = 'feat!: introduce breaking API change';
      const result = CommitParser.parseConventionalCommit(message);
      
      expect(result).toEqual({
        type: 'feat',
        subject: 'introduce breaking API change',
        breaking: true,
        scope: undefined,
        body: undefined,
        footer: undefined
      });
    });

    it('should parse commit with body and BREAKING CHANGE', () => {
      const message = `feat: add new API

This is the body content.

BREAKING CHANGE: API signature changed`;
      const result = CommitParser.parseConventionalCommit(message);
      
      expect(result.breaking).toBe(true);
      expect(result.type).toBe('feat');
      expect(result.body).toContain('This is the body content.');
    });

    it('should handle non-conventional commits', () => {
      const message = 'some random commit message';
      const result = CommitParser.parseConventionalCommit(message);
      
      expect(result).toEqual({
        subject: 'some random commit message',
        body: undefined
      });
    });
  });

  describe('extractIssues', () => {
    it('should extract issue references', () => {
      const message = 'fix: resolve bug fixes #123 and closes #456';
      const issues = CommitParser.extractIssues(message);
      
      expect(issues).toEqual(['#123', '#456']);
    });

    it('should handle different issue formats', () => {
      const message = 'feat: new feature resolves #789';
      const issues = CommitParser.extractIssues(message);
      
      expect(issues).toEqual(['#789']);
    });

    it('should return empty array when no issues found', () => {
      const message = 'feat: new feature without issues';
      const issues = CommitParser.extractIssues(message);
      
      expect(issues).toEqual([]);
    });
  });

  describe('hasBreakingChange', () => {
    it('should detect breaking change with exclamation', () => {
      const message = 'feat!: breaking change';
      expect(CommitParser.hasBreakingChange(message)).toBe(true);
    });

    it('should detect BREAKING CHANGE footer', () => {
      const message = `feat: new feature

BREAKING CHANGE: this breaks things`;
      expect(CommitParser.hasBreakingChange(message)).toBe(true);
    });

    it('should return false for non-breaking changes', () => {
      const message = 'feat: normal feature';
      expect(CommitParser.hasBreakingChange(message)).toBe(false);
    });
  });

  describe('formatCommitForDisplay', () => {
    it('should format conventional commit for display', () => {
      const commit = {
        hash: '1234567890abcdef',
        message: 'feat(auth): add login functionality'
      };
      
      const formatted = CommitParser.formatCommitForDisplay(commit);
      expect(formatted).toBe('1234567 feat(auth): add login functionality');
    });

    it('should format breaking change commit', () => {
      const commit = {
        hash: '1234567890abcdef',
        message: 'feat!: breaking API change'
      };
      
      const formatted = CommitParser.formatCommitForDisplay(commit);
      expect(formatted).toBe('1234567 feat!: breaking API change');
    });

    it('should handle non-conventional commits', () => {
      const commit = {
        hash: '1234567890abcdef',
        message: 'random commit message'
      };
      
      const formatted = CommitParser.formatCommitForDisplay(commit);
      expect(formatted).toBe('1234567 random commit message');
    });
  });
});
