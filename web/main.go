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
	GSheetID           string `json:"g_sheet_id"`
	GravatarEmail      string `json:"gravatar_email"`
	WorkerMinSleepMins int    `json:"worker_min_sleep_mins"`
}

var appHostName, _ = os.Hostname()
var appPort = 3554
var appConfigData appConfig

func apiLocationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	locations := services.GetLocations()
	json.NewEncoder(w).Encode(locations)
}

func apiBlogsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	blogs := services.GetBlogs()
	json.NewEncoder(w).Encode(blogs)
}

func apiLinksHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	links := services.GetLinks()
	json.NewEncoder(w).Encode(links)
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

func scheduleWorkers(config appConfig) {
	go workers.ScheduleGSheetsWork(config.WorkerMinSleepMins, config.GSheetID)
}

func main() {
	portPtr := flag.Int("port", appPort, "The port to run the HTTP app on (default: 3554).")
	productionPtr := flag.Bool("production", false, "If true, run the app over HTTPS.")
	pullGSheetsPtr := flag.Bool("gsheets", false, "If true, pull the latest data from Google Sheets. ID specified in config.json.")
	runWorkersPtr := flag.Bool("workers", false, "If true, run all the workers in Go routines.")
	flag.Parse()

	configLogger()
	appConfigData = parseConfig("config.json")

	appPort = *portPtr
	isProduction := *productionPtr
	isPullGSheets := *pullGSheetsPtr
	workerRoutines := *runWorkersPtr

	fileServer := http.FileServer(http.Dir("frontend/build/"))

	http.HandleFunc("/", htmlHandler)
	http.Handle("/static/", fileServer)
	http.Handle("/assets/", fileServer)
	http.HandleFunc("/api/locations", apiLocationsHandler)
	http.HandleFunc("/api/links", apiLinksHandler)
	http.HandleFunc("/api/blogs", apiBlogsHandler)
	http.HandleFunc("/api/gravatar", apiGravatarHandler)

	if workerRoutines {
		scheduleWorkers(appConfigData)
	}

	if isPullGSheets {
		workers.GetDataFromGSheets(appConfigData.GSheetID)
	} else if isProduction {
		if workerRoutines {
			log.Println("Starting data collection workers...")
			scheduleWorkers(appConfigData)
		}

		log.Println("Starting HTTPS server...")
		go func() {
			err := http.ListenAndServeTLS(":443", "acme_cert.pem", "acme_private_key.pem", nil)
			if err != nil {
				log.Fatalf("HTTPS server failed to start: %v", err)
			}
		}()

		log.Println("Starting HTTP server that redirects to HTTPS...")
		err := http.ListenAndServe(":80", http.HandlerFunc(redirectToHTTPS))
		log.Error(err)
	} else {
		if workerRoutines {
			log.Println("Starting data collection workers...")
			scheduleWorkers(appConfigData)
		}

		log.Info("Starting HTTP server...")
		err := http.ListenAndServe(fmt.Sprintf(":%d", appPort), nil)
		log.Error(err)
	}
}
