package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/eklstructs"
	log "github.com/sirupsen/logrus"
)

func GetInstagrams() []eklstructs.InstagramGraphImage {
	// https://github.com/rarcega/instagram-scraper
	jsonFilePath, err := filepath.Abs("./data/instagram/eklhad/eklhad.json")
	if err != nil {
		log.Error(err)
	}

	instaMetaDataFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer instaMetaDataFile.Close()

	jsonBytes, _ := ioutil.ReadAll(instaMetaDataFile)
	var igMetaData eklstructs.InstagramMetadata
	json.Unmarshal(jsonBytes, &igMetaData)

	return igMetaData.GraphImages
}
