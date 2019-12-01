package services

// GSheet Shared Structs
type gSheetEntryValue struct {
	Value string `json:"$t"`
}

// GSheet Spreadsheet Structs
type gSheetPageEntry struct {
	ID      gSheetEntryValue `json:"id"`
	Updated gSheetEntryValue `json:"updated"`
	Title   gSheetEntryValue `json:"title"`
}

type gSheetPageFeed struct {
	Entries []gSheetPageEntry `json:"entry"`
}

type gSheetMetadata struct {
	Feed gSheetPageFeed `json:"feed"`
}

// GSheet Travel Structs
type gSheetTravelEntry struct {
	ID                  gSheetEntryValue `json:"id"`
	City                gSheetEntryValue `json:"gsx$city"`
	StateProvinceRegion gSheetEntryValue `json:"gsx$stateprovinceregion"`
	Country             gSheetEntryValue `json:"gsx$country"`
	Current             gSheetEntryValue `json:"gsx$current"`
}

type gSheetTravelsFeed struct {
	Entries []gSheetTravelEntry `json:"entry"`
}

type gSheetTravels struct {
	Feed gSheetTravelsFeed `json:"feed"`
}

// GSheet Link Structs
type gSheetLinkEntry struct {
	ID   gSheetEntryValue `json:"id"`
	Name gSheetEntryValue `json:"gsx$name"`
	Date gSheetEntryValue `json:"gsx$date"`
	Type gSheetEntryValue `json:"gsx$type"`
	URL  gSheetEntryValue `json:"gsx$url"`
}

type gSheetLinksFeed struct {
	Entries []gSheetLinkEntry `json:"entry"`
}

type gSheetLinks struct {
	Feed gSheetLinksFeed `json:"feed"`
}

// Eklhad Travel Structs for JSON Reading
type eklhadTravel struct {
	ID                  string  `json:"id"`
	City                string  `json:"city"`
	StateProvinceRegion string  `json:"state_province_region"`
	Country             string  `json:"country"`
	Current             bool    `json:"current"`
	Lat                 float64 `json:"lat"`
	Lng                 float64 `json:"lng"`
}

// Eklhad Link Structs
type eklhadLink struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Date string `json:"date"`
	Type string `json:"type"`
	URL  string `json:"url"`
}
