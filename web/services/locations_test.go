package services

import (
	"testing"
)

var BUENOS_AIRES_ID string = "cokwr"

func TestLocations(t *testing.T) {
	locations := GetLocations()
	firstLocationID := locations[0].ID

	if firstLocationID != BUENOS_AIRES_ID {
		t.Errorf("ID was incorrect, got: %s, want: %s.", firstLocationID, BUENOS_AIRES_ID)
	}
}
