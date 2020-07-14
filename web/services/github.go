package services

import (
	"encoding/json"
	"io/ioutil"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/eklhad_structs"
)

func GetGitHubActivity() []eklhad_structs.GitHubDailyCommitActivityForRepo {
	rawFileContents, _ := ioutil.ReadFile(constants.GITHUB_ACTIVITY_PATH)
	githubActivity := []eklhad_structs.GitHubDailyCommitActivityForRepo{}
	_ = json.Unmarshal([]byte(rawFileContents), &githubActivity)
	return githubActivity
}
