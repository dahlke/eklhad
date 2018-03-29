package main

import (
	"database/sql"
	_ "github.com/go-sql-driver/mysql"
	"html/template"
	"net/http"
)

type EklhadLink struct {
	Id       int64
	Name     string
	Date     string
	LinkType string
	Url      string
}

type EklhadLinks struct {
	PressLinks []EklhadLink
	DemoLinks  []EklhadLink
	BlogLinks  []EklhadLink
	TalkLinks  []EklhadLink
}

type EklhadLocation struct {
	Id   int64
	Name string
	Lng  string
	Lat  string
}

type TemplatePayload struct {
	Links     *EklhadLinks
	Locations *[]EklhadLocation
}

func getLocations() []EklhadLocation {
	db, err := sql.Open("mysql", "root:@tcp(localhost:3306)/eklhad")
	if err != nil {
		panic(err)
	}

	linksRows, err := db.Query(`
		SELECT
			id,
			name,
			SUBSTRING_INDEX(REPLACE(REPLACE(latlng, "POINT(", ""), ")", ""), " ", 1) AS lng,
			SUBSTRING_INDEX(REPLACE(REPLACE(latlng, "POINT(", ""), ")", ""), " ", -1) AS lat
		FROM locations;
	`)

	if err != nil {
		panic(err)
	}

	eklhadLocations := []EklhadLocation{}
	eklhadLocation := EklhadLocation{}

	for linksRows.Next() {
		// Scan the value to []byte
		err = linksRows.Scan(
			&eklhadLocation.Id,
			&eklhadLocation.Name,
			&eklhadLocation.Lng,
			&eklhadLocation.Lat,
		)

		if err != nil {
			panic(err.Error()) // Just for example purpose. You should use proper error handling instead of panic
		}
		eklhadLocations = append(eklhadLocations, eklhadLocation)
	}

	return eklhadLocations
}

func getLinks() EklhadLinks {
	db, err := sql.Open("mysql", "root:@tcp(localhost:3306)/eklhad")
	if err != nil {
		panic(err)
	}

	linksRows, err := db.Query("SELECT * FROM links ORDER BY date DESC")
	if err != nil {
		panic(err)
	}

	eklhadLinks := EklhadLinks{}
	eklhadLink := EklhadLink{}
	for linksRows.Next() {
		// Scan the value to []byte
		err = linksRows.Scan(
			&eklhadLink.Id,
			&eklhadLink.Name,
			&eklhadLink.Date,
			&eklhadLink.LinkType,
			&eklhadLink.Url,
		)

		if err != nil {
			panic(err.Error()) // Just for example purpose. You should use proper error handling instead of panic
		}

		if eklhadLink.LinkType == "demo" {
			eklhadLinks.DemoLinks = append(eklhadLinks.DemoLinks, eklhadLink)
		} else if eklhadLink.LinkType == "press" {
			eklhadLinks.PressLinks = append(eklhadLinks.PressLinks, eklhadLink)
		} else if eklhadLink.LinkType == "talk" {
			eklhadLinks.TalkLinks = append(eklhadLinks.TalkLinks, eklhadLink)
		} else {
			eklhadLinks.BlogLinks = append(eklhadLinks.BlogLinks, eklhadLink)
		}

	}

	return eklhadLinks
}

func handler(w http.ResponseWriter, r *http.Request) {
	eklhadLocations := getLocations()
	eklhadLinks := getLinks()
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
