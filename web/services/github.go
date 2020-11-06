package services

import (
	"encoding/json"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
)

// GetGitHubActivity reads the Github data from GCS
func GetGitHubActivity() []structs.GitHubDailyCommitActivityForRepo {
	jsonBytes := ReadJSONFromGCS(constants.GCSPrivateBucketName, constants.GitHubActivityGCSFilePath)
	var githubActivity []structs.GitHubDailyCommitActivityForRepo
	json.Unmarshal(jsonBytes, &githubActivity)
	return githubActivity
}
