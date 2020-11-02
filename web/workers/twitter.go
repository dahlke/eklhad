package workers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
	"github.com/dghubble/go-twitter/twitter"
	log "github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

// SleepTimeSeconds is  of seconds to sleep between requests to Twitter
const SleepTimeSeconds = 1

// PageSize is the number of tweets to retrieve per request to Twitter
const PageSize = 50

func convertTweets(tweets []twitter.Tweet) []structs.EklhadTweet {
	convertedTweets := []structs.EklhadTweet{}
	// TODO: get the username in here somehow?
	for _, tweet := range tweets {

		// https://godoc.org/github.com/dghubble/go-twitter/twitter#Tweet
		createdAtTime, err := tweet.CreatedAtTime()
		if err != nil {
			log.Error(err)
		}

		url := fmt.Sprintf("https://twitter.com/%s/status/%d", tweet.User.ScreenName, tweet.ID)

		convertedTweet := structs.EklhadTweet{
			tweet.IDStr,
			tweet.Text,
			createdAtTime.Unix(),
			url,
		}
		convertedTweets = append(convertedTweets, convertedTweet)
	}
	return convertedTweets
}

func writeTweets(tweets []twitter.Tweet) {
	fileWriteAbsPath, err := filepath.Abs(constants.TwitterDataPath)
	if err != nil {
		log.Error(err)
	}

	convertedTweets := convertTweets(tweets)
	fileContents, _ := json.MarshalIndent(convertedTweets, "", " ")
	err = ioutil.WriteFile(fileWriteAbsPath, fileContents, 0644)

	if err != nil {
		log.Error(err)
	} else {
		infoMsg := fmt.Sprintf("Tweets data written")
		log.Info(infoMsg)
	}
}

// GetDataFromTwitterForUser retrieves all the tweets for a user.
func GetDataFromTwitterForUser(username string) {
	consumerKey := os.Getenv("TWITTER_CONSUMER_API_KEY")
	consumerSecret := os.Getenv("TWITTER_CONSUMER_SECRET_KEY")

	config := &clientcredentials.Config{
		ClientID:     consumerKey,
		ClientSecret: consumerSecret,
		TokenURL:     "https://api.twitter.com/oauth2/token",
	}

	httpClient := config.Client(oauth2.NoContext)
	client := twitter.NewClient(httpClient)

	var allTweets []twitter.Tweet
	var minTweetID int64
	var lastMinTweetID int64

	iteration := 0

	for {
		log.Info(fmt.Sprintf("Retrieving Tweets with min ID %d.", minTweetID))
		userTimelineParams := &twitter.UserTimelineParams{
			ScreenName: username,
			Count:      PageSize,
			MaxID:      minTweetID,
		}

		// https://godoc.org/github.com/dghubble/go-twitter/twitter#TimelineService.UserTimeline
		tweets, _, _ := client.Timelines.UserTimeline(userTimelineParams)
		// TODO: deduplicate
		allTweets = append(allTweets, tweets...)

		// https://godoc.org/github.com/dghubble/go-twitter/twitter#Tweet
		for _, tweet := range tweets {
			if minTweetID == 0 || tweet.ID < minTweetID {
				minTweetID = tweet.ID
			}

		}
		time.Sleep(SleepTimeSeconds * time.Second)
		iteration = iteration + 1

		if lastMinTweetID == minTweetID {
			log.Info("All tweets retrieved.")
			break
		}

		lastMinTweetID = minTweetID
	}

	writeTweets(allTweets)
}

// ScheduleTwitterWork schedules GetDataFromTwitterForUser at an interval
func ScheduleTwitterWork(numSleepMins int, username string) {
	iterationNumber := 0
	for {
		log.Info(fmt.Sprintf("Starting Twitter worker scheduled task #%d...", iterationNumber))
		GetDataFromTwitterForUser(username)
		iterationNumber++
		log.Info(fmt.Sprintf("Twitter worker sleeping for %d minute(s)...", numSleepMins))
		time.Sleep(time.Duration(numSleepMins) * time.Minute)
	}
}
