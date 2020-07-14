package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/eklhad_structs"
	log "github.com/sirupsen/logrus"
)

func GetLinks() []eklhad_structs.EklhadLink {
	jsonFilePath, err := filepath.Abs(constants.LINKS_DATA_PATH)
	if err != nil {
		log.Error(err)
	}

	linksJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer linksJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(linksJSONFile)
	var links []eklhad_structs.EklhadLink
	json.Unmarshal(jsonBytes, &links)

	return links
}
