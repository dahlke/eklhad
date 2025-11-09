package main

import (
	"crypto/tls"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestAPIHandlers(t *testing.T) {
	// Setup: Create a minimal config
	appConfigData = appConfig{
		GravatarEmail: "test@example.com",
	}

	tests := []struct {
		name           string
		handler        http.HandlerFunc
		method         string
		path           string
		expectedStatus int
		validateBody   func(*testing.T, []byte)
	}{
		{
			name:           "apiLocationsHandler",
			handler:        apiLocationsHandler,
			method:         "GET",
			path:           "/api/locations",
			expectedStatus: http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				// Verify it's valid JSON
				var data interface{}
				if err := json.Unmarshal(body, &data); err != nil {
					t.Errorf("Response is not valid JSON: %v", err)
				}
			},
		},
		{
			name:           "apiBlogsHandler",
			handler:        apiBlogsHandler,
			method:         "GET",
			path:           "/api/blogs",
			expectedStatus: http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var data interface{}
				if err := json.Unmarshal(body, &data); err != nil {
					t.Errorf("Response is not valid JSON: %v", err)
				}
			},
		},
		{
			name:           "apiLinksHandler",
			handler:        apiLinksHandler,
			method:         "GET",
			path:           "/api/links",
			expectedStatus: http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var data interface{}
				if err := json.Unmarshal(body, &data); err != nil {
					t.Errorf("Response is not valid JSON: %v", err)
				}
			},
		},
		{
			name:           "apiGravatarHandler",
			handler:        apiGravatarHandler,
			method:         "GET",
			path:           "/api/gravatar",
			expectedStatus: http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var email string
				if err := json.Unmarshal(body, &email); err != nil {
					t.Errorf("Response is not valid JSON: %v", err)
				}
				if email != "test@example.com" {
					t.Errorf("Expected email 'test@example.com', got '%s'", email)
				}
			},
		},
		{
			name:           "healthHandler",
			handler:        healthHandler,
			method:         "GET",
			path:           "/health",
			expectedStatus: http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var response map[string]interface{}
				if err := json.Unmarshal(body, &response); err != nil {
					t.Errorf("Response is not valid JSON: %v", err)
				}
				if status, ok := response["status"].(string); !ok || status != "healthy" {
					t.Errorf("Expected status 'healthy', got %v", response["status"])
				}
				if service, ok := response["service"].(string); !ok || service != "eklhad-web" {
					t.Errorf("Expected service 'eklhad-web', got %v", response["service"])
				}
			},
		},
		{
			name:           "readyHandler",
			handler:        readyHandler,
			method:         "GET",
			path:           "/ready",
			expectedStatus: http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var response map[string]interface{}
				if err := json.Unmarshal(body, &response); err != nil {
					t.Errorf("Response is not valid JSON: %v", err)
				}
				if status, ok := response["status"].(string); !ok || status != "ready" {
					t.Errorf("Expected status 'ready', got %v", response["status"])
				}
				if service, ok := response["service"].(string); !ok || service != "eklhad-web" {
					t.Errorf("Expected service 'eklhad-web', got %v", response["service"])
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, nil)
			w := httptest.NewRecorder()
			tt.handler(w, req)

			resp := w.Result()
			if resp.StatusCode != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, resp.StatusCode)
			}

			// Verify CORS header
			if cors := resp.Header.Get("Access-Control-Allow-Origin"); cors != "*" {
				// Only check for API endpoints
				if tt.name != "healthHandler" && tt.name != "readyHandler" {
					t.Errorf("Expected CORS header '*', got '%s'", cors)
				}
			}

			// Verify Content-Type for JSON responses
			if contentType := resp.Header.Get("Content-Type"); contentType != "application/json" {
				t.Errorf("Expected Content-Type 'application/json', got '%s'", contentType)
			}

			// Validate body if validator provided
			if tt.validateBody != nil {
				body := w.Body.Bytes()
				tt.validateBody(t, body)
			}
		})
	}
}

func TestSecurityHeadersMiddleware(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	middleware := securityHeadersMiddleware(handler)

	tests := []struct {
		name           string
		request        *http.Request
		expectedHeader string
		expectedValue  string
	}{
		{
			name:           "X-Content-Type-Options",
			request:        httptest.NewRequest("GET", "/", nil),
			expectedHeader: "X-Content-Type-Options",
			expectedValue:  "nosniff",
		},
		{
			name:           "X-Frame-Options",
			request:        httptest.NewRequest("GET", "/", nil),
			expectedHeader: "X-Frame-Options",
			expectedValue:  "DENY",
		},
		{
			name:           "X-XSS-Protection",
			request:        httptest.NewRequest("GET", "/", nil),
			expectedHeader: "X-XSS-Protection",
			expectedValue:  "1; mode=block",
		},
		{
			name:           "Referrer-Policy",
			request:        httptest.NewRequest("GET", "/", nil),
			expectedHeader: "Referrer-Policy",
			expectedValue:  "strict-origin-when-cross-origin",
		},
		{
			name:           "Permissions-Policy",
			request:        httptest.NewRequest("GET", "/", nil),
			expectedHeader: "Permissions-Policy",
			expectedValue:  "geolocation=(), microphone=(), camera=()",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			middleware.ServeHTTP(w, tt.request)

			value := w.Header().Get(tt.expectedHeader)
			if value != tt.expectedValue {
				t.Errorf("Expected header %s to be '%s', got '%s'", tt.expectedHeader, tt.expectedValue, value)
			}
		})
	}

	// Test HSTS header for TLS requests
	t.Run("HSTS header for TLS", func(t *testing.T) {
		req := httptest.NewRequest("GET", "https://example.com/", nil)
		req.TLS = &tls.ConnectionState{}
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		hsts := w.Header().Get("Strict-Transport-Security")
		if hsts == "" {
			t.Error("Expected HSTS header for TLS request, got empty")
		}
		if hsts != "max-age=31536000; includeSubDomains" {
			t.Errorf("Expected HSTS header 'max-age=31536000; includeSubDomains', got '%s'", hsts)
		}
	})
}

