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

type appConfig struct {
	GSheetID          string `json:"g_sheet_id"`
	GitHubUsername    string `json:"github_username"`
	GravatarEmail     string `json:"gravatar_email"`
	InstagramUsername string `json:"instagram_username"`
}

type appSecrets struct {
	GitHubPersonalAccessToken string `json:"github_personal_access_token"`
}

var appHostName, _ = os.Hostname()
var appPort = 80
var appConfigData appConfig

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

func apiGravatarHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	json.NewEncoder(w).Encode(appConfigData.GravatarEmail)
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

func parseConfig(configJSONPath string) appConfig {
	configJSONFile, err := os.Open(configJSONPath)
	if err != nil {
		log.Error(err)
	}
	defer configJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(configJSONFile)
	var config appConfig
	json.Unmarshal(jsonBytes, &config)

	return config
}

func main() {
	portPtr := flag.Int("port", 80, "The port to run the HTTP app on.")
	productionPtr := flag.Bool("production", false, "If true, run the app over HTTPS.")
	pullGSheetsPtr := flag.Bool("gsheets", false, "If true, pull the latest data from Google Sheets. ID specified in config.json.")
	pullInstagramPtr := flag.Bool("instagram", false, "If true, pull only the latest data from Instagram. Username specified in config.json.")
	flag.Parse()

	configLogger()
	appConfigData = parseConfig("config.json")

	appPort = *portPtr
	isProduction := *productionPtr
	isPullGSheets := *pullGSheetsPtr
	isPullInstagram := *pullInstagramPtr

	fileServer := http.FileServer(http.Dir("frontend/build/"))

	http.HandleFunc("/", htmlHandler)
	http.Handle("/static/", fileServer)
	http.HandleFunc("/api/locations", apiLocationsHandler)
	http.HandleFunc("/api/links", apiLinksHandler)
	http.HandleFunc("/api/instagrams", apiInstagramsHandler)
	http.HandleFunc("/api/gravatar", apiGravatarHandler)

	// TODO: make the workers run in go routines constantly
	if isPullGSheets {
		workers.GetDataFromGSheets(appConfigData.GSheetID)
	} else if isPullInstagram {
		workers.GetDataFromInstagramForUser(appConfigData.InstagramUsername)
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
