package main

import (
	"encoding/json"
	"net/http"

	"github.com/dahlke/eklhad/web/services"
)

func apiLocationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	locations := services.GetLocationsGeoJSON()
	json.NewEncoder(w).Encode(locations)
}

func apiLinksHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	links := services.GetLinks()
	json.NewEncoder(w).Encode(links)
}

func htmlHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "frontend/public/index.html")
}

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", htmlHandler)
	http.HandleFunc("/api/locations", apiLocationsHandler)
	http.HandleFunc("/api/links", apiLinksHandler)

	http.ListenAndServe(":8080", nil)
}
