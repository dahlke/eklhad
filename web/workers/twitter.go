package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
	"github.com/dghubble/go-twitter/twitter"
	log "github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"

	storage "cloud.google.com/go/storage"
)

func convertTweets(tweets []twitter.Tweet) []structs.EklhadTweet {
	convertedTweets := []structs.EklhadTweet{}
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

func findTweetID(tweetSlice []structs.EklhadTweet, tweetID string) bool {
	found := false

	for _, tweet := range tweetSlice {
		if tweet.ID == tweetID {
			found = true
			break
		}
	}

	return found
}

func deduplicateTweets(tweets []structs.EklhadTweet) []structs.EklhadTweet {
	deduplicatedTweets := []structs.EklhadTweet{}
	for _, tweet := range tweets {
		exists := findTweetID(deduplicatedTweets, tweet.ID)
		if !exists {
			deduplicatedTweets = append(deduplicatedTweets, tweet)
		}
	}
	fmt.Println(len(deduplicatedTweets), len(tweets))
	return deduplicatedTweets
}

func writeTweetsToGCS(tweets []twitter.Tweet) {
	if len(tweets) > 0 {
		ctx := context.Background()
		gcsClient, err := storage.NewClient(ctx)
		if err != nil {
			log.Error(err)
		}

		bkt := gcsClient.Bucket(constants.GCSPrivateBucketName)

		wc := bkt.Object(constants.TwitterDataGCSFilePath).NewWriter(ctx)
		wc.ContentType = "text/plain"
		wc.Metadata = map[string]string{
			"x-goog-meta-app":     "eklhad-web",
			"x-goog-meta-type":    "data",
			"x-goog-meta-dataset": "twitter",
		}
		convertedTweets := convertTweets(tweets)
		deduplicatedTweets := deduplicateTweets(convertedTweets)
		fileContents, _ := json.MarshalIndent(deduplicatedTweets, "", " ")

		if _, err := wc.Write([]byte(fileContents)); err != nil {
			log.Error("Unable to write Twitter data to GCS.")
			return
		}

		if err := wc.Close(); err != nil {
			log.Error("Unable to close writer for GCS while writing Twitter data.")
			return
		}

		log.Info("Twitter data successfully written to GCS.")
	} else {
		log.Error("Something went wrong, the data set was size zero, so no Twitter data was overwritten in GCS.")
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
	twitterClient := twitter.NewClient(httpClient)

	var allTweets []twitter.Tweet
	var minTweetID int64
	var lastMinTweetID int64

	iteration := 0

	for {
		log.Info(fmt.Sprintf("Retrieving Tweets with min ID %d.", minTweetID))
		userTimelineParams := &twitter.UserTimelineParams{
			ScreenName: username,
			Count:      constants.TwitterPageSize,
			MaxID:      minTweetID,
		}

		// https://godoc.org/github.com/dghubble/go-twitter/twitter#TimelineService.UserTimeline
		tweets, _, _ := twitterClient.Timelines.UserTimeline(userTimelineParams)
		allTweets = append(allTweets, tweets...)

		// https://godoc.org/github.com/dghubble/go-twitter/twitter#Tweet
		for _, tweet := range tweets {
			if minTweetID == 0 || tweet.ID < minTweetID {
				minTweetID = tweet.ID
			}

		}
		time.Sleep(constants.TwitterSleepTimeSeconds * time.Second)
		iteration = iteration + 1

		if lastMinTweetID == minTweetID {
			log.Info("All tweets retrieved.")
			break
		}

		lastMinTweetID = minTweetID
	}

	writeTweetsToGCS(allTweets)
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
