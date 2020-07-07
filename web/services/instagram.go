package services

import (
	"encoding/json"
	"io/ioutil"

	goramma_structs "github.com/dahlke/goramma/structs"
)

// GetInstagrams reads the instagram JSON data from the file system and returns it
func GetInstagrams() []goramma_structs.InstagramMedia {
	rawFileContents, _ := ioutil.ReadFile("./data/instagram/data.json")
	instagrams := []goramma_structs.InstagramMedia{}
	_ = json.Unmarshal([]byte(rawFileContents), &instagrams)
	return instagrams
}
