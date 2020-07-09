package eklhad_structs


// Eklhad Link App Structs
type EklhadLink struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Timestamp int64  `json:"timestamp"`
	Type      string `json:"type"`
	URL       string `json:"url"`
}
