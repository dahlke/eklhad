package services

import (
	"log"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	startingPath, err := os.Getwd()
	if err != nil {
		log.Println(err)
	}

	os.Chdir("../")
	code := m.Run()
	os.Chdir(startingPath)

	os.Exit(code)
}
