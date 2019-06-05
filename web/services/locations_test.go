package services

import (
	"testing"
)

var SOUTH_BEND_ID int64 = 43

func TestLocations(t *testing.T) {
	locations := GetLocationsGeoJSON().Features
	firstLocationID := locations[0].Properties["id"]
	if firstLocationID != SOUTH_BEND_ID {
		t.Errorf("ID was incorrect, got: %d, want: %d.", firstLocationID, SOUTH_BEND_ID)
	}
}
