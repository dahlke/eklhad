package services

import (
	"context"
	"io/ioutil"

	"cloud.google.com/go/storage"
	log "github.com/sirupsen/logrus"
)

// ReadJSONFromGCS reads data from a bucket at a specific path and returns a byte array.
func ReadJSONFromGCS(bucketName string, path string) []byte {
	ctx := context.Background()
	gcsClient, err := storage.NewClient(ctx)

	if err != nil {
		log.Error(err)
	}

	bkt := gcsClient.Bucket(bucketName)
	obj := bkt.Object(path)
	rc, err := obj.NewReader(ctx)

	if err != nil {
		log.Error(err)
	}

	jsonBytes, err := ioutil.ReadAll(rc)
	rc.Close()

	if err != nil {
		log.Error(err)
	}

	return jsonBytes
}
