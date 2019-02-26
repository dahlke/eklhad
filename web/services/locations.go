package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	geojson "github.com/paulmach/go.geojson"
)

type EklhadLocation struct {
	ID   int64   `json:"id"`
	Name string  `json:"name"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
}

type EklhadLocations struct {
	Locations []EklhadLocation `json:"locations"`
}

func loadLocationsFromLocalJSON() []EklhadLocation {
	absLocationsJsonPath, err := filepath.Abs("./services/data/locations.json")
	if err != nil {
		fmt.Println(err)
	}

	locationsJsonFile, err := os.Open(absLocationsJsonPath)
	if err != nil {
		fmt.Println(err)
	}
	defer locationsJsonFile.Close()

	locationsByteValue, _ := ioutil.ReadAll(locationsJsonFile)

	var allLocations EklhadLocations
	json.Unmarshal(locationsByteValue, &allLocations)

	return allLocations.Locations
}

func GetLocationsGeoJSON() geojson.FeatureCollection {
	locations := loadLocationsFromLocalJSON()
	fc := geojson.NewFeatureCollection()

	for _, location := range locations {
		pf := geojson.NewPointFeature([]float64{location.Lng, location.Lat})
		pf.Properties = nil
		pf.SetProperty("name", location.Name)
		pf.SetProperty("id", location.ID)
		fc.AddFeature(pf)
	}

	return *fc
}
