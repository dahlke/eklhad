package services

import (
	"strings"
	"testing"
)

func TestTweets(t *testing.T) {
	tweets := GetTweets()
	firstTweet := tweets[0]

	if !(strings.Contains(firstTweet.User.URL, "http")) {
		t.Errorf("Tweets service did not return valid results.")
	}
}
