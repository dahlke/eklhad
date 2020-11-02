package structs

type EklhadBlog struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Timestamp int64  `json:"timestamp"`
	URL       string `json:"url"`
	Path      string `json:"path"`
	Content   string `json:"content"`
}
