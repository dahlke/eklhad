package services

import (
	"bytes"
	"fmt"

	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/codingsince1985/geo-golang/openstreetmap"

	geojson "github.com/paulmach/go.geojson"
	log "github.com/sirupsen/logrus"
)

type eklhadCities struct {
	Locations []string `json:"cities"`
}

func loadCitiesFromJSON() []string {
	absCitiesJSONPath, err := filepath.Abs("./services/data/cities-array.json")
	if err != nil {
		log.Error(err)
	}

	citiesJSONFile, err := os.Open(absCitiesJSONPath)
	if err != nil {
		log.Error(err)
	}
	defer citiesJSONFile.Close()

	locationsByteValue, _ := ioutil.ReadAll(citiesJSONFile)

	var allLocations eklhadCities
	json.Unmarshal(locationsByteValue, &allLocations)

	return allLocations.Locations
}

func ConvertJSONArrayToGeoJSON() {
	geocoder := openstreetmap.Geocoder()
	citiesArray := loadCitiesFromJSON()
	fc := geojson.NewFeatureCollection()

	idCounter := 0
	for _, city := range citiesArray {
		var pf *geojson.Feature

		geocodedLocation, err := geocoder.Geocode(city)
		if err != nil {
			fmt.Println(city, err)
		}
		if geocodedLocation != nil {
			pf = geojson.NewPointFeature([]float64{geocodedLocation.Lng, geocodedLocation.Lat})
			pf.Properties = nil
			pf.SetProperty("city", city)
			pf.SetProperty("id", idCounter)

			address, _ := geocoder.ReverseGeocode(geocodedLocation.Lat, geocodedLocation.Lng)
			if address != nil {
				pf.SetProperty("state", address.State)
				pf.SetProperty("country", address.Country)
			} else {
				fmt.Println("got <nil> address")
			}

			fc.AddFeature(pf)
		} else {
			fmt.Println("got <nil> location")
		}

		idCounter++
		fmt.Println(city, "geocoded.")
	}

	featureCollectionJSONBytes, _ := fc.MarshalJSON()
	var prettyFeatureCollectionJSONBytes bytes.Buffer
	json.Indent(&prettyFeatureCollectionJSONBytes, featureCollectionJSONBytes, "", "\t")
	err := ioutil.WriteFile("./services/data/locations.geojson", prettyFeatureCollectionJSONBytes.Bytes(), 0644)
	if err != nil {
		log.Error(err)
	}
}

func GetLocationsGeoJSON() geojson.FeatureCollection {
	geojsonFilePath, err := filepath.Abs("./services/data/locations.geojson")
	if err != nil {
		log.Error(err)
	}

	geojsonFile, err := os.Open(geojsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer geojsonFile.Close()

	geojsonBytes, _ := ioutil.ReadAll(geojsonFile)
	geojsonFeatureCollection, err := geojson.UnmarshalFeatureCollection(geojsonBytes)

	return *geojsonFeatureCollection
}
