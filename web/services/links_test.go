package services

import (
	"strings"
	"testing"
)

func TestLinks(t *testing.T) {
	links := GetLinks()
	firstLink := links[0]

	if !(strings.Contains(firstLink.URL, "http")) {
		t.Errorf("Links service did not return valid results.")
	}
}
