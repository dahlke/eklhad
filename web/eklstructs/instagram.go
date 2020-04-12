package eklstructs

// Instagram Parser Structs
type InstagramGraphImageLocation struct {
	Name        string `json:"name"`
	AddressJSON string `json:"address_json"`
}

type InstagramGraphImage struct {
	DisplayURL string                      `json:"display_url"`
	IsVideo    bool                        `json:"is_video"`
	ShortCode  string                      `json:"shortcode"`
	Timestamp  int64                       `json:"taken_at_timestamp"`
	Location   InstagramGraphImageLocation `json:"location"`
	URLs       []string                    `json:"urls"`
}

type InstagramMetadata struct {
	GraphImages []InstagramGraphImage `json:"GraphImages"`
}
