package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	storage "cloud.google.com/go/storage"
	"github.com/dahlke/eklhad/web/constants"
	geo "github.com/dahlke/eklhad/web/geo"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

func writeLocationsToGCS(locations []structs.EklhadLocation) {
	ctx := context.Background()
	gcsClient, err := storage.NewClient(ctx)
	if err != nil {
		log.Error(err)
	}

	bkt := gcsClient.Bucket(constants.GCSPrivateBucketName)

	wc := bkt.Object(constants.LocationDataGCSFilePath).NewWriter(ctx)
	wc.ContentType = "text/plain"
	wc.Metadata = map[string]string{
		"x-goog-meta-app":     "eklhad-web",
		"x-goog-meta-type":    "data",
		"x-goog-meta-dataset": "intagram",
	}
	fileContents, _ := json.MarshalIndent(locations, "", " ")

	if _, err := wc.Write([]byte(fileContents)); err != nil {
		log.Error("Unable to write Instagram data to GCS.")
		return
	}

	if err := wc.Close(); err != nil {
		log.Error("Unable to close writer for GCS while writing Instagram data.")
		return
	}
}

func writeLinksToGCS(links []structs.EklhadLink) {
	ctx := context.Background()
	gcsClient, err := storage.NewClient(ctx)
	if err != nil {
		log.Error(err)
	}

	bkt := gcsClient.Bucket(constants.GCSPrivateBucketName)

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
}

func writeBlogsToGCS(blogs []structs.EklhadBlog) {
	ctx := context.Background()
	gcsClient, err := storage.NewClient(ctx)
	if err != nil {
		log.Error(err)
	}

	bkt := gcsClient.Bucket(constants.GCSPrivateBucketName)

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
	// NOTE: I leveraged this blog post to get this worker to work properly.
	// https://medium.com/@scottcents/how-to-convert-google-sheets-to-json-in-just-3-steps-228fe2c24e6
	spreadSheetMetadataURL := fmt.Sprintf("https://spreadsheets.google.com/feeds/worksheets/%s/public/basic?alt=json", spreadSheetID)

	log.Info("Retrieving GSheet data...")
	resp, err := http.Get(spreadSheetMetadataURL)
	if err != nil {
		log.Error(err)
	}
	log.Info("GSheet data retrieved.")

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)

	var sheetMetadata structs.GSheetMetadata
	json.Unmarshal(body, &sheetMetadata)

	log.Info("Looping GSheet data entries...")
	for _, entry := range sheetMetadata.Feed.Entries {
		splitIDUrl := strings.Split(entry.ID.Value, "/")
		workSheetID := splitIDUrl[len(splitIDUrl)-1]

		sheetURL := fmt.Sprintf("https://spreadsheets.google.com/feeds/list/%s/%s/public/values?alt=json", spreadSheetID, workSheetID)
		resp, err = http.Get(sheetURL)

		if err != nil {
			log.Error(err)
		}

		defer resp.Body.Close()
		body, err = ioutil.ReadAll(resp.Body)

		if err != nil {
			log.Error(err)
		}

		if entry.Title.Value == "locations" {
			var gLocations structs.GSheetLocations
			json.Unmarshal(body, &gLocations)

			var eklhadLocations []structs.EklhadLocation
			for _, gLocation := range gLocations.Feed.Entries {
				location := fmt.Sprintf("%s, %s, %s", gLocation.City.Value, gLocation.StateProvinceRegion.Value, gLocation.Country.Value)
				// NOTE: Geocoding each location makes it this loop take longer than you would think.
				lat, lng := geo.GeocodeLocation(location)
				current := false

				log.Info("Processing location ", gLocation.City.Value)
				splitLocationIDURL := strings.Split(gLocation.ID.Value, "/")
				locationID := splitLocationIDURL[len(splitLocationIDURL)-1]

				if gLocation.Current.Value == "TRUE" {
					current = true
				}

				eklhadLocation := structs.EklhadLocation{
					ID:                  locationID,
					City:                gLocation.City.Value,
					StateProvinceRegion: gLocation.StateProvinceRegion.Value,
					Country:             gLocation.Country.Value,
					Current:             current,
					Lat:                 lat,
					Lng:                 lng,
				}
				eklhadLocations = append(eklhadLocations, eklhadLocation)
			}

			writeLocationsToGCS(eklhadLocations)
		} else if entry.Title.Value == "links" {
			var gLinks structs.GSheetLinks
			json.Unmarshal(body, &gLinks)

			var eklhadLinks []structs.EklhadLink
			for _, gLink := range gLinks.Feed.Entries {
				log.Info("Processing link ", gLink.Name.Value)
				splitLinkIDURL := strings.Split(gLink.ID.Value, "/")
				linkID := splitLinkIDURL[len(splitLinkIDURL)-1]

				// Has to be a specific date in Golang. /shrug
				timestamp, err := time.Parse(constants.GSheetsInputDateFmt, gLink.Date.Value)
				if err != nil {
					log.Error(err)
				}

				eklhadLink := structs.EklhadLink{
					ID:        linkID,
					Name:      gLink.Name.Value,
					Timestamp: timestamp.Unix(),
					Type:      gLink.Type.Value,
					URL:       gLink.URL.Value,
				}
				eklhadLinks = append(eklhadLinks, eklhadLink)
			}

			writeLinksToGCS(eklhadLinks)
		} else if entry.Title.Value == "blogs" {
			var gBlogs structs.GSheetBlogs
			json.Unmarshal(body, &gBlogs)

			var eklhadBlogs []structs.EklhadBlog
			for _, gBlog := range gBlogs.Feed.Entries {
				log.Info("Processing blog ", gBlog.Name.Value)
				// Has to be a specific date in Golang. /shrug
				timestamp, err := time.Parse(constants.GSheetsInputDateFmt, gBlog.Date.Value)
				if err != nil {
					log.Error(err)
				}

				blogContentPath, err := filepath.Abs(fmt.Sprintf("data/blogs/%s/index.md", gBlog.Path.Value))

				if err != nil {
					log.Error(err)
				}

				blogContentFile, err := os.Open(blogContentPath)
				if err != nil {
					log.Error(err)
				}
				defer blogContentFile.Close()
				jsonBytes, _ := ioutil.ReadAll(blogContentFile)

				eklhadBlog := structs.EklhadBlog{
					ID:        gBlog.ID.Value,
					Name:      gBlog.Name.Value,
					Timestamp: timestamp.Unix(),
					URL:       gBlog.URL.Value,
					Path:      gBlog.Path.Value,
					Content:   string(jsonBytes),
				}
				eklhadBlogs = append(eklhadBlogs, eklhadBlog)
			}

			writeBlogsToGCS(eklhadBlogs)
		}
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
