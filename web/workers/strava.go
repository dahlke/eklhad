package workers

import (
	"fmt"
	"os"

	log "github.com/sirupsen/logrus"
	strava "github.com/strava/go.strava"
)

// Access tokens expire six hours after they are created, so they must be refreshed in order for an application to maintain access to a user’s resources. Every time you get a new access token, we return a new refresh token as well. If you need to make a request, we recommend checking to see if the short-lived access token has expired. If it has expired, request a new short-lived access token with the last received refresh token.

// GetDataFromStrava retrieves all the Strava activity for a user.
func GetDataFromStrava() {
	stravaToken := os.Getenv("STRAVA_ACCESS_TOKEN")
	client := strava.NewClient(stravaToken)

	athleteService := strava.NewCurrentAthleteService(client)

	// returns a AthleteDetailed object
	// https://godoc.org/github.com/strava/go.strava#AthleteDetailed
	athlete, err := athleteService.Get().Do()
	if err != nil {
		log.Error(err)
	}
	fmt.Println(athlete.Id)

	page := 1
	perPage := 100
	// before := 0
	// after := 0

	// returns a slice of ActivitySummary objects
	// https://godoc.org/github.com/strava/go.strava#ActivitySummary
	activities, err := athleteService.ListActivities().
		Page(page).
		PerPage(perPage).
		// Before(before).
		// After(after).
		Do()

	if err != nil {
		log.Error(err)
	}

	fmt.Println(activities)
	// TODO: handle refreshing the access token
	// Read the latest token and refresh token from GCS.
}
