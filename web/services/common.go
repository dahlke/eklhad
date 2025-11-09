package services

import (
	"fmt"
	"io"
	"net/http"

	log "github.com/sirupsen/logrus"
)

// ReadJSONFromGCS reads data from a bucket at a specific path and returns a byte array.
func ReadJSONFromGCS(bucketName string, path string) []byte {
	// Construct the public URL for the object
	publicURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, path)

	// Make an HTTP GET request to the public URL
	resp, err := http.Get(publicURL)
	if err != nil {
		log.Error("Failed to fetch the object:", err)
		return nil
	}
	defer resp.Body.Close()

	// Read the response body
	jsonBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error("Failed to read the object data:", err)
		return nil
	}

	return jsonBytes
}
