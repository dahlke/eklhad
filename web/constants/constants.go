package constants

/*
 USEFUL WORKER CONSTANTS
*/

// GSheetsInputDateFmt is used as a format for parsing dates from the GSheets worker
const GSheetsInputDateFmt = "2006-01-02"

/*
 GCS CONSTANTS
*/

// GCSPublicBucketName is the name of the public bucket in GCS that all the public data is stored in.
const GCSPublicBucketName = "eklhad-web-public"

// LocationDataGCSFilePath is the path in GCS to the JSON blob file for location data
const LocationDataGCSFilePath = "data/locations.json"

// LinkDataGCSFilePath is the path in GCS to the JSON blob file for links data
const LinkDataGCSFilePath = "data/links.json"

// BlogDataGCSFilePath is the path in GCS to the JSON blob file for Blog data
const BlogDataGCSFilePath = "data/blogs.json"
