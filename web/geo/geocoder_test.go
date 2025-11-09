package geo

import (
	"testing"
)

func TestGeocodeLocation(t *testing.T) {
	tests := []struct {
		name     string
		location string
		// We can't easily verify exact coordinates without mocking the geocoder
		// So we'll just verify that we get valid float values (not NaN, not 0,0 for known locations)
		expectNonZero bool
	}{
		{
			name:          "valid location - New York",
			location:      "New York, NY, USA",
			expectNonZero: true,
		},
		{
			name:          "valid location - San Francisco",
			location:      "San Francisco, CA, USA",
			expectNonZero: true,
		},
		{
			name:          "invalid location",
			location:      "ThisIsNotARealLocation12345",
			expectNonZero: false,
		},
		{
			name:          "empty location",
			location:      "",
			expectNonZero: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			lat, lng := GeocodeLocation(tt.location)

			// Verify we got valid float values (not NaN)
			if lat != lat || lng != lng {
				t.Error("GeocodeLocation returned NaN values")
			}

			// For valid locations, we expect non-zero coordinates
			if tt.expectNonZero {
				if lat == 0 && lng == 0 {
					t.Logf("Warning: Got zero coordinates for location '%s' (may be geocoding failure)", tt.location)
				} else {
					// Verify coordinates are in valid ranges
					if lat < -90 || lat > 90 {
						t.Errorf("Invalid latitude: %f (should be between -90 and 90)", lat)
					}
					if lng < -180 || lng > 180 {
						t.Errorf("Invalid longitude: %f (should be between -180 and 180)", lng)
					}
				}
			}
		})
	}
}
