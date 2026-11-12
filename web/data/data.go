// Package data embeds the site's JSON data so the server needs no external store.
package data

import _ "embed"

// Locations is the visited-places list, in the order they were added.
//
//go:embed locations.json
var Locations []byte

// LocationPhotos maps a city to its photo, stamp and poster URLs.
//
//go:embed locationPhotos.json
var LocationPhotos []byte

// Links is the list of talks, press, demos and workshops.
//
//go:embed links.json
var Links []byte

// Blogs is the blog post index.
//
//go:embed blogs.json
var Blogs []byte
