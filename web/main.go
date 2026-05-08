package main

import (
	"compress/gzip"
	"crypto/md5"
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/dahlke/eklhad/web/services"
	"github.com/dahlke/eklhad/web/structs"
	"github.com/dahlke/eklhad/web/workers"
	log "github.com/sirupsen/logrus"
)

type templatePayload struct {
	APIHost string
	APIPort int
}

type appConfig struct {
	GSheetID      string `json:"g_sheet_id"`
	GravatarEmail string `json:"gravatar_email"`
}

type apiAppData struct {
	Locations   []structs.EklhadLocation `json:"locations"`
	Blogs       []structs.EklhadBlog     `json:"blogs"`
	Links       []structs.EklhadLink     `json:"links"`
	GravatarURL string                   `json:"gravatar_url"`
}

var appHostName, _ = os.Hostname()
var appPort = 3554
var appConfigData appConfig

func gravatarURL(email string) string {
	normalized := strings.ToLower(strings.TrimSpace(email))
	hash := fmt.Sprintf("%x", md5.Sum([]byte(normalized)))
	return fmt.Sprintf("https://www.gravatar.com/avatar/%s.jpg?s=200", hash)
}

func setAPIHeaders(w http.ResponseWriter, cacheMaxAge string) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age="+cacheMaxAge)
	w.Header().Set("Access-Control-Allow-Origin", "*")
}

func apiLocationsHandler(w http.ResponseWriter, r *http.Request) {
	log.WithFields(log.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
		"ip":     r.RemoteAddr,
	}).Info("API request: locations")

	setAPIHeaders(w, "3600")
	locations := services.GetLocations()
	json.NewEncoder(w).Encode(locations)
}

func apiBlogsHandler(w http.ResponseWriter, r *http.Request) {
	log.WithFields(log.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
		"ip":     r.RemoteAddr,
	}).Info("API request: blogs")

	setAPIHeaders(w, "3600")
	blogs := services.GetBlogs()
	json.NewEncoder(w).Encode(blogs)
}

func apiLinksHandler(w http.ResponseWriter, r *http.Request) {
	log.WithFields(log.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
		"ip":     r.RemoteAddr,
	}).Info("API request: links")

	setAPIHeaders(w, "3600")
	links := services.GetLinks()
	json.NewEncoder(w).Encode(links)
}

func apiGravatarHandler(w http.ResponseWriter, r *http.Request) {
	setAPIHeaders(w, "86400")
	json.NewEncoder(w).Encode(gravatarURL(appConfigData.GravatarEmail))
}

func apiAppDataHandler(w http.ResponseWriter, r *http.Request) {
	log.WithFields(log.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
		"ip":     r.RemoteAddr,
	}).Info("API request: app-data")

	var (
		locations []structs.EklhadLocation
		blogs     []structs.EklhadBlog
		links     []structs.EklhadLink
		wg        sync.WaitGroup
	)

	wg.Add(3)
	go func() { defer wg.Done(); locations = services.GetLocations() }()
	go func() { defer wg.Done(); blogs = services.GetBlogs() }()
	go func() { defer wg.Done(); links = services.GetLinks() }()
	wg.Wait()

	data := apiAppData{
		Locations:   locations,
		Blogs:       blogs,
		Links:       links,
		GravatarURL: gravatarURL(appConfigData.GravatarEmail),
	}

	setAPIHeaders(w, "3600")
	json.NewEncoder(w).Encode(data)
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

		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(rw, r)

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
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		if r.TLS != nil {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		next.ServeHTTP(w, r)
	})
}

// gzipResponseWriter wraps http.ResponseWriter to write through a gzip.Writer.
// It removes Content-Length since the compressed size differs from the original.
type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func (w *gzipResponseWriter) WriteHeader(code int) {
	w.ResponseWriter.Header().Del("Content-Length")
	w.ResponseWriter.WriteHeader(code)
}

// compressionMiddleware adds gzip compression to text-based responses.
func compressionMiddleware(next http.Handler) http.Handler {
	// File types that are already compressed or must not be re-encoded.
	skipSuffixes := []string{
		".js", ".mjs", ".wasm", ".gz", ".br",
		".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
		".woff", ".woff2", ".ttf", ".eot",
		".mp4", ".webm", ".ogg",
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		for _, suffix := range skipSuffixes {
			if strings.HasSuffix(path, suffix) {
				next.ServeHTTP(w, r)
				return
			}
		}

		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()

		gzr := &gzipResponseWriter{Writer: gz, ResponseWriter: w}
		next.ServeHTTP(gzr, r)
	})
}

// cacheControlFileServer wraps a file server handler and adds appropriate
// Cache-Control headers: long-lived immutable for hashed assets, short-lived for others.
func cacheControlFileServer(fs http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=3600")
		}
		fs.ServeHTTP(w, r)
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
	// Workers are no longer scheduled on a timer
	// Use the -gsheets flag to manually pull data when needed
}

func main() {
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

	appPort = *portPtr
	isProduction := *productionPtr
	isPullGSheets := *pullGSheetsPtr
	workerRoutines := *runWorkersPtr

	fileServer := cacheControlFileServer(http.FileServer(http.Dir("frontend/build/")))

	// Health check endpoints
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/ready", readyHandler)

	// Publication redirects
	http.HandleFunc("/pub/temporal", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "https://aws.amazon.com/blogs/apn/building-resilient-distributed-systems-with-temporal-and-aws/", http.StatusMovedPermanently)
	})
	http.HandleFunc("/pub/vault", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "https://www.datocms-assets.com/2885/1632943952-moderndaypkimanagementwhitepaperdigitalv1.pdf", http.StatusMovedPermanently)
	})
	http.HandleFunc("/pub/terraform", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "https://medium.com/hashicorp-engineering/migrating-a-lot-of-state-with-python-and-the-terraform-cloud-api-997ec798cd11", http.StatusMovedPermanently)
	})
	http.HandleFunc("/pub/memsql", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "https://eklhad.medium.com/2016-11-10-memsql-tableau-and-the-democratization-of-data-bc28d2495d68", http.StatusMovedPermanently)
	})

	// Main routes
	http.HandleFunc("/", htmlHandler)
	http.Handle("/static/", fileServer)
	http.Handle("/assets/", fileServer)
	http.HandleFunc("/api/locations", apiLocationsHandler)
	http.HandleFunc("/api/links", apiLinksHandler)
	http.HandleFunc("/api/blogs", apiBlogsHandler)
	http.HandleFunc("/api/gravatar", apiGravatarHandler)
	http.HandleFunc("/api/app-data", apiAppDataHandler)

	// Chain: requestLoggingMiddleware -> securityHeadersMiddleware -> compressionMiddleware -> routes
	handler := requestLoggingMiddleware(securityHeadersMiddleware(compressionMiddleware(http.DefaultServeMux)))

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
