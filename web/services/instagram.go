package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	log "github.com/sirupsen/logrus"
)

func GetInstagrams() []instagramGraphImage {
	// https://github.com/rarcega/instagram-scraper
	jsonFilePath, err := filepath.Abs("./services/data/instagram/eklhad/eklhad.json")
	if err != nil {
		log.Error(err)
	}

	instaMetaDataFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer instaMetaDataFile.Close()

	jsonBytes, _ := ioutil.ReadAll(instaMetaDataFile)
	var igMetaData instagramMetadata
	json.Unmarshal(jsonBytes, &igMetaData)

	return igMetaData.GraphImages
}
