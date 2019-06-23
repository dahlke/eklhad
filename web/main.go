package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"net/http"
	"os"

	"github.com/dahlke/eklhad/web/services"
	log "github.com/sirupsen/logrus"
)

type templatePayload struct {
	APIHost string
	APIPort int
}

var appHostName, _ = os.Hostname()
var appPort = 80

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
	payload := templatePayload{appHostName, appPort}
	t.Execute(w, &payload)
}

func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	target := "https://" + r.Host + r.URL.Path
	if len(r.URL.RawQuery) > 0 {
		target += "?" + r.URL.RawQuery
	}
	log.Printf("redirect to: %s", target)
	http.Redirect(w, r, target, http.StatusTemporaryRedirect)
}

func configLogger() {
	log.SetFormatter(&log.JSONFormatter{})
	log.SetOutput(os.Stdout)
	log.SetLevel(log.InfoLevel)
}

func main() {
	portPtr := flag.Int("port", 80, "The port to run the HTTP app on.")
	productionPtr := flag.Bool("production", false, "If true, run the app over HTTPS.")
	// TODO: currentLocation - env var or flag?
	flag.Parse()

	configLogger()

	appPort = *portPtr
	isProduction := *productionPtr

	log.Println("Starting file server...")
	fs := http.FileServer(http.Dir("frontend/build/"))
	http.Handle("/static/", fs)
	log.Println("File server started.")

	http.HandleFunc("/", htmlHandler)
	http.HandleFunc("/api/locations", apiLocationsHandler)
	http.HandleFunc("/api/links", apiLinksHandler)

	if isProduction {
		log.Println("Starting HTTPS server...")
		go http.ListenAndServe(fmt.Sprintf(":%d", appPort), http.HandlerFunc(redirectToHTTPS))
		err := http.ListenAndServeTLS(":443", "acme_cert.pem", "acme_private_key.pem", nil)
		log.Fatal(err)
	} else {
		log.Info("Starting HTTP server...")
		err := http.ListenAndServe(fmt.Sprintf(":%d", appPort), nil)
		log.Fatal(err)
	}
}
