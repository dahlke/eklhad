package structs

// EklhadBlog represents a blog post's metadata and it's contents.
type EklhadBlog struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Timestamp   int64  `json:"timestamp"`
	URL         string `json:"url"`
	MediumURL   string `json:"medium_url"`
	OriginalURL string `json:"original_url"`
	GistURL     string `json:"gist_url"`
	Path        string `json:"path"`
}
