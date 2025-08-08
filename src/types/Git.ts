export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
  refs?: string;
}

export interface GitTag {
  name: string;
  hash: string;
  date: string;
  message?: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
}
