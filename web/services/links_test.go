package services

import (
	"testing"
)

var SCPR_HACKDAY_ID int64 = 21

func TestLinks(t *testing.T) {
	links := GetLinks()
	firstLink := links.PressLinks[0]
	if firstLink.ID != SCPR_HACKDAY_ID {
		t.Errorf("Link ID was incorrect, got: %d, want: %d.", firstLink.ID, SCPR_HACKDAY_ID)
	}
}
