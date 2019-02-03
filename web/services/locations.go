package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

type EklhadLocation struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Lat  string `json:"lat"`
	Lng  string `json:"lng"`
}

type EklhadLocations struct {
	Locations []EklhadLocation `json:"locations"`
}

func GetLocations() []EklhadLocation {
	locationsJsonFile, err := os.Open("data/locations.json")
	if err != nil {
		fmt.Println(err)
	}
	defer locationsJsonFile.Close()

	locationsByteValue, _ := ioutil.ReadAll(locationsJsonFile)

	var allLocations EklhadLocations
	json.Unmarshal(locationsByteValue, &allLocations)

	return allLocations.Locations
}
