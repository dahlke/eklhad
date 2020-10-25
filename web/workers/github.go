package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
	"github.com/google/go-github/github"
	log "github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
)

func convertGitHubActivityData(repoName string, repoCommitActivity []*github.WeeklyCommitActivity) []*structs.GitHubDailyCommitActivityForRepo {
	var allCommitActivitySingleRepo []*structs.GitHubDailyCommitActivityForRepo
	for _, weeklyCommitActivity := range repoCommitActivity {
		if *weeklyCommitActivity.Total != 0 {
			for weekdayNumber, numCommits := range weeklyCommitActivity.Days {
				if numCommits != 0 {
					commitTime := weeklyCommitActivity.Week.AddDate(0, 0, weekdayNumber)
					commitTimestamp := commitTime.Unix()
					dailyCommitActivitySingleRepo := structs.GitHubDailyCommitActivityForRepo{
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

func writeGitHubActivity(allGitHubActivity []*structs.GitHubDailyCommitActivityForRepo) {
	fileWriteAbsPath, err := filepath.Abs(constants.GitHubActivityPath)
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

// GetDataFromGitHubForUser gets all the commit activity for every public repo for the
// last 365 days and writes it to the file system.
func GetDataFromGitHubForUser() {
	githubToken := os.Getenv("GITHUB_TOKEN")

	ctx := context.Background()
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: githubToken},
	)
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	repoListOptions := &github.RepositoryListOptions{
		Type: "public",
		ListOptions: github.ListOptions{
			Page:    0,
			PerPage: constants.GitHubPageSize,
		},
	}

	var dailyCommitActivityAllRepos []*structs.GitHubDailyCommitActivityForRepo

	for {
		userRepos, _, err := client.Repositories.List(context.Background(), "", repoListOptions)

		if err != nil {
			log.Fatal(err)
		}

		// Loop through all of the public repos the user contributes to
		for _, repo := range userRepos {
			log.Info(fmt.Sprintf("Getting GitHub commit activity for %s", *repo.FullName))
			// https://pkg.go.dev/github.com/google/go-github/v32/github?tab=doc
			// https://developer.github.com/v3/repos/statistics/#get-the-last-year-of-commit-activity
			repoOwner := *repo.Owner.Login
			repoCommitActivity, _, err := client.Repositories.ListCommitActivity(ctx, repoOwner, *repo.Name)
			if err != nil {
				log.Error(err)
			} else {
				// NOTE: Converting the data structure to be something more directly consumable
				// by the maps in the frontend.
				dailyCommitActivitySingleRepo := convertGitHubActivityData(*repo.FullName, repoCommitActivity)
				dailyCommitActivityAllRepos = append(dailyCommitActivityAllRepos, dailyCommitActivitySingleRepo...)
			}
		}

		if len(userRepos) < constants.GitHubPageSize {
			break
		} else {
			repoListOptions.ListOptions.Page = repoListOptions.ListOptions.Page + 1
		}
	}

	writeGitHubActivity(dailyCommitActivityAllRepos)
}

func ScheduleGitHubWork(numSleepMins int) {
	iterationNumber := 0
	for {
		log.Info(fmt.Sprintf("Starting GitHub worker scheduled task #%d...", iterationNumber))
		GetDataFromGitHubForUser()
		iterationNumber++
		log.Info(fmt.Sprintf("GitHub worker sleeping for %d minute(s)...", numSleepMins))
		time.Sleep(time.Duration(numSleepMins) * time.Minute)
	}
}
