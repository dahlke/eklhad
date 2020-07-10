package services

import (
	"encoding/json"
	"io/ioutil"

	"github.com/dahlke/eklhad/web/eklhad_structs"
)

func GetGitHubEvents() []eklhad_structs.GitHubEvent {
	rawFileContents, _ := ioutil.ReadFile("./data/github/data.json")
	githubEvents := []eklhad_structs.GitHubEvent{}
	_ = json.Unmarshal([]byte(rawFileContents), &githubEvents)
	return githubEvents
}
