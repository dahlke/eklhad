package workers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/dahlke/eklhad/web/eklstructs"
	geo "github.com/dahlke/eklhad/web/geo"
	log "github.com/sirupsen/logrus"
)

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

	var sheetMetadata eklstructs.GSheetMetadata
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
			var gTravels eklstructs.GSheetTravels
			json.Unmarshal(body, &gTravels)

			var eTravels []eklstructs.EklhadTravel
			for _, gTravel := range gTravels.Feed.Entries {
				location := fmt.Sprintf("%s, %s, %s", gTravel.City.Value, gTravel.StateProvinceRegion.Value, gTravel.Country.Value)
				lat, lng := geo.GeocodeLocation(location)
				current := false

				splitTravelIDURL := strings.Split(gTravel.ID.Value, "/")
				travelID := splitTravelIDURL[len(splitTravelIDURL)-1]

				if gTravel.Current.Value == "TRUE" {
					current = true
				}

				eTravel := eklstructs.EklhadTravel{
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
			var gLinks eklstructs.GSheetLinks
			json.Unmarshal(body, &gLinks)

			var eLinks []eklstructs.EklhadLink
			for _, gLink := range gLinks.Feed.Entries {
				splitLinkIDURL := strings.Split(gLink.ID.Value, "/")
				linkID := splitLinkIDURL[len(splitLinkIDURL)-1]

				eLink := eklstructs.EklhadLink{
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

		fileWritePath := fmt.Sprintf("./data/enriched-gsheets-%s.json", entry.Title.Value)
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
