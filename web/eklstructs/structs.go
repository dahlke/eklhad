package eklstructs

// GSheet Shared Structs
type GSheetEntryValue struct {
	Value string `json:"$t"`
}

// GSheet Spreadsheet Parser Structs
type GSheetPageEntry struct {
	ID      GSheetEntryValue `json:"id"`
	Updated GSheetEntryValue `json:"updated"`
	Title   GSheetEntryValue `json:"title"`
}

type GSheetPageFeed struct {
	Entries []GSheetPageEntry `json:"entry"`
}

type GSheetMetadata struct {
	Feed GSheetPageFeed `json:"feed"`
}

// GSheet Travel Parser Structs
type GSheetTravelEntry struct {
	ID                  GSheetEntryValue `json:"id"`
	City                GSheetEntryValue `json:"gsx$city"`
	StateProvinceRegion GSheetEntryValue `json:"gsx$stateprovinceregion"`
	Country             GSheetEntryValue `json:"gsx$country"`
	Current             GSheetEntryValue `json:"gsx$current"`
}

type GSheetTravelsFeed struct {
	Entries []GSheetTravelEntry `json:"entry"`
}

type GSheetTravels struct {
	Feed GSheetTravelsFeed `json:"feed"`
}

// GSheet Link Parser Structs
type GSheetLinkEntry struct {
	ID   GSheetEntryValue `json:"id"`
	Name GSheetEntryValue `json:"gsx$name"`
	Date GSheetEntryValue `json:"gsx$date"`
	Type GSheetEntryValue `json:"gsx$type"`
	URL  GSheetEntryValue `json:"gsx$url"`
}

type GSheetLinksFeed struct {
	Entries []GSheetLinkEntry `json:"entry"`
}

type GSheetLinks struct {
	Feed GSheetLinksFeed `json:"feed"`
}

// Eklhad Travel App Structs
type EklhadTravel struct {
	ID                  string  `json:"id"`
	City                string  `json:"city"`
	StateProvinceRegion string  `json:"stateprovinceregion"`
	Country             string  `json:"country"`
	Current             bool    `json:"current"`
	Lat                 float64 `json:"lat"`
	Lng                 float64 `json:"lng"`
}

// Eklhad Link App Structs
type EklhadLink struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Timestamp int64  `json:"timestamp"`
	Type      string `json:"type"`
	URL       string `json:"url"`
}

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
