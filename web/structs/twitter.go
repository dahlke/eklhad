package structs

// EklhadTweet is the clean structure to be used to give tweet data back to the frontend
type EklhadTweet struct {
	ID        string `json:"id"`
	Text      string `json:"text"`
	Timestamp int64  `json:"timestamp"`
	URL       string `json:"url"`
}
