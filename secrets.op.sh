#!/bin/bash

eval $(op signin)

# For Packer and Terraform
export GOOGLE_APPLICATION_CREDENTIALS="/Users/neildahlke/.gcp/eklhad-web-packer.json"
# For the data collector
export GOOGLE_API_KEY=$(op item get "Google dahlke.io" --format=json | jq -r '.fields[5].value')

export CLOUDFLARE_TOKEN=$(op item get Cloudflare --format=json | jq -r '.fields[3].value')
export CLOUDFLARE_EMAIL=$(op item get Cloudflare --format=json | jq -r '.fields[4].value')
export CLOUDFLARE_API_KEY=$(op item get Cloudflare --format=json | jq -r '.fields[5].value')

export TFC_TOKEN=$(op item get "Terraform Cloud" --format=json | jq -r '.fields[3].value')

export AWS_ACCESS_KEY_ID=$(op item get "Amazon" --format=json | jq -r '.fields[3].value')
export AWS_SECRET_ACCESS_KEY=$(op item get "Amazon" --format=json | jq -r '.fields[4].value')
