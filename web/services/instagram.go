package services

import (
	"encoding/json"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
)

// GetInstagrams reads the Instagram JSON data from GCS
func GetInstagrams() []structs.InstagramMedia {
	jsonBytes := ReadJSONFromGCS(constants.GCSPrivateBucketName, constants.InstagramDataGCSFilePath)
	var instagrams []structs.InstagramMedia
	json.Unmarshal(jsonBytes, &instagrams)

	return instagrams
}
