package workers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/dahlke/eklhad/web/constants"
	geo "github.com/dahlke/eklhad/web/geo"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

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

		var fileContents []byte
		var fileWritePath string

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

			fileWritePath = constants.LocationsDataPath
			fileContents, _ = json.MarshalIndent(eklhadLocations, "", " ")
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

			fileWritePath = constants.LinksDataPath
			fileContents, _ = json.MarshalIndent(eklhadLinks, "", " ")
		}

		fileWriteAbsPath, err := filepath.Abs(fileWritePath)
		if err != nil {
			log.Error(err)
		}

		err = ioutil.WriteFile(fileWriteAbsPath, fileContents, 0644)

		if err != nil {
			log.Error(err)
		} else {
			infoMsg := fmt.Sprintf("Google sheets page (%s) successfully saved.", entry.Title.Value)
			log.Info(infoMsg)
		}
	}

}

func ScheduleGSheetsWork(numSleepMins int, spreadSheetID string) {
	iterationNumber := 0
	for {
		fmt.Println(fmt.Sprintf("Starting GSheets worker scheduled task #%d...", iterationNumber))
		GetDataFromGSheets(spreadSheetID)
		iterationNumber++
		fmt.Println(fmt.Sprintf("GSheets worker sleeping for %d minute(s)...", numSleepMins))
		time.Sleep(time.Duration(numSleepMins) * time.Minute)
	}
}
