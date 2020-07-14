package constants

// GSheetsInputDateFmt is used as a format for parsing dates from the GSheets worker
const GSheetsInputDateFmt = "2006-01-02"

// LinksDataPath is used as the target read/write path for GSheets link data
const LinksDataPath = "./data/gsheets/links/data.json"

// LocationsDataPath is used as the target read/write path for GSheets location data
const LocationsDataPath = "./data/gsheets/locations/data.json"

// IGDataPath is used as the target read/write path for IG data
const IGDataPath = "./data/instagram/data.json"

// GitHubActivityPath is used as the target read/write path for GitHub data
const GitHubActivityPath = "./data/github/activity.json"

// GitHubPageSize is used as the default page size for paged GitHub requests
const GitHubPageSize = 100
