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
	Cities      []string `json:"cities"`
	CurrentCity string   `json:"current_city"`
}

func loadCitiesFromJSON() eklhadCities {
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

	var cityData eklhadCities
	json.Unmarshal(locationsByteValue, &cityData)

	return cityData
}

func GeocodeJSON() {
	geocoder := openstreetmap.Geocoder()
	cityData := loadCitiesFromJSON()
	citiesArray := cityData.Cities
	currentCity := cityData.CurrentCity

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
	err := ioutil.WriteFile("./services/data/locations_test.geojson", prettyFeatureCollectionJSONBytes.Bytes(), 0644)
	if err != nil {
		log.Error(err)
	}

	currentCityGeocodedLocation, err := geocoder.Geocode(currentCity)
	var currentCityPF *geojson.Feature
	currentCityPF = geojson.NewPointFeature([]float64{currentCityGeocodedLocation.Lng, currentCityGeocodedLocation.Lat})
	currentCityPF.Properties = nil
	currentCityPF.SetProperty("city", currentCity)
	currentCityPF.SetProperty("id", idCounter)

	currentCityPFJSONBytes, _ := fc.MarshalJSON()
	var prettyCurrentCityPFBytes bytes.Buffer
	json.Indent(&prettyCurrentCityPFBytes, currentCityPFJSONBytes, "", "\t")
	err = ioutil.WriteFile("./services/data/current_location_test.geojson", prettyCurrentCityPFBytes.Bytes(), 0644)
	if err != nil {
		log.Error(err)
	}
}

func GetLocationsGeoJSON() geojson.FeatureCollection {
	geojsonFilePath, err := filepath.Abs("./services/data/locations.geojson")
	if err != nil {
		log.Error(err)
	}

	allLocationsGeoJSONFile, err := os.Open(geojsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer allLocationsGeoJSONFile.Close()

	geojsonBytes, _ := ioutil.ReadAll(allLocationsGeoJSONFile)
	geojsonFeatureCollection, err := geojson.UnmarshalFeatureCollection(geojsonBytes)

	return *geojsonFeatureCollection
}

func GetCurrentLocationGeoJSON() geojson.Feature {
	geojsonFilePath, err := filepath.Abs("./services/data/current_location.geojson")
	if err != nil {
		log.Error(err)
	}

	currentLocationGeoJSONFile, err := os.Open(geojsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer currentLocationGeoJSONFile.Close()

	geojsonBytes, _ := ioutil.ReadAll(currentLocationGeoJSONFile)
	geojsonCurrentLocation, err := geojson.UnmarshalFeature(geojsonBytes)

	return *geojsonCurrentLocation
}
