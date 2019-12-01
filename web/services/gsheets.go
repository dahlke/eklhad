package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/codingsince1985/geo-golang/openstreetmap"
	log "github.com/sirupsen/logrus"
)

func geocodeLocation(location string) (float64, float64) {
	geocoder := openstreetmap.Geocoder()
	geocodedLocation, err := geocoder.Geocode(location)
	var lat float64
	var lng float64

	if err != nil {
		log.Error(err)
	}

	if geocodedLocation != nil {
		lat = float64(geocodedLocation.Lat)
		lng = float64(geocodedLocation.Lng)
	} else {
		fmt.Println("got <nil> address", location)
	}

	return lat, lng
}

func GetDataFromGSheets(spreadSheetID string) {
	// https://medium.com/@scottcents/how-to-convert-google-sheets-to-json-in-just-3-steps-228fe2c24e6
	// TODO: get this from a config somewhere
	spreadSheetMetadataURL := fmt.Sprintf("https://spreadsheets.google.com/feeds/worksheets/%s/public/basic?alt=json", spreadSheetID)

	resp, err := http.Get(spreadSheetMetadataURL)
	if err != nil {
		log.Error(err)
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)

	var sheetMetadata gSheetMetadata
	json.Unmarshal(body, &sheetMetadata)

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

		if entry.Title.Value == "travels" {
			var gTravels gSheetTravels
			json.Unmarshal(body, &gTravels)

			var eTravels []eklhadTravel
			for _, gTravel := range gTravels.Feed.Entries {
				location := fmt.Sprintf("%s, %s, %s", gTravel.City.Value, gTravel.StateProvinceRegion.Value, gTravel.Country.Value)
				lat, lng := geocodeLocation(location)
				current := false

				splitTravelIDURL := strings.Split(gTravel.ID.Value, "/")
				travelID := splitTravelIDURL[len(splitTravelIDURL)-1]

				if gTravel.Current.Value == "TRUE" {
					current = true
				}

				eTravel := eklhadTravel{
					travelID,
					gTravel.City.Value,
					gTravel.StateProvinceRegion.Value,
					gTravel.Country.Value,
					current,
					lat,
					lng,
				}
				eTravels = append(eTravels, eTravel)
			}

			fileContents, _ = json.MarshalIndent(eTravels, "", " ")
		} else if entry.Title.Value == "links" {
			var gLinks gSheetLinks
			json.Unmarshal(body, &gLinks)

			var eLinks []eklhadLink
			for _, gLink := range gLinks.Feed.Entries {
				splitLinkIDURL := strings.Split(gLink.ID.Value, "/")
				linkID := splitLinkIDURL[len(splitLinkIDURL)-1]

				eLink := eklhadLink{
					linkID,
					gLink.Name.Value,
					gLink.Date.Value,
					gLink.Type.Value,
					gLink.URL.Value,
				}
				eLinks = append(eLinks, eLink)
			}

			fileContents, _ = json.MarshalIndent(eLinks, "", " ")
		}

		fileWritePath := fmt.Sprintf("./services/data/enriched-gsheets-%s.json", entry.Title.Value)

		err = ioutil.WriteFile(fileWritePath, fileContents, 0644)

		if err != nil {
			log.Error(err)
		} else {
			infoMsg := fmt.Sprintf("Google sheets page (%s) successfully saved.", entry.Title.Value)
			log.Info(infoMsg)
		}
	}

}
