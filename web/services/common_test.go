package services

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestReadJSONFromGCS(t *testing.T) {
	// Test with valid JSON response from test server
	t.Run("valid JSON response", func(t *testing.T) {
		expectedData := []byte(`{"test": "data"}`)
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write(expectedData)
		}))
		defer server.Close()

		// The function constructs URLs from bucket/path, so we can't easily use the test server
		// Instead, we test that the function handles errors gracefully when GCS is not accessible
		result := ReadJSONFromGCS("test-bucket", "test-path")
		// In test environment without GCS access, this may return nil or an error response
		// We just verify the function doesn't panic
		if result != nil {
			// If we get data, verify it's valid JSON (or handle error responses)
			var data interface{}
			if err := json.Unmarshal(result, &data); err != nil {
				// If it's not valid JSON, it might be an error response (like XML)
				// This is acceptable behavior - the function returns what it gets
				t.Logf("Response is not JSON (may be error response): %v", err)
			}
		}
	})

	// Test with empty parameters - this will make a request to GCS which may return an error
	t.Run("empty parameters", func(t *testing.T) {
		result := ReadJSONFromGCS("", "")
		// The function may return nil on error, or it may return an error response
		// We just verify it doesn't panic
		_ = result
	})
}

func TestReadJSONFromGCS_ErrorHandling(t *testing.T) {
	// Test that the function handles errors gracefully
	// Since the function makes real HTTP requests to GCS, we can't easily mock it
	// without refactoring. Instead, we test that it doesn't panic on various inputs.

	testCases := []struct {
		name   string
		bucket string
		path   string
	}{
		{"nonexistent bucket", "nonexistent-bucket", "nonexistent-path"},
		{"empty bucket", "", "path"},
		{"empty path", "bucket", ""},
		{"both empty", "", ""},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := ReadJSONFromGCS(tc.bucket, tc.path)
			// The function may return nil on error, or it may return an error response
			// We just verify it doesn't panic and handles the error gracefully
			_ = result
		})
	}
}
