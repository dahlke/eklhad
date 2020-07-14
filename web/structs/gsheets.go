package structs

/*
GSheet Shared Structs
*/
type gSheetEntryValue struct {
	Value string `json:"$t"`
}

type gSheetPageEntry struct {
	ID      gSheetEntryValue `json:"id"`
	Updated gSheetEntryValue `json:"updated"`
	Title   gSheetEntryValue `json:"title"`
}

type gSheetPageFeed struct {
	Entries []gSheetPageEntry `json:"entry"`
}

// GSheetMetadata gives us a structure for parsing metadata from GSheets
type GSheetMetadata struct {
	Feed gSheetPageFeed `json:"feed"`
}

/*
GSheet Location Parser Structs
*/
type gSheetLocationEntry struct {
	ID                  gSheetEntryValue `json:"id"`
	City                gSheetEntryValue `json:"gsx$city"`
	StateProvinceRegion gSheetEntryValue `json:"gsx$stateprovinceregion"`
	Country             gSheetEntryValue `json:"gsx$country"`
	Current             gSheetEntryValue `json:"gsx$current"`
}

type gSheetLocationFeed struct {
	Entries []gSheetLocationEntry `json:"entry"`
}

// GSheetLocations gives us a structure for parsing locations from GSheets
type GSheetLocations struct {
	Feed gSheetLocationFeed `json:"feed"`
}

/*
GSheet Link Parser Structs
*/
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

// GSheetLinks gives us a structure for parsing links from GSheets
type GSheetLinks struct {
	Feed gSheetLinksFeed `json:"feed"`
}
