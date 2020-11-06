package services

import (
	"encoding/json"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
)

// GetLocations reads the locations data from GCS
func GetLocations() []structs.EklhadLocation {
	jsonBytes := ReadJSONFromGCS(constants.GCSPrivateBucketName, constants.LocationDataGCSFilePath)
	var locations []structs.EklhadLocation
	json.Unmarshal(jsonBytes, &locations)

	return locations
}
