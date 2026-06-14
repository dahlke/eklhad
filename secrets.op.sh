#!/bin/bash

eval $(op signin)

# For Packer and Terraform
export GOOGLE_APPLICATION_CREDENTIALS="/Users/neil/.gcp/eklhad-web-packer.json"
# For the data collector
export GOOGLE_API_KEY=$(op item get "Google dahlke.io" --format=json | jq -r '.fields[] | select(.label == "GOOGLE_API_KEY") | .value')

export CLOUDFLARE_TOKEN=$(op item get Cloudflare --format=json | jq -r '.fields[] | select(.label == "CLOUDFLARE_TOKEN") | .value')
export CLOUDFLARE_EMAIL=$(op item get Cloudflare --format=json | jq -r '.fields[] | select(.label == "CLOUDFLARE_EMAIL") | .value')
export CLOUDFLARE_API_KEY=$(op item get Cloudflare --format=json | jq -r '.fields[] | select(.label == "CLOUDFLARE_API_KEY") | .value')

# Mapbox token — dev token is localhost-restricted; prod token is used in docker builds
export VITE_MAPBOX_TOKEN=$(op item get "MapBox" --format=json | jq -r '.fields[] | select(.label == "Mapbox dahlke.io Dev") | .value')
export MAPBOX_TOKEN_PROD=$(op item get "MapBox" --format=json | jq -r '.fields[] | select(.label == "Mapbox dahlke.io Prod") | .value')
