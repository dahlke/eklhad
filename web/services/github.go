package services

import (
	"encoding/json"
	"io/ioutil"

	"github.com/dahlke/eklhad/web/eklhad_structs"
)

// TODO
const GITHUB_ACTIVITY_PATH = "./data/github/activity.json"

func GetGitHubActivity() []eklhad_structs.GitHubDailyCommitActivityForRepo {
	rawFileContents, _ := ioutil.ReadFile(GITHUB_ACTIVITY_PATH)
	githubActivity := []eklhad_structs.GitHubDailyCommitActivityForRepo{}
	_ = json.Unmarshal([]byte(rawFileContents), &githubActivity)
	return githubActivity
}
