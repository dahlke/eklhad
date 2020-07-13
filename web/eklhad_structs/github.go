package eklhad_structs

import "github.com/google/go-github/github"

type GitHubDailyCommitActivityForRepo struct {
	RepoName   string `json:"repo_name"`
	Timestamp  int64  `json:"timestamp"`
	NumCommits int    `json:"num_commits"`
}

type GitHubActivitySingleRepo struct {
	RepoName       string                         `json:"repo_name"`
	CommitActivity []*github.WeeklyCommitActivity `json:"commit_activity"`
}
