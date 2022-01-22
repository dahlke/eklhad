package services

import (
	"testing"
)

const ExpectedID string = "location-0"

func TestLocations(t *testing.T) {
	locations := GetLocations()
	firstLocationID := locations[0].ID

	if firstLocationID != ExpectedID {
		t.Errorf("ID was incorrect, got: %s, want: %s.", firstLocationID, ExpectedID)
	}
}
