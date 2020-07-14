package services

import (
	"testing"
)

const BuenosAiresID string = "cokwr"

func TestLocations(t *testing.T) {
	locations := GetLocations()
	firstLocationID := locations[0].ID

	if firstLocationID != BuenosAiresID {
		t.Errorf("ID was incorrect, got: %s, want: %s.", firstLocationID, BuenosAiresID)
	}
}
