package services

import (
	"encoding/json"

	"github.com/dahlke/eklhad/web/constants"
	goramma_structs "github.com/dahlke/goramma/structs"
)

// GetInstagrams reads the Instagram JSON data from GCS
func GetInstagrams() []goramma_structs.InstagramMedia {
	jsonBytes := ReadJSONFromGCS(constants.GCSPrivateBucketName, constants.InstagramDataGCSFilePath)
	var instagrams []goramma_structs.InstagramMedia
	json.Unmarshal(jsonBytes, &instagrams)

	return instagrams
}
