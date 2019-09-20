package services

import (
	"fmt"
	"testing"
)

var SOUTH_BEND_ID float64 = 0
var SAN_FRANCISCO_ID float64 = 60

func TestLocations(t *testing.T) {
	locations := GetLocationsGeoJSON().Features
	firstLocationID := locations[0].Properties["id"]
	fmt.Println(locations[0].Properties["id"])
	if firstLocationID != SOUTH_BEND_ID {
		t.Errorf("ID was incorrect, got: %f, want: %f.", firstLocationID, SOUTH_BEND_ID)
	}
}

func TestCurrentLocation(t *testing.T) {
	currentLocation := GetCurrentLocationGeoJSON()
	currentLocationID := currentLocation.Properties["id"]
	if currentLocationID != SAN_FRANCISCO_ID {
		t.Errorf("ID was incorrect, got: %f, want: %f.", currentLocationID, SAN_FRANCISCO_ID)
	}
}
