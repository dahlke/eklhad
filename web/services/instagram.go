package services

import (
	"encoding/json"
	"io/ioutil"

	"github.com/dahlke/eklhad/web/eklstructs"
)

func GetInstagrams() []eklstructs.InstagramMedia {
	rawFileContents, _ := ioutil.ReadFile("./data/instagram-simplified.json")
	instagrams := []eklstructs.InstagramMedia{}
	_ = json.Unmarshal([]byte(rawFileContents), &instagrams)
	return instagrams
}
