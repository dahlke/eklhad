package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	storage "cloud.google.com/go/storage"
	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/geo"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

func writeLocationsToGCS(locations []structs.EklhadLocation) {
	if len(locations) > 0 {
		ctx := context.Background()
		gcsClient, err := storage.NewClient(ctx)
		if err != nil {
			log.Error(err)
		}

		bkt := gcsClient.Bucket(constants.GCSPublicBucketName)

		wc := bkt.Object(constants.LocationDataGCSFilePath).NewWriter(ctx)
		wc.ContentType = "text/plain"
		wc.Metadata = map[string]string{
			"x-goog-meta-app":     "eklhad-web",
			"x-goog-meta-type":    "data",
			"x-goog-meta-dataset": "intagram",
		}
		fileContents, _ := json.MarshalIndent(locations, "", " ")

		if _, err := wc.Write([]byte(fileContents)); err != nil {
			log.Error("Unable to write location data to GCS.")
			return
		}

		if err := wc.Close(); err != nil {
			log.Error("Unable to close writer for GCS while writing location data.")
			return
		}

		log.Info("Location data successfully written to GCS.")
	} else {
		log.Error("Something went wrong, the data set was size zero, so no location data was overwritten in GCS.")
	}
}

// updateLocationInSheet updates a specific location row in the Google Sheet with lat/lng and confirmed status
func updateLocationInSheet(sheetsService *sheets.Service, spreadSheetID string, rowIndex int, lat float64, lng float64, confirmed bool) error {
	// Row index is 1-based in A1 notation, but we're 0-based from the loop
	// Since headers are in row 1, data starts at row 2, so rowIndex + 2
	rowNum := rowIndex + 2

	// Update columns G (Lat), H (Lng), and I (Confirmed)
	latRange := fmt.Sprintf("locations!G%d", rowNum)
	lngRange := fmt.Sprintf("locations!H%d", rowNum)
	confirmedRange := fmt.Sprintf("locations!I%d", rowNum)

	// Prepare the values
	latValue := []interface{}{lat}
	lngValue := []interface{}{lng}
	confirmedValue := []interface{}{confirmed}

	// Write Lat
	latValues := &sheets.ValueRange{Values: [][]interface{}{latValue}}
	_, err := sheetsService.Spreadsheets.Values.Update(spreadSheetID, latRange, latValues).
		ValueInputOption("RAW").Do()
	if err != nil {
		return fmt.Errorf("unable to update lat: %v", err)
	}

	// Write Lng
	lngValues := &sheets.ValueRange{Values: [][]interface{}{lngValue}}
	_, err = sheetsService.Spreadsheets.Values.Update(spreadSheetID, lngRange, lngValues).
		ValueInputOption("RAW").Do()
	if err != nil {
		return fmt.Errorf("unable to update lng: %v", err)
	}

	// Write Confirmed
	confirmedValues := &sheets.ValueRange{Values: [][]interface{}{confirmedValue}}
	_, err = sheetsService.Spreadsheets.Values.Update(spreadSheetID, confirmedRange, confirmedValues).
		ValueInputOption("RAW").Do()
	if err != nil {
		return fmt.Errorf("unable to update confirmed: %v", err)
	}

	return nil
}

// isCellEmptyOrNotConfirmed checks if a cell value is empty or if the confirmed field is not TRUE
func isCellEmptyOrNotConfirmed(cellValue interface{}) bool {
	if cellValue == nil {
		return true
	}
	// Convert to string and check if empty
	valueStr := fmt.Sprint(cellValue)
	return valueStr == "" || valueStr == " " || valueStr == "FALSE"
}

// getStringValue safely gets a string value from a row, with optional default
func getStringValue(row []interface{}, index int) string {
	if index >= len(row) || row[index] == nil {
		return ""
	}
	// Type assertion with error handling
	if str, ok := row[index].(string); ok {
		return str
	}
	return fmt.Sprint(row[index])
}

func writeLinksToGCS(links []structs.EklhadLink) {
	if len(links) > 0 {
		ctx := context.Background()
		gcsClient, err := storage.NewClient(ctx)
		if err != nil {
			log.Error(err)
		}

		bkt := gcsClient.Bucket(constants.GCSPublicBucketName)

		wc := bkt.Object(constants.LinkDataGCSFilePath).NewWriter(ctx)
		wc.ContentType = "text/plain"
		wc.Metadata = map[string]string{
			"x-goog-meta-app":     "eklhad-web",
			"x-goog-meta-type":    "data",
			"x-goog-meta-dataset": "links",
		}
		fileContents, _ := json.MarshalIndent(links, "", " ")

		if _, err := wc.Write([]byte(fileContents)); err != nil {
			log.Error("Unable to write link data to GCS.")
			return
		}

		if err := wc.Close(); err != nil {
			log.Error("Unable to close writer for GCS while writing link data.")
			return
		}

		log.Info("Link data successfully written to GCS.")
	} else {
		log.Error("Something went wrong, the data set was size zero, so no link data was overwritten in GCS.")
	}
}

