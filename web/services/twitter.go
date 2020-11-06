package services

import (
	"encoding/json"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
)

// GetTweets reads the Twitter JSON data from GCS
func GetTweets() []structs.EklhadTweet {
	jsonBytes := ReadJSONFromGCS(constants.GCSPrivateBucketName, constants.TwitterDataGCSFilePath)
	var tweets []structs.EklhadTweet
	json.Unmarshal(jsonBytes, &tweets)

	return tweets
}
