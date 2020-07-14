package geo

import (
	"github.com/codingsince1985/geo-golang/openstreetmap"
	log "github.com/sirupsen/logrus"
)

// GeocodeLocation takes a location string and returns a lat/lng pair of floats from OpenStreetMap
func GeocodeLocation(location string) (float64, float64) {
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
		log.Error("got <nil> address", location)
	}

	return lat, lng
}
