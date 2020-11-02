package services

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
	log "github.com/sirupsen/logrus"
)

// GetBlogs reads the cached blog data from the file system and returns it.
func GetBlogs() []structs.EklhadBlog {
	jsonFilePath, err := filepath.Abs(constants.BlogsDataPath)
	if err != nil {
		log.Error(err)
	}

	blogsJSONFile, err := os.Open(jsonFilePath)
	if err != nil {
		log.Error(err)
	}
	defer blogsJSONFile.Close()

	jsonBytes, _ := ioutil.ReadAll(blogsJSONFile)
	var blogs []structs.EklhadBlog
	json.Unmarshal(jsonBytes, &blogs)

	return blogs
}
