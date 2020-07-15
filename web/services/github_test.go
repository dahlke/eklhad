package services

import (
	"os"
	"strings"
	"testing"
)

// TODO: make this test more generic
const WorkOrg = "hashicorp"
const PersonalOrg = "dahlke"

func TestGitHubActivity(t *testing.T) {
	// TODO: shouldn't have to Change dir here in one test and not in others.
	os.Chdir("../")
	activity := GetGitHubActivity()
	firstActivity := activity[0]

	if !(strings.Contains(firstActivity.RepoName, PersonalOrg) || strings.Contains(firstActivity.RepoName, WorkOrg)) {
		t.Errorf("Not a valid repo org, got: %s, want: %s or %s.", firstActivity.RepoName, PersonalOrg, WorkOrg)
	}
}
