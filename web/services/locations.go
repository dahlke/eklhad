package services

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/dahlke/eklhad/web/data"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

type locationRecord struct {
	City         string   `json:"city"`
	State        string   `json:"state"`
	Country      string   `json:"country"`
	Lat          *float64 `json:"lat"`
	Lng          *float64 `json:"lng"`
	Current      bool     `json:"current"`
	Layover      bool     `json:"layover"`
	Home         bool     `json:"home"`
	Notable      bool     `json:"notable"`
	Notability   int      `json:"notability"`
	DepartedFrom string   `json:"departed_from"`
	TravelMode   string   `json:"travel_mode"`
}

type locationPhoto struct {
	URL   string `json:"url"`
	Date  string `json:"date"`
	Emoji string `json:"emoji"`
	Stamp string `json:"stamp"`
	Badge string `json:"badge"`
	// Country and State pin a photo to one place when several rows share a city name.
	Country string `json:"country"`
	State   string `json:"state"`
	Poster  string `json:"poster"`
}

var loadLocationsOnce = sync.OnceValue(func() []structs.EklhadLocation {
	var records []locationRecord
	if err := json.Unmarshal(data.Locations, &records); err != nil {
		log.Errorf("Could not parse locations.json: %v", err)
		return nil
	}
	var photos map[string]locationPhoto
	if err := json.Unmarshal(data.LocationPhotos, &photos); err != nil {
		log.Errorf("Could not parse locationPhotos.json: %v", err)
	}

	// A photo is keyed by city name. An entry with a country (and state) only matches that
	// place; otherwise the first row with the name keeps the photo.
	photoUsed := map[string]bool{}
	var locations []structs.EklhadLocation
	for i, r := range records {
		if r.Lat == nil || r.Lng == nil {
			log.Warnf("Skipping %s, no coordinates", r.City)
			continue
		}
		loc := structs.EklhadLocation{
			ID:                  fmt.Sprint("location-", i),
			City:                r.City,
			StateProvinceRegion: r.State,
			Country:             r.Country,
			Current:             r.Current,
			Layover:             r.Layover,
			Home:                r.Home,
			Notable:             r.Notable,
			Notability:          r.Notability,
			Lat:                 *r.Lat,
			Lng:                 *r.Lng,
		}
		photo, ok := photos[r.City]
		if ok && photo.Country != "" && (photo.Country != r.Country || (photo.State != "" && photo.State != r.State)) {
			ok = false
		}
		if ok && !photoUsed[r.City] {
			photoUsed[r.City] = true
			loc.PhotoURL, loc.PhotoEmoji, loc.PhotoDate = photo.URL, photo.Emoji, photo.Date
			loc.StampURL, loc.BadgeURL, loc.PosterURL = photo.Stamp, photo.Badge, photo.Poster
		}
		locations = append(locations, loc)
	}
	return locations
})

// GetLocations returns the embedded locations with their photos attached.
func GetLocations() []structs.EklhadLocation {
	return loadLocationsOnce()
}
