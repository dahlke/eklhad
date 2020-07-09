package eklhad_structs

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
