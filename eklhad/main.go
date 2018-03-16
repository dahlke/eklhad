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
}

func getLinks() EklhadLinks {
	db, err := sql.Open("mysql", "root:@tcp(hal.memcompute.com:3306)/eklhad")
	if err != nil {
		panic(err)
	}

	linksRows, err := db.Query("SELECT * FROM links")
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
		} else {
			eklhadLinks.PressLinks = append(eklhadLinks.PressLinks, eklhadLink)
		}

	}

	return eklhadLinks
}

func handler(w http.ResponseWriter, r *http.Request) {
	eklhadLinks := getLinks()
	t, _ := template.ParseFiles("templates/index.html")
	t.ExecuteTemplate(w, "index", &eklhadLinks)
}

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", handler)
	http.ListenAndServe(":8080", nil)
}
