package services

import (
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
)

var gcsHTTPClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        10,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	},
}

type cachedEntry struct {
	data      []byte
	expiresAt time.Time
}

var (
	gcsCache   = make(map[string]cachedEntry)
	gcsCacheMu sync.RWMutex
	cacheTTL   = 10 * time.Minute
)

// ReadJSONFromGCS reads data from a bucket at a specific path and returns a byte array.
// Results are cached in-memory for cacheTTL to avoid redundant GCS round-trips.
func ReadJSONFromGCS(bucketName string, path string) []byte {
	key := bucketName + "/" + path

	gcsCacheMu.RLock()
	if entry, ok := gcsCache[key]; ok && time.Now().Before(entry.expiresAt) {
		gcsCacheMu.RUnlock()
		return entry.data
	}
	gcsCacheMu.RUnlock()

	publicURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, path)
	resp, err := gcsHTTPClient.Get(publicURL)
	if err != nil {
		log.Error("Failed to fetch the object:", err)
		return nil
	}
	defer resp.Body.Close()

	jsonBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error("Failed to read the object data:", err)
		return nil
	}

	gcsCacheMu.Lock()
	gcsCache[key] = cachedEntry{data: jsonBytes, expiresAt: time.Now().Add(cacheTTL)}
	gcsCacheMu.Unlock()

	return jsonBytes
}
