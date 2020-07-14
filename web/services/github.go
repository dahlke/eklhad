package services

import (
	"encoding/json"
	"io/ioutil"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
)

// GetGitHubActivity reads the cached activity data from the file system and returns it.
func GetGitHubActivity() []structs.GitHubDailyCommitActivityForRepo {
	rawFileContents, _ := ioutil.ReadFile(constants.GitHubActivityPath)
	githubActivity := []structs.GitHubDailyCommitActivityForRepo{}
	_ = json.Unmarshal([]byte(rawFileContents), &githubActivity)
	return githubActivity
}
