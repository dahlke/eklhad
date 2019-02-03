package main

import (
	"html/template"
	"net/http"

	"github.com/dahlke/eklhad/web/services"
)

type TemplatePayload struct {
	Links     *services.EklhadLinksTyped
	Locations *[]services.EklhadLocation
}

func handler(w http.ResponseWriter, r *http.Request) {
	eklhadLinks := services.GetLinks()
	eklhadLocations := services.GetLocations()

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
