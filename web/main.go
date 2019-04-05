package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"os"

	"github.com/dahlke/eklhad/web/services"
)

type templatePayload struct {
	APIHost string
	APIPort int
}

// TODO: Take as a CLI arg
const APP_PORT = 80

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
	t, _ := template.ParseFiles("frontend/build/index.html")
	hostName, _ := os.Hostname()
	payload := templatePayload{hostName, 8000}
	t.Execute(w, &payload)
}

func main() {
	fs := http.FileServer(http.Dir("frontend/build/"))
	http.Handle("/static/", fs)

	http.HandleFunc("/", htmlHandler)
	http.HandleFunc("/api/locations", apiLocationsHandler)
	http.HandleFunc("/api/links", apiLinksHandler)

	http.ListenAndServe(fmt.Sprintf(":%d", APP_PORT), nil)
}
