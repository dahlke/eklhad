package services

import (
	"encoding/json"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
)

// GetLinks reads the links data from GCS
func GetLinks() []structs.EklhadLink {
	jsonBytes := ReadJSONFromGCS(constants.GCSPrivateBucketName, constants.LinkDataGCSFilePath)
	var links []structs.EklhadLink
	json.Unmarshal(jsonBytes, &links)

	return links
}
