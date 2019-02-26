package main

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/dahlke/eklhad/web/services"
	geojson "github.com/paulmach/go.geojson"
)

type TemplatePayload struct {
	Links     *services.EklhadLinksTyped
	Locations geojson.FeatureCollection
}

func handler(w http.ResponseWriter, r *http.Request) {
	eklhadLinks := services.GetLinks()
	eklhadLocations := services.GetLocationsGeoJSON()

	payload := TemplatePayload{&eklhadLinks, eklhadLocations}
	t, _ := template.ParseFiles("templates/index.html")
	t.ExecuteTemplate(w, "index", &payload)
}

func main() {
	fmt.Println("Neilio")
	fmt.Println(services.GetLocationsGeoJSON())
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", handler)
	http.ListenAndServe(":8080", nil)
}
