package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	log "github.com/sirupsen/logrus"
)

func GetLinks() []eklhadLink {
	jsonFilePath, err := filepath.Abs("./services/data/enriched-gsheets-links.json")
	if err != nil {
		log.Error(err)
	}

	linksJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer linksJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(linksJSONFile)
	var links []eklhadLink
	json.Unmarshal(jsonBytes, &links)

	return links
}
