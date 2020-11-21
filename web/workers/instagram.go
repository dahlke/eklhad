package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	storage "cloud.google.com/go/storage"
	"github.com/dahlke/eklhad/web/constants"
	api "github.com/dahlke/goramma/api"
	"github.com/dahlke/goramma/structs"
	goramma_structs "github.com/dahlke/goramma/structs"
	log "github.com/sirupsen/logrus"
)

func writeInstagramMediaToGCS(instagramMedia []goramma_structs.InstagramMedia) {
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

	userMetadata := api.GetUserMetadata(instagramToken)
	fmt.Println(userMetadata)

	var allInstagramMedia []structs.InstagramMedia
	beforeEndCursor := ""
	endCursor := ""

	for true {
		log.Info(fmt.Sprintf("Fetching page of Instagram data with end cursor: %s ...", endCursor))
		userMedia := api.GetUserMedia(instagramToken, endCursor)
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
