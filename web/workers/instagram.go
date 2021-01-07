package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"time"

	storage "cloud.google.com/go/storage"
	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

// InstagramTimestampFmt is used as a format for parsing dates from the Instagram Graph API
const InstagramTimestampFmt = "2006-01-02T15:04:05-0700"

// InstagramGraphBaseURL is the Instagram Graph API base url to use across this library.
const InstagramGraphBaseURL = "https://graph.instagram.com"

func getUserMetadata(instagramToken string) structs.InstagramUserMetadata {
	url := fmt.Sprintf("%s/me?fields=id,username&access_token=%s", InstagramGraphBaseURL, instagramToken)

	resp, err := http.Get(url)
	if err != nil {
		log.Error(err)
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error(err)
	}

	var userMetadata = new(structs.InstagramUserMetadata)
	err = json.Unmarshal(body, &userMetadata)
	if err != nil {
		log.Error(err)
	}

	return *userMetadata
}

func getUserMedia(instagramToken string, endCursor string) structs.InstagramUserMedia {
	url := fmt.Sprintf("%s/me/media?fields=id,media_type,media_url,permalink,username,timestamp,caption&limit=50&access_token=%s&after=%s", InstagramGraphBaseURL, instagramToken, endCursor)

	resp, err := http.Get(url)
	if err != nil {
		log.Error(err)
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error(err)
	}

	var userMedia = new(structs.InstagramUserMedia)
	err = json.Unmarshal(body, &userMedia)
	if err != nil {
		log.Error(err)
	}

	for i := range userMedia.Data {
		timestamp, err := time.Parse(InstagramTimestampFmt, userMedia.Data[i].Timestamp)
		if err != nil {
			log.Error(err)
		}
		unixTimestampStr := strconv.FormatInt(timestamp.Unix(), 10)
		userMedia.Data[i].Timestamp = unixTimestampStr
	}

	return *userMedia
}

func writeInstagramMediaToGCS(instagramMedia []structs.InstagramMedia) {
	if len(instagramMedia) > 0 {
		ctx := context.Background()
		gcsClient, err := storage.NewClient(ctx)
		if err != nil {
			log.Error(err)
		}

		bkt := gcsClient.Bucket(constants.GCSPrivateBucketName)

		wc := bkt.Object(constants.InstagramDataGCSFilePath).NewWriter(ctx)
		wc.ContentType = "text/plain"
		wc.Metadata = map[string]string{
			"x-goog-meta-app":     "eklhad-web",
			"x-goog-meta-type":    "data",
			"x-goog-meta-dataset": "instagram",
		}
		fileContents, _ := json.MarshalIndent(instagramMedia, "", " ")

		if _, err := wc.Write([]byte(fileContents)); err != nil {
			log.Error("Unable to write Instagram data to GCS.")
			return
		}

		if err := wc.Close(); err != nil {
			log.Error("Unable to close writer for GCS while writing Instagram data.")
			return
		}

		log.Info("Instagram data successfully written to GCS.")
	} else {
		log.Error("Something went wrong, the data set was size zero, so no Instagram data was overwritten in GCS.")
	}

}

// GetDataFromInstagramForUser retrieves all the Instagram metadata for a user.
func GetDataFromInstagramForUser() {
	instagramToken := os.Getenv("INSTAGRAM_ACCESS_TOKEN")

	var allInstagramMedia []structs.InstagramMedia
	beforeEndCursor := ""
	endCursor := ""

	for true {
		log.Info(fmt.Sprintf("Fetching page of Instagram data with end cursor: %s ...", endCursor))
		userMedia := getUserMedia(instagramToken, endCursor)
		allInstagramMedia = append(allInstagramMedia, userMedia.Data...)
		beforeEndCursor = userMedia.Paging.Cursors.Before
		endCursor = userMedia.Paging.Cursors.After

		if beforeEndCursor == endCursor {
			log.Info("Finished fetching data from Instagram.")
			break
		}
		time.Sleep(1 * time.Second)
	}

	writeInstagramMediaToGCS(allInstagramMedia)
}

// ScheduleInstagramWork schedules GetDataFromInstagramForUser at an interval
func ScheduleInstagramWork(numSleepMins int, username string) {
	iterationNumber := 0
	for {
		log.Info(fmt.Sprintf("Starting Instagram worker scheduled task #%d...", iterationNumber))
		GetDataFromInstagramForUser()
		iterationNumber++
		log.Info(fmt.Sprintf("Instagram worker sleeping for %d minute(s)...", numSleepMins))
		time.Sleep(time.Duration(numSleepMins) * time.Minute)
	}
}
