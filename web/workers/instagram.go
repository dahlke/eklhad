package workers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/dahlke/eklhad/web/eklstructs"
	log "github.com/sirupsen/logrus"
)

// TODO: do proper logging  in this file
// TODO: standardize the writes in this file
const BaseUrl = "https://www.instagram.com"

// TODO: move this to a util file
func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func igAPIHTTPRequest(igURL string) []byte {
	httpClient := http.Client{Timeout: time.Second * 2}

	req, err := http.NewRequest(http.MethodGet, igURL, nil)
	if err != nil {
		log.Fatal(err)
	}

	req.Header.Set("User-Agent", "los-jabronis")

	res, err := httpClient.Do(req)
	if err != nil {
		log.Fatal(err)
	}

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Fatal(err)
	}

	return body
}

func getUserMetadataFromInstagramURL(url string) *eklstructs.IGAPIUserMetadata {
	body := igAPIHTTPRequest(url)

	var userMetadata = new(eklstructs.IGAPIUserMetadata)
	err := json.Unmarshal(body, &userMetadata)

	if err != nil {
		log.Fatal(err)
	}

	return userMetadata
}

func getMediaDetailFromShortcode(shortcode string) *eklstructs.IGAPIMediaDetail {
	// Example URL: https://www.instagram.com/p/B-AlSmXAYFM/?__a=1
	url := fmt.Sprintf("%s/p/%s/?__a=1", BaseUrl, shortcode)
	body := igAPIHTTPRequest(url)

	var mediaDetail = new(eklstructs.IGAPIMediaDetail)
	err := json.Unmarshal(body, &mediaDetail)

	if err != nil {
		log.Fatal(err)
	}

	return mediaDetail
}

func getUserTimelineMediaFromURL(url string) *eklstructs.IGAPITimeline {
	// Example URL: https://www.instagram.com/graphql/query/?query_id=17888483320059182&variables=%7B%22id%22%3A%2211321561%22%2C%22first%22%3A12%2C%22after%22%3A%22%22%7D
	body := igAPIHTTPRequest(url)

	var timeline = new(eklstructs.IGAPITimeline)
	err := json.Unmarshal(body, &timeline)

	if err != nil {
		log.Fatal(err)
	}

	return timeline
}

func writeInstagramMedia(filePath string, username string, media eklstructs.IGAPIMediaDetail) {
	fileContents, _ := json.MarshalIndent(media, "", " ")
	err := ioutil.WriteFile(filePath, fileContents, 0644)

	if err != nil {
		log.Error(err)
	} else {
		infoMsg := fmt.Sprintf("%s %s", filePath, "written")
		log.Info(infoMsg)
	}
}

func writeInstagramShortcodes(filePath string, media []eklstructs.IGAPITimelineMediaEdge, overwriteFiles bool) {
	fileContents := []byte{}
	if overwriteFiles {
		fileContents, _ = json.MarshalIndent(media, "", " ")
	} else {
		rawFileContents, _ := ioutil.ReadFile(filePath)
		existingMedia := []eklstructs.IGAPITimelineMediaEdge{}
		_ = json.Unmarshal([]byte(rawFileContents), &existingMedia)
		media = append(media, existingMedia...)
		fileContents, _ = json.MarshalIndent(media, "", " ")
	}

	err := ioutil.WriteFile(filePath, fileContents, 0644)
	if err != nil {
		log.Error(err)
	} else {
		log.Info("Instagram shortcodes written")
	}
}

func writeInstagramEndCursor(endCursor string) {
	fileWritePath := fmt.Sprintf("./data/instagram/worker/latest-consumed-end-cursor.json")
	fileWriteAbsPath, err := filepath.Abs(fileWritePath)
	if err != nil {
		log.Error(err)
	}

	fileContents := []byte(endCursor)
	err = ioutil.WriteFile(fileWriteAbsPath, fileContents, 0644)

	if err != nil {
		log.Error(err)
	} else {
		infoMsg := fmt.Sprintf("Latest end cursor saved.")
		log.Info(infoMsg)
	}
}

func writeInstagramSimpleMedia(simpleMedia []eklstructs.InstagramMedia) {
	fileWritePath := fmt.Sprintf("./data/instagram-simplified.json")
	fileWriteAbsPath, err := filepath.Abs(fileWritePath)
	if err != nil {
		log.Error(err)
	}

	fileContents, _ := json.MarshalIndent(simpleMedia, "", " ")
	err = ioutil.WriteFile(fileWriteAbsPath, fileContents, 0644)

	if err != nil {
		log.Error(err)
	} else {
		infoMsg := fmt.Sprintf("Instagram simplified data written")
		log.Info(infoMsg)
	}

}

