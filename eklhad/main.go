package main

import (
	"html/template"
	"net/http"
	"os"
	"fmt"
	"io/ioutil"
	"encoding/json"
)

type EklhadLink struct {
	Id   int64 `json:"id"`
	Name string  `json:"name"`
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

type EklhadLocation struct {
	Id   int64 `json:"id"`
	Name string  `json:"name"`
	Lat  string `json:"lat"`
	Lng  string `json:"lng"`
}

type EklhadLocations struct {
	Locations []EklhadLocation `json:"locations"`
}

type TemplatePayload struct {
	Links     *EklhadLinksTyped
	Locations *[]EklhadLocation
}

func getLinks() EklhadLinksTyped {
	var allLinks EklhadLinksAll
	var links EklhadLinksTyped

	linksJsonFile, err := os.Open("data/links.json")
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

func getLocations() []EklhadLocation {
	locationsJsonFile, err := os.Open("data/locations.json")
	if err != nil {
		fmt.Println(err)
	}
	defer locationsJsonFile.Close()

	locationsByteValue, _ := ioutil.ReadAll(locationsJsonFile)

	var allLocations EklhadLocations
	json.Unmarshal(locationsByteValue, &allLocations)

	return allLocations.Locations
}

func handler(w http.ResponseWriter, r *http.Request) {
	eklhadLinks := getLinks()
	fmt.Println("neil", eklhadLinks)

	eklhadLocations := getLocations()
	
	payload := TemplatePayload{&eklhadLinks, &eklhadLocations}
	t, _ := template.ParseFiles("templates/index.html")
	t.ExecuteTemplate(w, "index", &payload)
}

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", handler)
	http.ListenAndServe(":8080", nil)
}