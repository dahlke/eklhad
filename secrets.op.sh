#!/bin/bash

export OP_ACCOUNT=my.1password.com

# For Packer and Terraform
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.gcp/eklhad-web-packer.json"

export CLOUDFLARE_API_TOKEN=$(op item get Cloudflare --format=json | jq -r '.fields[] | select(.label == "CLOUDFLARE_API_TOKEN") | .value')

# Mapbox token — dev token is localhost-restricted; prod token is used in docker builds
export VITE_MAPBOX_TOKEN=$(op item get "MapBox" --format=json | jq -r '.fields[] | select(.label == "Mapbox dahlke.io Dev") | .value')
export MAPBOX_TOKEN_PROD=$(op item get "MapBox" --format=json | jq -r '.fields[] | select(.label == "Mapbox dahlke.io Prod") | .value')
