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

type EklhadLinksTyped struct {
	PressLinks   []EklhadLink
	DemoLinks    []EklhadLink
	BlogLinks    []EklhadLink
	TalkLinks    []EklhadLink
	WebinarLinks []EklhadLink
}

func GetLinks() EklhadLinksTyped {
	var allLinks EklhadLinksAll
	var links EklhadLinksTyped

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

	json.Unmarshal(linksByteValue, &allLinks)

	for i := 0; i < len(allLinks.Links); i++ {
		tmpLink := allLinks.Links[i]
		if tmpLink.Type == "demo" {
			links.DemoLinks = append(links.DemoLinks, tmpLink)
		} else if tmpLink.Type == "press" {
			links.PressLinks = append(links.PressLinks, tmpLink)
		} else if tmpLink.Type == "talk" {
			links.TalkLinks = append(links.TalkLinks, tmpLink)
		} else if tmpLink.Type == "webinar" {
			links.WebinarLinks = append(links.WebinarLinks, tmpLink)
		} else {
			links.BlogLinks = append(links.BlogLinks, tmpLink)
		}
	}

	return links
}
