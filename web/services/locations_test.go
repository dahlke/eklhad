package services

import (
	"testing"
)

var SOUTH_BEND_ID int64 = 43

func TestLocations(t *testing.T) {
	locations := GetLocations()
	firstLocationID := locations[0].ID
	if firstLocationID != SOUTH_BEND_ID {
		t.Errorf("ID was incorrect, got: %d, want: %d.", firstLocationID, SOUTH_BEND_ID)
	}
}
