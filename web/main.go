package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/dahlke/eklhad/web/services"
	"github.com/dahlke/eklhad/web/workers"
	log "github.com/sirupsen/logrus"
)

type templatePayload struct {
	APIHost string
	APIPort int
}

type AppConfig struct {
	GSheetID      string `json:"g_sheet_id"`
	GravatarEmail string `json:"gravatar_email"`
}

var appHostName, _ = os.Hostname()
var appPort = 80

func apiLocationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	locations := services.GetLocations()
	json.NewEncoder(w).Encode(locations)
}

func apiLinksHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	links := services.GetLinks()
	json.NewEncoder(w).Encode(links)
}

func apiInstagramsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	instagrams := services.GetInstagrams()
	json.NewEncoder(w).Encode(instagrams)
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
	log.Println("path", r.URL.Path)
	http.Redirect(w, r, target, http.StatusTemporaryRedirect)
}

func configLogger() {
	log.SetFormatter(&log.JSONFormatter{})
	log.SetOutput(os.Stdout)
	log.SetLevel(log.InfoLevel)
}

func parseConfig(configJSONPath string) AppConfig {
	configJSONFile, err := os.Open(configJSONPath)
	if err != nil {
		log.Error(err)
	}
	defer configJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(configJSONFile)
	var config AppConfig
	json.Unmarshal(jsonBytes, &config)

	return config
}

func main() {
	portPtr := flag.Int("port", 80, "The port to run the HTTP app on.")
	productionPtr := flag.Bool("production", false, "If true, run the app over HTTPS.")
	pullGSheetsPtr := flag.Bool("gsheets", false, "If true, pull the latest data from Google Sheets. ID specified in config.json.")
	flag.Parse()

	configLogger()
	appConfig := parseConfig("config.json")

	appPort = *portPtr
	isProduction := *productionPtr
	isPullGSheets := *pullGSheetsPtr

	fileServer := http.FileServer(http.Dir("frontend/build/"))

	http.HandleFunc("/", htmlHandler)
	http.Handle("/static/", fileServer)
	http.HandleFunc("/api/locations", apiLocationsHandler)
	http.HandleFunc("/api/links", apiLinksHandler)
	http.HandleFunc("/api/instagrams", apiInstagramsHandler)

	if isPullGSheets {
		// TODO: have this be a worker that pulls constantly, adds timestamped files, and removes the oldest if no errors.
		workers.GetDataFromGSheets(appConfig.GSheetID)
	} else if isProduction {
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
