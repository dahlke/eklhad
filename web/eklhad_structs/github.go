package eklhad_structs

type GitHubEvent struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	RepoName  string `json:"repo_name"`
	Timestamp int64  `json:"timestamp"`
}
