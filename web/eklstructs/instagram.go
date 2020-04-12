package eklstructs

// Instagram Display Structs

type InstagramMedia struct {
	ShortCode string `json:"shortcode"`
	Timestamp int    `json:"timestamp"`
	Location  string `json:"location"`
	URL       string `json:"url"`
}
