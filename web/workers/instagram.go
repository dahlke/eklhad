package workers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"time"

	"github.com/dahlke/eklhad/web/constants"
	api "github.com/dahlke/goramma/api"
	goramma_structs "github.com/dahlke/goramma/structs"
	log "github.com/sirupsen/logrus"
)

func writeInstagramMedia(instagramMedia []goramma_structs.InstagramMedia) {
	fileWriteAbsPath, err := filepath.Abs(constants.IGDataPath)
	if err != nil {
		log.Error(err)
	}

	fileContents, _ := json.MarshalIndent(instagramMedia, "", " ")
	err = ioutil.WriteFile(fileWriteAbsPath, fileContents, 0644)

	if err != nil {
		log.Error(err)
	} else {
		infoMsg := fmt.Sprintf("Instagram media data written")
		log.Info(infoMsg)
	}
}

// GetDataFromInstagramForUser is used for testing that the API functions work as expected.
func GetDataFromInstagramForUser(username string) {
	fmt.Println("CircleTest 1")
	userID := api.GetUserIDFromMetadata(username)
	fmt.Println("CircleTest 2")
	var mediaTimeline []goramma_structs.InstagramMedia

	fmt.Println("CircleTest 3")
	// NOTE: This worker always pull all posts for simplicity as well as to
	// make sure sure that old deleted photos are not represented in the data here.
	endCursor := ""
	fmt.Println("CircleTest 4")
	for true {
		fmt.Println("CircleTest 5")
		mediaTimelineSlice, hasNextPage, newEndCursor := api.GetUserTimelineMedia(userID, endCursor)
		fmt.Println("CircleTest 6")
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

		// Sleep 10 seconds in between page requests to alleviate any stress on
		// a rate limit.
		time.Sleep(5 * time.Second)
	}

	writeInstagramMedia(mediaTimeline)
}
