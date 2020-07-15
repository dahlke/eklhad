package services

import (
	"testing"
)

// TODO: make this test more generic
const SCPRDHackDayID string = "cokwr"

func TestLinks(t *testing.T) {
	// os.Chdir("../")
	links := GetLinks()
	firstLink := links[0]

	if firstLink.ID != SCPRDHackDayID {
		t.Errorf("Link ID was incorrect, got: %s, want: %s.", firstLink.ID, SCPRDHackDayID)
	}
}
