package services

import (
	"encoding/json"
	"io/ioutil"

	"github.com/dghubble/go-twitter/twitter"
)

// GetTweets reads the Twitter JSON data from the file system and returns it
func GetTweets() []twitter.Tweet {
	rawFileContents, _ := ioutil.ReadFile("./data/twitter/data.json")
	tweets := []twitter.Tweet{}
	_ = json.Unmarshal([]byte(rawFileContents), &tweets)
	return tweets
}
