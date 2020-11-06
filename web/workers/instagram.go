package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	storage "cloud.google.com/go/storage"
	"github.com/dahlke/eklhad/web/constants"
	api "github.com/dahlke/goramma/api"
	goramma_structs "github.com/dahlke/goramma/structs"
	log "github.com/sirupsen/logrus"
)

func writeInstagramMediaToGCS(instagramMedia []goramma_structs.InstagramMedia) {
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
		"x-goog-meta-dataset": "intagram",
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
}

// GetDataFromInstagramForUser retrieves all the Instagram metadata for a user.
func GetDataFromInstagramForUser(username string) {
	userID := api.GetUserIDFromMetadata(username)
	var mediaTimeline []goramma_structs.InstagramMedia

	// NOTE: This worker always pull all posts for simplicity as well as to
	// make sure sure that old deleted photos are not represented in the data here.
	endCursor := ""
	for true {
		mediaTimelineSlice, hasNextPage, newEndCursor := api.GetUserTimelineMedia(userID, endCursor)
		mediaTimeline = append(mediaTimelineSlice, mediaTimeline...)

		// Very stupid that I have to do this, but Golang doesn't recognize
		// that changing the endCursor in the return value changes this loop
		// and it complains.
		endCursor = newEndCursor

		if hasNextPage {
			log.Info("Getting another page...")
		} else {
			break
		}

		// Sleep 5 seconds in between page requests to alleviate any stress on
		// a rate limit.
		time.Sleep(5 * time.Second)
	}

	writeInstagramMediaToGCS(mediaTimeline)
}

// ScheduleInstagramWork schedules GetDataFromInstagramForUser at an interval
func ScheduleInstagramWork(numSleepMins int, username string) {
	iterationNumber := 0
	for {
		log.Info(fmt.Sprintf("Starting Instagram worker scheduled task #%d...", iterationNumber))
		GetDataFromInstagramForUser(username)
		iterationNumber++
		log.Info(fmt.Sprintf("Instagram worker sleeping for %d minute(s)...", numSleepMins))
		time.Sleep(time.Duration(numSleepMins) * time.Minute)
	}
}
