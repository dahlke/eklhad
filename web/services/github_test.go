package services

import (
	"testing"
)

func TestGitHubActivity(t *testing.T) {
	activity := GetGitHubActivity()

	if len(activity) == 0 {
		t.Errorf("Received no data back from GitHub Activity service.")
	}
}