func writeBlogsToGCS(blogs []structs.EklhadBlog) {
	ctx := context.Background()
	gcsClient, err := storage.NewClient(ctx)
	if err != nil {
		log.Error(err)
	}

	bkt := gcsClient.Bucket(constants.GCSPublicBucketName)

	wc := bkt.Object(constants.BlogDataGCSFilePath).NewWriter(ctx)
	wc.ContentType = "text/plain"
	wc.Metadata = map[string]string{
		"x-goog-meta-app":     "eklhad-web",
		"x-goog-meta-type":    "data",
		"x-goog-meta-dataset": "blogs",
	}
	fileContents, _ := json.MarshalIndent(blogs, "", " ")

	if _, err := wc.Write([]byte(fileContents)); err != nil {
		log.Error("Unable to write blog data to GCS.")
		return
	}

	if err := wc.Close(); err != nil {
		log.Error("Unable to close writer for GCS while writing blog data.")
		return
	}
}

// GetDataFromGSheets gets all the link and location activity logged in a specific
// format in GSheets, and writes it to the file system for usage in the frontend.
func GetDataFromGSheets(spreadSheetID string) {
	googleAPIKey := os.Getenv("GOOGLE_API_KEY")
	serviceAccountPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")

	ctx := context.Background()

	// Try service account credentials first (allows both read and write)
	// This is the primary method for production
	var sheetsService *sheets.Service
	var err error

	if serviceAccountPath != "" {
		sheetsService, err = sheets.NewService(ctx, option.WithCredentialsFile(serviceAccountPath))
		if err != nil {
			log.Warnf("Service account authentication failed: %v", err)
			// Fall back to API key for development only
			if googleAPIKey != "" {
				log.Info("Falling back to API key for reading (write operations will fail)")
				sheetsService, err = sheets.NewService(ctx, option.WithAPIKey(googleAPIKey))
				if err != nil {
					log.Fatalf("Unable to retrieve Sheets client: %v", err)
				}
			} else {
				log.Fatalf("No valid authentication found")
			}
		} else {
			log.Info("Using service account credentials for read and write operations")
		}
	} else {
		// Development fallback: use API key (write operations will fail)
		if googleAPIKey == "" {
			log.Fatalf("No authentication available")
		}
		log.Info("Using API key for reading (write operations will fail)")
		sheetsService, err = sheets.NewService(ctx, option.WithAPIKey(googleAPIKey))
		if err != nil {
			log.Fatalf("Unable to retrieve Sheets client: %v", err)
		}
	}

	// Read columns A through I: City, State, Country, Current, Layover, Home, Lat, Lng, Confirmed
	locationsReadRange := "locations!A2:I"
	// NOTE: https://pkg.go.dev/google.golang.org/api@v0.64.0/sheets/v4?utm_source=gopls#SpreadsheetsValuesService.Get
	locationsResp, err := sheetsService.Spreadsheets.Values.Get(spreadSheetID, locationsReadRange).Do()
	if err != nil {
		log.Fatalf("Unable to retrieve data from sheet: %v", err)
	}

	if len(locationsResp.Values) == 0 {
		log.Info("No data found for locations.")
	} else {
		var eklhadLocations []structs.EklhadLocation

		for i, row := range locationsResp.Values {
			// Ensure row has at least 6 fields (City through Home)
			if len(row) < 6 {
				log.Warn(fmt.Sprintf("Row %d does not have enough columns, skipping", i+2))
				continue
			}

			locationCity := getStringValue(row, 0)
			locationStateProviceRegion := getStringValue(row, 1)
			locationCountry := getStringValue(row, 2)
			locationCurrent := getStringValue(row, 3)
			locationLayover := getStringValue(row, 4)
			locationHome := getStringValue(row, 5)

			var lat, lng float64

			// Check if this row already has lat/lng populated
			// Extract lat/lng from sheet data if available
			if len(row) > 6 && !isCellEmptyOrNotConfirmed(row[6]) {
				if latStr, ok := row[6].(float64); ok {
					lat = latStr
				} else if latStr, ok := row[6].(string); ok && latStr != "" {
					fmt.Sscanf(latStr, "%f", &lat)
				}
			}
			if len(row) > 7 && !isCellEmptyOrNotConfirmed(row[7]) {
				if lngStr, ok := row[7].(float64); ok {
					lng = lngStr
				} else if lngStr, ok := row[7].(string); ok && lngStr != "" {
					fmt.Sscanf(lngStr, "%f", &lng)
				}
			}

			// Check if we should geocode this location
			// Only geocode if we don't have coordinates yet
			hasLat := lat != 0
			hasLng := lng != 0
			isConfirmed := len(row) > 8 && getStringValue(row, 8) == "TRUE"

			// If we don't have coordinates yet, geocode the location
			if !hasLat || !hasLng {
				locationConcat := fmt.Sprintf("%s, %s, %s", locationCity, locationStateProviceRegion, locationCountry)
				log.Info("Processing location ", locationConcat)
				// NOTE: Geocoding each location makes it this loop take longer than you would think.
				geocodedLat, geocodedLng := geo.GeocodeLocation(locationConcat)

				// Use the geocoded values if we got valid coordinates
				if geocodedLat != 0 && geocodedLng != 0 {
					lat = geocodedLat
					lng = geocodedLng

					// Only update the sheet if not already confirmed
					if !isConfirmed {
						err := updateLocationInSheet(sheetsService, spreadSheetID, i, lat, lng, true)
						if err != nil {
							log.Error(fmt.Sprintf("Failed to update sheet for row %d: %v", i+2, err))
						} else {
							log.Info(fmt.Sprintf("Updated sheet with lat=%f, lng=%f for row %d", lat, lng, i+2))
						}
					}
				} else {
					log.Error(fmt.Sprintf("Failed to geocode location %s", locationConcat))
				}
			} else {
				log.Info(fmt.Sprintf("Using existing coordinates for %s, %s, %s (lat=%f, lng=%f)", locationCity, locationStateProviceRegion, locationCountry, lat, lng))
			}

			current := false
			if locationCurrent == "TRUE" {
				current = true
			}

			layover := false
			if locationLayover == "TRUE" {
				layover = true
			}

			home := false
			if locationHome == "TRUE" {
				home = true
			}

			locationID := fmt.Sprint("location-", i)
			eklhadLocation := structs.EklhadLocation{
				ID:                  locationID,
				City:                locationCity,
				StateProvinceRegion: locationStateProviceRegion,
				Country:             locationCountry,
				Current:             current,
				Layover:             layover,
				Home:                home,
				Lat:                 lat,
				Lng:                 lng,
			}

			eklhadLocations = append(eklhadLocations, eklhadLocation)
		}

		writeLocationsToGCS(eklhadLocations)
	}

	blogsReadRange := "blogs!A2:G"
	// NOTE: https://pkg.go.dev/google.golang.org/api@v0.64.0/sheets/v4?utm_source=gopls#SpreadsheetsValuesService.Get
	blogsResp, err := sheetsService.Spreadsheets.Values.Get(spreadSheetID, blogsReadRange).Do()
	if err != nil {
		log.Fatalf("Unable to retrieve data from sheet: %v", err)
	}

	if len(blogsResp.Values) == 0 {
		log.Info("No data found for blogs.")
	} else {
		var eklhadBlogs []structs.EklhadBlog

		for i, row := range blogsResp.Values {
			blogID := fmt.Sprint("blog-", i)
			blogName := row[0].(string)
			blogDate := row[1].(string)
			blogURL := row[2].(string)
			blogMediumURL := row[3].(string)
			blogOriginalURL := row[4].(string)
			blogGistURL := row[5].(string)
			blogPath := row[6].(string)

			log.Info("Processing blog ", blogName)

			timestamp, err := time.Parse(constants.GSheetsInputDateFmt, blogDate)
			if err != nil {
				log.Error(err)
			}

			eklhadBlog := structs.EklhadBlog{
				ID:          blogID,
				Name:        blogName,
				Timestamp:   timestamp.Unix(),
				URL:         blogURL,
				MediumURL:   blogMediumURL,
				OriginalURL: blogOriginalURL,
				GistURL:     blogGistURL,
				Path:        blogPath,
			}

			eklhadBlogs = append(eklhadBlogs, eklhadBlog)
		}
		writeBlogsToGCS(eklhadBlogs)
	}

	linksReadRange := "links!A2:E"
	// NOTE: https://www.any-api.com/googleapis_com/sheets/docs/spreadsheets/sheets_spreadsheets_values_get
	linksResp, err := sheetsService.Spreadsheets.Values.Get(spreadSheetID, linksReadRange).Do()
	if err != nil {
		log.Fatalf("Unable to retrieve data from sheet: %v", err)
	}

	if len(linksResp.Values) == 0 {
		log.Info("No data found for links.")
	} else {
		var eklhadLinks []structs.EklhadLink

		for i, row := range linksResp.Values {
			linkID := fmt.Sprint("link-", i)
			linkName := row[0].(string)
			linkDate := row[1].(string)
			linkType := row[2].(string)
			linkURL := row[3].(string)

			log.Info("Processing link ", linkName)

			timestamp, err := time.Parse(constants.GSheetsInputDateFmt, linkDate)
			if err != nil {
				log.Error(err)
			}

			eklhadLink := structs.EklhadLink{
				ID:        linkID,
				Name:      linkName,
				Timestamp: timestamp.Unix(),
				Type:      linkType,
				URL:       linkURL,
			}

			eklhadLinks = append(eklhadLinks, eklhadLink)
		}

		writeLinksToGCS(eklhadLinks)
	}
}

// ScheduleGSheetsWork schedules GetDataFromGSheets at an interval
func ScheduleGSheetsWork(numSleepMins int, spreadSheetID string) {
	iterationNumber := 0
	for {
		log.Info(fmt.Sprintf("Starting GSheets worker scheduled task #%d...", iterationNumber))
		GetDataFromGSheets(spreadSheetID)
		iterationNumber++
		log.Info(fmt.Sprintf("GSheets worker sleeping for %d minute(s)...", numSleepMins))
		time.Sleep(time.Duration(numSleepMins) * time.Minute)
	}
}
