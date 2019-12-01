package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	log "github.com/sirupsen/logrus"
)

func GetLocations() []eklhadTravel {
	jsonFilePath, err := filepath.Abs("./services/data/enriched-gsheets-travels.json")
	if err != nil {
		log.Error(err)
	}

	travelsJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer travelsJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(travelsJSONFile)
	var travels []eklhadTravel
	json.Unmarshal(jsonBytes, &travels)

	return travels
}
