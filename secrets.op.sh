#!/bin/bash

eval $(op signin my)

export GCLOUD_KEYFILE_JSON=$(op get item "Google dahlke.io" | jq -r '.details.sections[1].fields[0].v' | jq -r .)
export GOOGLE_APPLICATION_CREDENTIALS="/Users/neildahlke/.gcp/eklhad-web-packer.json"

export GOOGLE_API_KEY=$(op get item "Google dahlke.io" | jq -r '.details.sections[1].fields[2].v')

export TWITTER_CONSUMER_API_KEY=$(op get item Twitter | jq -r '.details.sections[1].fields[0].v')
export TWITTER_CONSUMER_SECRET_KEY=$(op get item Twitter | jq -r '.details.sections[1].fields[1].v')

export GITHUB_TOKEN=$(op get item GitHub | jq -r '.details.sections[1].fields[0].v')
export GITHUB_SECRET=$(op get item GitHub | jq -r '.details.sections[1].fields[1].v')

export CLOUDFLARE_TOKEN=$(op get item Cloudflare | jq -r '.details.sections[1].fields[0].v')
export CLOUDFLARE_EMAIL=$(op get item Cloudflare | jq -r '.details.sections[1].fields[1].v')
export CLOUDFLARE_API_KEY=$(op get item Cloudflare | jq -r '.details.sections[1].fields[2].v')

export INSTAGRAM_ACCESS_TOKEN=$(op get item Instagram | jq -r '.details.sections[1].fields[0].v')

export TFC_TOKEN=$(op get item "Terraform Cloud" | jq -r '.details.sections[1].fields[0].v')
