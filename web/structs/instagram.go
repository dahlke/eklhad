package structs

// InstagramUserMetadata represents the high level user metadata.
type InstagramUserMetadata struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

// InstagramMedia represents a piece of Instagram content.
type InstagramMedia struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Caption   string `json:"caption"`
	Permalink string `json:"permalink"`
	Timestamp string `json:"timestamp"`
	MediaURL  string `json:"media_url"`
	MediaType string `json:"media_type"`
}

type instagramUserMediaPagingCursors struct {
	Before string `json:"before"`
	After  string `json:"after"`
}

type instagramUserMediaPaging struct {
	Cursors instagramUserMediaPagingCursors `json:"cursors"`
	Next    string                          `json:"next"`
}

// InstagramUserMedia gives us a page of InstagramMedia
type InstagramUserMedia struct {
	Data   []InstagramMedia         `json:"data"`
	Paging instagramUserMediaPaging `json:"paging"`
}
