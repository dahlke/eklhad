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

	ctx := context.Background()
	sheetsService, err := sheets.NewService(ctx, option.WithAPIKey(googleAPIKey))
	if err != nil {
		log.Fatalf("Unable to retrieve Sheets client: %v", err)
	}

	locationsReadRange := "locations!A2:F"
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
			locationID := fmt.Sprint("location-", i)
			locationCity := row[0].(string)
			locationStateProviceRegion := row[1].(string)
			locationCountry := row[2].(string)
			locationCurrent := row[3].(string)
			locationLayover := row[4].(string)
			locationHome := row[5].(string)

			locationConcat := fmt.Sprintf("%s, %s, %s", locationCity, locationStateProviceRegion, locationCountry)
			log.Info("Processing location ", locationConcat)
			// NOTE: Geocoding each location makes it this loop take longer than you would think.
			lat, lng := geo.GeocodeLocation(locationConcat)

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
