package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/eklhad_structs"
	log "github.com/sirupsen/logrus"
)

func GetLocations() []eklhad_structs.EklhadTravel {
	jsonFilePath, err := filepath.Abs("./data/enriched-gsheets-travels.json")
	if err != nil {
		log.Error(err)
	}

	travelsJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer travelsJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(travelsJSONFile)
	var travels []eklhad_structs.EklhadTravel
	json.Unmarshal(jsonBytes, &travels)

	return travels
}
