package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/eklhad_structs"
	"github.com/google/go-github/github"
	log "github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
)

// TODO: make this a config item
const PAGE_SIZE = 100

// TODO: move to contants file.
const GITHUB_ACTIVITY_PATH = "./data/github/activity.json"

func convertGithubActivityData(repoName string, repoCommitActivity []*github.WeeklyCommitActivity) []*eklhad_structs.GitHubDailyCommitActivityForRepo {
	var allCommitActivitySingleRepo []*eklhad_structs.GitHubDailyCommitActivityForRepo
	for _, weeklyCommitActivity := range repoCommitActivity {
		if *weeklyCommitActivity.Total != 0 {
			for weekdayNumber, numCommits := range weeklyCommitActivity.Days {
				if numCommits != 0 {
					commitTime := weeklyCommitActivity.Week.AddDate(0, 0, weekdayNumber)
					commitTimestamp := commitTime.Unix()
					dailyCommitActivitySingleRepo := eklhad_structs.GitHubDailyCommitActivityForRepo{
						RepoName:   repoName,
						Timestamp:  commitTimestamp,
						NumCommits: numCommits,
					}
					allCommitActivitySingleRepo = append(allCommitActivitySingleRepo, &dailyCommitActivitySingleRepo)
				}
			}
		}
	}
	return allCommitActivitySingleRepo
}

func writeGitHubActivity(allGitHubActivity []*eklhad_structs.GitHubDailyCommitActivityForRepo) {
	fileWriteAbsPath, err := filepath.Abs(GITHUB_ACTIVITY_PATH)
	if err != nil {
		log.Error(err)
	}
	fileContents, _ := json.MarshalIndent(allGitHubActivity, "", " ")
	err = ioutil.WriteFile(fileWriteAbsPath, fileContents, 0644)

	if err != nil {
		log.Error(err)
	} else {
		infoMsg := fmt.Sprintf("GitHub activity data written")
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

	// TODO: make sure this pagination works
	repoListOptions := &github.RepositoryListOptions{
		Type: "public",
		ListOptions: github.ListOptions{
			Page:    0,
			PerPage: PAGE_SIZE,
		},
	}

	var dailyCommitActivityAllRepos []*eklhad_structs.GitHubDailyCommitActivityForRepo

	for {
		userRepos, _, err := client.Repositories.List(context.Background(), "", repoListOptions)

		if err != nil {
			log.Fatal(err)
		}

		// TODO: Try to get more than just the last year.
		for _, repo := range userRepos {
			// https://developer.github.com/v3/repos/statistics/#get-the-last-year-of-commit-activity
			// https://pkg.go.dev/github.com/google/go-github/v32/github?tab=doc
			log.Info(fmt.Sprintf("Getting GitHub commit activity for %s", *repo.FullName))
			repoCommitActivity, _, err := client.Repositories.ListCommitActivity(ctx, username, *repo.Name)
			if err != nil {
				// log.Fatal(err)
				// TODO: check if it's a 404
				log.Info(err)
			} else {
				// TODO: Note about only adding to our data points if we have any actual activity
				// TODO: Note about why we are converting the data
				dailyCommitActivitySingleRepo := convertGithubActivityData(*repo.FullName, repoCommitActivity)
				dailyCommitActivityAllRepos = append(dailyCommitActivityAllRepos, dailyCommitActivitySingleRepo...)
			}
		}

		if len(userRepos) < PAGE_SIZE {
			break
		} else {
			repoListOptions.ListOptions.Page = repoListOptions.ListOptions.Page + 1
		}
	}

	writeGitHubActivity(dailyCommitActivityAllRepos)
}
