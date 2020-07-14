package structs

// EklhadLink is the clean structure to be used to give link data back to the frontend
type EklhadLink struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Timestamp int64  `json:"timestamp"`
	Type      string `json:"type"`
	URL       string `json:"url"`
}