func TestCompressionMiddleware(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte("test response"))
	})

	middleware := compressionMiddleware(handler)

	tests := []struct {
		name                string
		acceptEncoding      string
		path                string
		shouldCompress      bool
		expectedContentEnc  string
	}{
		{
			name:                "compresses with gzip accepted",
			acceptEncoding:      "gzip",
			path:                "/",
			shouldCompress:      true,
			expectedContentEnc:  "gzip",
		},
		{
			name:                "no compression without gzip",
			acceptEncoding:      "",
			path:                "/",
			shouldCompress:      false,
			expectedContentEnc:  "",
		},
		{
			name:                "skips compression for .js files",
			acceptEncoding:      "gzip",
			path:                "/static/app.js",
			shouldCompress:      false,
			expectedContentEnc:  "",
		},
		{
			name:                "skips compression for .mjs files",
			acceptEncoding:      "gzip",
			path:                "/static/app.mjs",
			shouldCompress:      false,
			expectedContentEnc:  "",
		},
		{
			name:                "skips compression for .wasm files",
			acceptEncoding:      "gzip",
			path:                "/static/app.wasm",
			shouldCompress:      false,
			expectedContentEnc:  "",
		},
		{
			name:                "skips compression for .gz files",
			acceptEncoding:      "gzip",
			path:                "/static/app.gz",
			shouldCompress:      false,
			expectedContentEnc:  "",
		},
		{
			name:                "skips compression for .br files",
			acceptEncoding:      "gzip",
			path:                "/static/app.br",
			shouldCompress:      false,
			expectedContentEnc:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", tt.path, nil)
			if tt.acceptEncoding != "" {
				req.Header.Set("Accept-Encoding", tt.acceptEncoding)
			}
			w := httptest.NewRecorder()
			middleware.ServeHTTP(w, req)

			contentEnc := w.Header().Get("Content-Encoding")
			if tt.shouldCompress {
				if contentEnc != tt.expectedContentEnc {
					t.Errorf("Expected Content-Encoding '%s', got '%s'", tt.expectedContentEnc, contentEnc)
				}
			} else {
				if contentEnc != "" {
					t.Errorf("Expected no Content-Encoding, got '%s'", contentEnc)
				}
			}
		})
	}
}

func TestRedirectToHTTPS(t *testing.T) {
	req := httptest.NewRequest("GET", "/test?param=value", nil)
	req.Host = "example.com"
	w := httptest.NewRecorder()

	redirectToHTTPS(w, req)

	if w.Code != http.StatusTemporaryRedirect {
		t.Errorf("Expected status %d, got %d", http.StatusTemporaryRedirect, w.Code)
	}

	location := w.Header().Get("Location")
	expected := "https://example.com/test?param=value"
	if location != expected {
		t.Errorf("Expected Location '%s', got '%s'", expected, location)
	}
}

func TestParseConfig(t *testing.T) {
	// Create a temporary config file
	configContent := `{
		"g_sheet_id": "test-sheet-id",
		"gravatar_email": "test@example.com",
		"worker_min_sleep_mins": 60
	}`

	tmpFile, err := os.CreateTemp("", "config-*.json")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(configContent); err != nil {
		t.Fatalf("Failed to write config: %v", err)
	}
	tmpFile.Close()

	config := parseConfig(tmpFile.Name())

	if config.GSheetID != "test-sheet-id" {
		t.Errorf("Expected GSheetID 'test-sheet-id', got '%s'", config.GSheetID)
	}
	if config.GravatarEmail != "test@example.com" {
		t.Errorf("Expected GravatarEmail 'test@example.com', got '%s'", config.GravatarEmail)
	}
	if config.WorkerMinSleepMins != 60 {
		t.Errorf("Expected WorkerMinSleepMins 60, got %d", config.WorkerMinSleepMins)
	}
}

func TestConfigLogger(t *testing.T) {
	// This function is hard to test directly, but we can verify it doesn't panic
	defer func() {
		if r := recover(); r != nil {
			t.Errorf("configLogger panicked: %v", r)
		}
	}()
	configLogger()
}

