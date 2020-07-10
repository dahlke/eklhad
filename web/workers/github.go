package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/dahlke/eklhad/web/eklhad_structs"
	"github.com/google/go-github/github"
	log "github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
)

// TODO: make this a config item
const PAGE_SIZE = 100

// TODO: move to contants file.
const GITHUB_DATA_PATH = "./data/github/data.json"

func mergeNewGitHubEvents(newGitHubEvents []eklhad_structs.GitHubEvent) []eklhad_structs.GitHubEvent {
	rawFileContents, _ := ioutil.ReadFile(GITHUB_DATA_PATH)
	githubEvents := []eklhad_structs.GitHubEvent{}
	_ = json.Unmarshal([]byte(rawFileContents), &githubEvents)

	for _, newEvent := range newGitHubEvents {
		foundInExistingEvents := false
		for _, existingEvent := range githubEvents {
			if newEvent.ID == existingEvent.ID {
				foundInExistingEvents = true
				break
			}
		}

		if !foundInExistingEvents {
			githubEvents = append(githubEvents, newEvent)
		}
	}

	log.Info("GitHub data merged")

	return githubEvents
}

func writeGitHubData(newGitHubEvents []eklhad_structs.GitHubEvent) {
	mergedGitHubEvents := mergeNewGitHubEvents(newGitHubEvents)
	fileWriteAbsPath, err := filepath.Abs(GITHUB_DATA_PATH)
	if err != nil {
		log.Error(err)
	}
	fileContents, _ := json.MarshalIndent(mergedGitHubEvents, "", " ")
	err = ioutil.WriteFile(fileWriteAbsPath, fileContents, 0644)

	if err != nil {
		log.Error(err)
	} else {
		infoMsg := fmt.Sprintf("GitHub data written")
		log.Info(infoMsg)
	}
}

func GetDataFromGitHubForUser(username string) {
	githubToken := os.Getenv("GITHUB_TOKEN")

	ctx := context.Background()
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: githubToken},
	)
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	// TODO: take public only from config
	publicOnly := true
	listOptions := github.ListOptions{
		Page:    0,
		PerPage: PAGE_SIZE,
	}

	var allRawEvents []*github.Event
	hitPaginationLimit := false
	for {
		log.Info(fmt.Sprintf("Getting GitHub Data page %d", listOptions.Page))
		rawEvents, _, err := client.Activity.ListEventsPerformedByUser(ctx, username, publicOnly, &listOptions)

		log.Info(fmt.Sprintf("GitHub Data page %d has %d items", listOptions.Page, len(rawEvents)))
		if err != nil {
			// NOTE: 422 In order to keep the API fast for everyone, pagination is limited for this resource.
			if !strings.Contains(err.Error(), "422") {
				log.Fatal(err)
			} else {
				hitPaginationLimit = true
				log.Info("GitHub doesn't allow any further pagination on this resource, breaking the loop.")
			}
		}

		allRawEvents = append(allRawEvents, rawEvents...)
		listOptions.Page = listOptions.Page + 1

		// If we have run out of items to fetch, break the loop.
		if len(rawEvents) < PAGE_SIZE || hitPaginationLimit {
			break
		}
	}

	var allGitHubEvents []eklhad_structs.GitHubEvent

	for _, event := range allRawEvents {
		gitHubEvent := eklhad_structs.GitHubEvent{
			ID:        *event.ID,
			Type:      *event.Type,
			RepoName:  *event.Repo.Name,
			Timestamp: event.CreatedAt.Unix(),
		}
		allGitHubEvents = append(allGitHubEvents, gitHubEvent)
	}

	writeGitHubData(allGitHubEvents)
}
