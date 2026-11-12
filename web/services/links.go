package services

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/dahlke/eklhad/web/data"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

const dateFmt = "2006-01-02"

func dateToUnix(date string) int64 {
	t, err := time.Parse(dateFmt, date)
	if err != nil {
		log.Errorf("Bad date %q: %v", date, err)
	}
	return t.Unix()
}

var loadLinksOnce = sync.OnceValue(func() []structs.EklhadLink {
	var records []struct {
		Name string `json:"name"`
		Date string `json:"date"`
		Type string `json:"type"`
		URL  string `json:"url"`
	}
	if err := json.Unmarshal(data.Links, &records); err != nil {
		log.Errorf("Could not parse links.json: %v", err)
		return nil
	}
	links := make([]structs.EklhadLink, len(records))
	for i, r := range records {
		links[i] = structs.EklhadLink{ID: fmt.Sprint("link-", i), Name: r.Name, Timestamp: dateToUnix(r.Date), Type: r.Type, URL: r.URL}
	}
	return links
})

// GetLinks returns the embedded links.
func GetLinks() []structs.EklhadLink {
	return loadLinksOnce()
}
