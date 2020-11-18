package services

import (
	"fmt"
	"strings"
	"testing"
)

func TestInstagrams(t *testing.T) {
	instagrams := GetInstagrams()
	fmt.Println("TEST INSTA", instagrams)
	firstInstagram := instagrams[0]

	if !(strings.Contains(firstInstagram.URL, "http")) {
		t.Errorf("Instagrams service did not return valid results.")
	}
}
