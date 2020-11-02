package services

import (
	"encoding/json"
	"io/ioutil"

	"github.com/dahlke/eklhad/web/structs"
)

// GetTweets reads the Twitter JSON data from the file system and returns it
func GetTweets() []structs.EklhadTweet {
	rawFileContents, _ := ioutil.ReadFile("./data/twitter/data.json")
	tweets := []structs.EklhadTweet{}
	_ = json.Unmarshal([]byte(rawFileContents), &tweets)
	return tweets
}
