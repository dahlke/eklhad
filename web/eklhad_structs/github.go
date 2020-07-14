package eklhad_structs

type GitHubDailyCommitActivityForRepo struct {
	RepoName   string `json:"repo_name"`
	Timestamp  int64  `json:"timestamp"`
	NumCommits int    `json:"num_commits"`
}
