package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
)

type EklhadLink struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Date string `json:"date"`
	Type string `json:"type"`
	Url  string `json:"url"`
}

type EklhadLinksAll struct {
	Links []EklhadLink `json:"links"`
}

func GetLinks() []EklhadLink {
	var rawLinks EklhadLinksAll
	var links []EklhadLink

	absLinksJsonPath, err := filepath.Abs("./services/data/links.json")
	if err != nil {
		fmt.Println(err)
	}

	linksJsonFile, err := os.Open(absLinksJsonPath)
	if err != nil {
		fmt.Println(err)
	}
	defer linksJsonFile.Close()

	linksByteValue, _ := ioutil.ReadAll(linksJsonFile)

	json.Unmarshal(linksByteValue, &rawLinks)

	for i := 0; i < len(rawLinks.Links); i++ {
		tmpLink := rawLinks.Links[i]
		links = append(links, tmpLink)
	}

	return links
}
