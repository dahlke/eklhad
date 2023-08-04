package services

import (
	"encoding/json"

	"github.com/dahlke/eklhad/web/constants"
	"github.com/dahlke/eklhad/web/structs"
)

// GetBlogs reads the blog data from GCS.
func GetBlogs() []structs.EklhadBlog {
	jsonBytes := ReadJSONFromGCS(constants.GCSPublicBucketName, constants.BlogDataGCSFilePath)
	var blogs []structs.EklhadBlog
	json.Unmarshal(jsonBytes, &blogs)
	return blogs
}
