package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/eklstructs"
	log "github.com/sirupsen/logrus"
)

func GetLocations() []eklstructs.EklhadTravel {
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
	var travels []eklstructs.EklhadTravel
	json.Unmarshal(jsonBytes, &travels)

	return travels
}
