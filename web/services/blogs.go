package services

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/dahlke/eklhad/web/data"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

var loadBlogsOnce = sync.OnceValue(func() []structs.EklhadBlog {
	var records []struct {
		Name        string `json:"name"`
		Date        string `json:"date"`
		URL         string `json:"url"`
		MediumURL   string `json:"medium_url"`
		OriginalURL string `json:"original_url"`
		GistURL     string `json:"gist_url"`
		Path        string `json:"path"`
	}
	if err := json.Unmarshal(data.Blogs, &records); err != nil {
		log.Errorf("Could not parse blogs.json: %v", err)
		return nil
	}
	blogs := make([]structs.EklhadBlog, len(records))
	for i, r := range records {
		blogs[i] = structs.EklhadBlog{
			ID: fmt.Sprint("blog-", i), Name: r.Name, Timestamp: dateToUnix(r.Date), URL: r.URL,
			MediumURL: r.MediumURL, OriginalURL: r.OriginalURL, GistURL: r.GistURL, Path: r.Path,
		}
	}
	return blogs
})

// GetBlogs returns the embedded blog index.
func GetBlogs() []structs.EklhadBlog {
	return loadBlogsOnce()
}
