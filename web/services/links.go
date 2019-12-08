package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/eklstructs"
	log "github.com/sirupsen/logrus"
)

func GetLinks() []eklstructs.EklhadLink {
	jsonFilePath, err := filepath.Abs("./data/enriched-gsheets-links.json")
	if err != nil {
		log.Error(err)
	}

	linksJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer linksJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(linksJSONFile)
	var links []eklstructs.EklhadLink
	json.Unmarshal(jsonBytes, &links)

	return links
}
