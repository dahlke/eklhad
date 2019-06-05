package services

import (
	"os"
	"testing"
)

var SCPR_HACKDAY_ID int64 = 21

func TestLinks(t *testing.T) {
	os.Chdir("../")
	links := GetLinks()
	firstLink := links[0]

	if firstLink.ID != SCPR_HACKDAY_ID {
		t.Errorf("Link ID was incorrect, got: %d, want: %d.", firstLink.ID, SCPR_HACKDAY_ID)
	}
}
