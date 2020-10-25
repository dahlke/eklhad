package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

// GetGitHubActivity reads the cached activity data from the file system and returns it.
func GetGitHubActivity() []structs.GitHubDailyCommitActivityForRepo {
	jsonFilePath, err := filepath.Abs(constants.GitHubActivityPath)
	if err != nil {
		log.Error(err)
	}

	githubActivityJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer githubActivityJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(githubActivityJSONFile)
	var githubActivity []structs.GitHubDailyCommitActivityForRepo
	json.Unmarshal(jsonBytes, &githubActivity)

	return githubActivity
}
