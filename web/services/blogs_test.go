package services

import (
	"testing"
)

func TestBlogs(t *testing.T) {
	blogs := GetBlogs()

	if len(blogs) == 0 {
		t.Errorf("Received no data back from Blogs service.")
	}
}
