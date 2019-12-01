package services

import (
	"os"
	"testing"
)

var SCPR_HACKDAY_ID string = "cokwr"

func TestLinks(t *testing.T) {
	os.Chdir("../")
	links := GetLinks()
	firstLink := links[0]

	if firstLink.ID != SCPR_HACKDAY_ID {
		t.Errorf("Link ID was incorrect, got: %s, want: %s.", firstLink.ID, SCPR_HACKDAY_ID)
	}
}
