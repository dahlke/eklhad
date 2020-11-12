package constants

/*
 USEFUL WORKER CONSTANTS
*/

// GSheetsInputDateFmt is used as a format for parsing dates from the GSheets worker
const GSheetsInputDateFmt = "2006-01-02"

// GitHubPageSize is used as the default page size for paged GitHub requests
const GitHubPageSize = 100

// TwitterSleepTimeSeconds is  of seconds to sleep between requests to Twitter
const TwitterSleepTimeSeconds = 1

// TwitterPageSize is the number of tweets to retrieve per request to Twitter
const TwitterPageSize = 50

/*
 GCS CONSTANTS
*/

// GCSPublicBucketName is the name of the public bucket in GCS that all the public data is stored in.
const GCSPublicBucketName = "eklhad-web-public"

// GCSPrivateBucketName is the name of the public bucket in GCS that all the pricate data is stored in.
const GCSPrivateBucketName = "eklhad-web-private"

// TwitterDataGCSFilePath is the path in GCS to the JSON blob file for Twitter data
const TwitterDataGCSFilePath = "data/twitter.json"

// InstagramDataGCSFilePath is the path in GCS to the JSON blob file for Instagram data
const InstagramDataGCSFilePath = "data/instagram.json"

// LocationDataGCSFilePath is the path in GCS to the JSON blob file for location data
const LocationDataGCSFilePath = "data/locations.json"

// LinkDataGCSFilePath is the path in GCS to the JSON blob file for links data
const LinkDataGCSFilePath = "data/links.json"

// GitHubActivityGCSFilePath is the path in GCS to the JSON blob file for GitHub data
const GitHubActivityGCSFilePath = "data/github.json"

// BlogDataGCSFilePath is the path in GCS to the JSON blob file for Blog data
const BlogDataGCSFilePath = "data/blogs.json"
