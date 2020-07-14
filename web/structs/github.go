package structs

// GitHubDailyCommitActivityForRepo gives the number of commits per repo per day for the frontend
// https://pkg.go.dev/github.com/google/go-github/v32/github?tab=doc
// https://developer.github.com/v3/repos/statistics/#get-the-last-year-of-commit-activity
type GitHubDailyCommitActivityForRepo struct {
	RepoName   string `json:"repo_name"`
	Timestamp  int64  `json:"timestamp"`
	NumCommits int    `json:"num_commits"`
}
