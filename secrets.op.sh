#!/bin/bash

eval $(op signin)

# NOTE: I think I can remove this.
# export GCLOUD_KEYFILE_JSON=$(op item get "Google dahlke.io" --format=json | jq -r '.fields[3].value' --format=json | jq -r)

# For Packer and Terraform
export GOOGLE_APPLICATION_CREDENTIALS="/Users/neildahlke/.gcp/eklhad-web-packer.json"
# For GH Actions
# export GOOGLE_APPLICATION_CREDENTIALS="/home/runner/work/eklhad/eklhad/gcp-actions.json"
# For the data collector
export GOOGLE_API_KEY=$(op item get "Google dahlke.io" --format=json | jq -r '.fields[5].value')

# export AWS_ACCESS_KEY_ID=$(op item get "Amazon" --format=json | jq -r '.fields[3].value')
# export AWS_SECRET_ACCESS_KEY=$(op item get "Amazon" --format=json | jq -r '.fields[4].value')

export TWITTER_CONSUMER_API_KEY=$(op item get Twitter --format=json | jq -r '.fields[3].value')
export TWITTER_CONSUMER_SECRET_KEY=$(op item get Twitter --format=json | jq -r '.fields[4].value')

export GITHUB_TOKEN=$(op item get GitHub --format=json | jq -r '.fields[3].value')
export GITHUB_SECRET=$(op item get GitHub --format=json | jq -r '.fields[4].value')

export CLOUDFLARE_TOKEN=$(op item get Cloudflare --format=json | jq -r '.fields[3].value')
export CLOUDFLARE_EMAIL=$(op item get Cloudflare --format=json | jq -r '.fields[4].value')
export CLOUDFLARE_API_KEY=$(op item get Cloudflare --format=json | jq -r '.fields[5].value')

export INSTAGRAM_ACCESS_TOKEN=$(op item get Instagram --format=json | jq -r '.fields[3].value')

export TFC_TOKEN=$(op item get "Terraform Cloud" --format=json | jq -r '.fields[3].value')
