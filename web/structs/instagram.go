package structs

type InstagramUserMetadata struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

type InstagramMedia struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Caption   string `json:"caption"`
	Permalink string `json:"permalink"`
	Timestamp string `json:"timestamp"`
	MediaURL  string `json:"media_url"`
	MediaType string `json:"media_type"`
}

type InstagramUserMediaPagingCursors struct {
	Before string `json:"before"`
	After  string `json:"after"`
}

type InstagramUserMediaPaging struct {
	Cursors InstagramUserMediaPagingCursors `json:"cursors"`
	Next    string                          `json:"next"`
}

type InstagramUserMedia struct {
	Data   []InstagramMedia         `json:"data"`
	Paging InstagramUserMediaPaging `json:"paging"`
}