func consolidateAndConvertMedia(directory string) {
	files, err := ioutil.ReadDir(directory)

	if err != nil {
		log.Fatal(err)
	}

	allMedia := []eklstructs.IGAPIMediaDetail{}
	for _, f := range files {
		filePath := fmt.Sprintf("%s/%s", directory, f.Name())
		rawFileContents, _ := ioutil.ReadFile(filePath)
		var media eklstructs.IGAPIMediaDetail
		_ = json.Unmarshal([]byte(rawFileContents), &media)
		allMedia = append(allMedia, media)
	}

	allSimpleMedia := []eklstructs.InstagramMedia{}
	for _, m := range allMedia {
		simpleMedia := eklstructs.InstagramMedia{
			m.GraphQL.Media.Shortcode,
			m.GraphQL.Media.Timestamp,
			m.GraphQL.Media.Location.Name,
			m.GraphQL.Media.DisplayURL,
		}
		allSimpleMedia = append(allSimpleMedia, simpleMedia)
	}

	writeInstagramSimpleMedia(allSimpleMedia)
}

func GetDataFromInstagramForUser(username string, pullAllInstagrams bool) {
	// I get by, with a little help, from this blog:
	// http://go-colly.org/articles/how_to_scrape_instagram/
	// and this script:
	// https://github.com/rarcega/instagram-scraper/blob/master/instagram_scraper/app.py

	// Retrieve user metadata
	userInfoURL := fmt.Sprintf("%s/%s/?__a=1", BaseUrl, username)
	userMetadata := getUserMetadataFromInstagramURL(userInfoURL)
	userID := userMetadata.GraphQL.User.ID

	// Retrieve first page of user results
	endCursorPath := fmt.Sprintf("./data/instagram/worker/latest-consumed-end-cursor.json")
	endCursorAbsPath, err := filepath.Abs(endCursorPath)
	endCursorBytes, err := ioutil.ReadFile(endCursorAbsPath)
	if err != nil {
		log.Error(err)
	}

	endCursor := string(endCursorBytes)
	wroteEndCursor := false
	var timelineEdges []eklstructs.IGAPITimelineMediaEdge

	// Query or the Instaram media
	for true {
		queryMediaVars := url.QueryEscape(fmt.Sprintf("{\"id\":\"%s\",\"first\":50,\"after\":\"%s\"}", userID, endCursor))
		nextPageURL := fmt.Sprintf("%s/%s&variables=%s", BaseUrl, "graphql/query/?query_id=17888483320059182", queryMediaVars)
		timeline := getUserTimelineMediaFromURL(nextPageURL)

		// Learned something new
		// https://stackoverflow.com/questions/16248241/concatenate-two-slices-in-go
		timelineEdges = append(timeline.Data.User.Media.Edges, timelineEdges...)
		hasNextPage := timeline.Data.User.Media.PageInfo.HasNextPage

		endCursor = timeline.Data.User.Media.PageInfo.EndCursor
		if !wroteEndCursor {
			writeInstagramEndCursor(endCursor)
			wroteEndCursor = true
		}

		if hasNextPage && pullAllInstagrams {
			log.Info("Getting another page...")
		} else {
			break
		}

		time.Sleep(3 * time.Second)
	}

	fileAbsPath, err := filepath.Abs("./data/instagram/worker/media-shortcodes.json")
	if err != nil {
		log.Error(err)
	}

	writeInstagramShortcodes(fileAbsPath, timelineEdges, pullAllInstagrams)

	mediaDir := "./data/instagram/worker/media"
	for i, edge := range timelineEdges {
		shortcode := edge.Node.Shortcode
		filePath := fmt.Sprintf("%s/%s.json", mediaDir, shortcode)
		fileAbsPath, err := filepath.Abs(filePath)

		if err != nil {
			log.Error(err)
		}

		if !fileExists(fileAbsPath) {
			log.Info(fmt.Sprintf("Getting the details for media %d of %d...", i, len(timelineEdges)))
			mediaDetail := getMediaDetailFromShortcode(shortcode)
			writeInstagramMedia(fileAbsPath, username, *mediaDetail)
		}
	}

	consolidateAndConvertMedia(mediaDir)
}
