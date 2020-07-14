package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

// GetLocations reads the cached locations data from the file system and returns it.
func GetLocations() []structs.EklhadLocation {
	jsonFilePath, err := filepath.Abs(constants.LocationsDataPath)
	if err != nil {
		log.Error(err)
	}

	locationsJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer locationsJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(locationsJSONFile)
	var locations []structs.EklhadLocation
	json.Unmarshal(jsonBytes, &locations)

	return locations
}
