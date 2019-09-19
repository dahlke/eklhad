package services

import (
	"fmt"
	"testing"
)

var SOUTH_BEND_ID float64 = 0

func TestLocations(t *testing.T) {
	locations := GetLocationsGeoJSON().Features
	firstLocationID := locations[0].Properties["id"]
	fmt.Println(locations[0].Properties["id"])
	if firstLocationID != SOUTH_BEND_ID {
		t.Errorf("ID was incorrect, got: %f, want: %f.", firstLocationID, SOUTH_BEND_ID)
	}
}
