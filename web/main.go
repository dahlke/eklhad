package main

import (
	"compress/gzip"
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

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
	log.WithFields(log.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
		"ip":     r.RemoteAddr,
	}).Info("API request: locations")

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	locations := services.GetLocations()
	json.NewEncoder(w).Encode(locations)
}

func apiBlogsHandler(w http.ResponseWriter, r *http.Request) {
	log.WithFields(log.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
		"ip":     r.RemoteAddr,
	}).Info("API request: blogs")

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	blogs := services.GetBlogs()
	json.NewEncoder(w).Encode(blogs)
}

func apiLinksHandler(w http.ResponseWriter, r *http.Request) {
	log.WithFields(log.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
		"ip":     r.RemoteAddr,
	}).Info("API request: links")

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

// healthHandler returns a simple health check response
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"service":   "eklhad-web",
	}
	json.NewEncoder(w).Encode(response)
}

// readyHandler returns readiness status
func readyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := map[string]interface{}{
		"status":    "ready",
		"timestamp": time.Now().Unix(),
		"service":   "eklhad-web",
	}
	json.NewEncoder(w).Encode(response)
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// requestLoggingMiddleware logs all HTTP requests with consistent format
func requestLoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response writer wrapper to capture status code
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Process the request
		next.ServeHTTP(rw, r)

		// Log the request
		duration := time.Since(start)
		log.WithFields(log.Fields{
			"method":      r.Method,
			"path":        r.URL.Path,
			"query":       r.URL.RawQuery,
			"ip":          r.RemoteAddr,
			"user_agent":  r.UserAgent(),
			"status":      rw.statusCode,
			"duration_ms": duration.Milliseconds(),
		}).Info("HTTP request")
	})
}

// securityHeadersMiddleware adds security headers to responses
func securityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// Don't set CSP that blocks inline scripts if we need them
		// Only set HSTS in production
		if r.TLS != nil {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		next.ServeHTTP(w, r)
	})
}

// compressionMiddleware adds gzip compression to responses
type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func compressionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip compression for JavaScript modules and other binary assets
		// These need to be served with exact Content-Type headers
		path := r.URL.Path
		if strings.HasSuffix(path, ".js") ||
			strings.HasSuffix(path, ".mjs") ||
			strings.HasSuffix(path, ".wasm") ||
			strings.HasSuffix(path, ".gz") ||
			strings.HasSuffix(path, ".br") {
			next.ServeHTTP(w, r)
			return
		}

		// Check if client accepts gzip encoding
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		// Only compress text-based content
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()

		gzr := &gzipResponseWriter{Writer: gz, ResponseWriter: w}
		next.ServeHTTP(gzr, r)
	})
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
	// Use JSON formatter for structured logging
	log.SetFormatter(&log.JSONFormatter{
		TimestampFormat: time.RFC3339,
		FieldMap: log.FieldMap{
			log.FieldKeyTime:  "timestamp",
			log.FieldKeyLevel: "level",
			log.FieldKeyMsg:   "message",
		},
	})
	log.SetOutput(os.Stdout)
	log.SetLevel(log.InfoLevel)

	// Add default fields for structured logging
	log.WithFields(log.Fields{
		"service": "eklhad-web",
		"version": "0.1.0",
	}).Info("Logger initialized")
}

func parseConfig(configJSONPath string) appConfig {
	configJSONFile, err := os.Open(configJSONPath)
	if err != nil {
		log.Error(err)
	}
	defer configJSONFile.Close()

	jsonBytes, _ := io.ReadAll(configJSONFile)
	var config appConfig
	json.Unmarshal(jsonBytes, &config)

	return config
}

func scheduleWorkers(config appConfig) {
	go workers.ScheduleGSheetsWork(config.WorkerMinSleepMins, config.GSheetID)
}

func main() {
	// Check for PORT environment variable (set by Cloud Run)
	// This takes precedence over the default, but can be overridden by the -port flag
	if portEnv := os.Getenv("PORT"); portEnv != "" {
		if port, err := strconv.Atoi(portEnv); err == nil {
			appPort = port
		}
	}

	portPtr := flag.Int("port", appPort, "The port to run the HTTP app on (default: 3554, or PORT env var).")
	productionPtr := flag.Bool("production", false, "If true, run the app over HTTPS.")
	pullGSheetsPtr := flag.Bool("gsheets", false, "If true, pull the latest data from Google Sheets. ID specified in config.json.")
	runWorkersPtr := flag.Bool("workers", false, "If true, run all the workers in Go routines.")
	flag.Parse()

	configLogger()
	appConfigData = parseConfig("config.json")

	// Use flag value if provided (flag overrides env var)
	appPort = *portPtr
	isProduction := *productionPtr
	isPullGSheets := *pullGSheetsPtr
	workerRoutines := *runWorkersPtr

	fileServer := http.FileServer(http.Dir("frontend/build/"))

	// Health check endpoints
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/ready", readyHandler)

	// Main routes
	http.HandleFunc("/", htmlHandler)
	http.Handle("/static/", fileServer)
	http.Handle("/assets/", fileServer)
	http.HandleFunc("/api/locations", apiLocationsHandler)
	http.HandleFunc("/api/links", apiLinksHandler)
	http.HandleFunc("/api/blogs", apiBlogsHandler)
	http.HandleFunc("/api/gravatar", apiGravatarHandler)

	// Apply middleware to all routes (compression removed as it was causing issues)
	// Chain: requestLoggingMiddleware -> securityHeadersMiddleware -> routes
	handler := requestLoggingMiddleware(securityHeadersMiddleware(http.DefaultServeMux))

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
			err := http.ListenAndServeTLS(":443", "acme_cert.pem", "acme_private_key.pem", handler)
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
		err := http.ListenAndServe(fmt.Sprintf(":%d", appPort), handler)
		log.Error(err)
	}
}
