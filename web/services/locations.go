package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/eklhad_structs"
	log "github.com/sirupsen/logrus"
)

// TODO: make this a constant in a file.
const LOCATIONS_DATA_PATH = "./data/gsheets/locations/data.json"

func GetLocations() []eklhad_structs.EklhadLocation {
	jsonFilePath, err := filepath.Abs(LOCATIONS_DATA_PATH)
	if err != nil {
		log.Error(err)
	}

	locationsJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer locationsJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(locationsJSONFile)
	var locations []eklhad_structs.EklhadLocation
	json.Unmarshal(jsonBytes, &locations)

	return locations
}
