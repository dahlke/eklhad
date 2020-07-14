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

// GetLinks reads the cached links data from the file system and returns it.
func GetLinks() []structs.EklhadLink {
	jsonFilePath, err := filepath.Abs(constants.LinksDataPath)
	if err != nil {
		log.Error(err)
	}

	linksJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer linksJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(linksJSONFile)
	var links []structs.EklhadLink
	json.Unmarshal(jsonBytes, &links)

	return links
}
