# Eklhad Development

## Local Development

### Data Collection

These will run only one time, and retrieve the latest data for each data source.

#### Pull Most Recent Data from Google Sheets (and Geocode the necessary data points)

```bash
cd web/
go run main.go -gsheets
```

#### Pull All Data from Instagram

```bash
cd web/
go run main.go -instagram
```

#### Pull All Data from GitHub

```bash
cd web/
go run main.go -github
```

### Authenticating

- [Required GCP IAM Permissions](https://cloud.google.com/cloud-build/docs/building/build-vm-images-with-packer#required_iam_permissions)

```bash
export GOOGLE_CREDENTIALS_PATH=/tmp/gcp.json
touch $GOOGLE_CREDENTIALS_PATH
export GCLOUD_KEYFILE_JSON=$(op get item "Google dahlke.io" | jq -r '.details.sections[1].fields[0].v' | jq -r .)
echo $GCLOUD_KEYFILE_JSON > $GOOGLE_CREDENTIALS_PATH

# TODO: use the value downloaded directly, not the pre-downloaded auth file.
# echo $GCLOUD_KEYFILE_JSON | tr '\n' ' ' > $GOOGLE_CREDENTIALS_PATH

export CLOUDFLARE_TOKEN=$(op get item Cloudflare | jq -r '.details.sections[1].fields[0].v')
export CLOUDFLARE_EMAIL=$(op get item Cloudflare | jq -r '.details.sections[1].fields[1].v')
export CLOUDFLARE_API_KEY=$(op get item Cloudflare | jq -r '.details.sections[1].fields[2].v')

export TFC_TOKEN=$(op get item "Terraform Cloud" | jq -r '.details.sections[1].fields[0].v')
echo 'credentials "app.terraform.io" {\n\ttoken = "'$TFC_TOKEN'"\n} ' > ~/.terraformrc
```

## Deploying Eklhad Web (Manual)

TODO: add a local development option that outputs all the SSH keys.
TODO: add a Nomad option.

```bash
make frontend_build
make artifact_linux_web # or make artifact_macos_web
make image_gcp
make tf_apply_gcp_auto
```


### Nomad Runtime (Preview)

TODO: add notes on Nomad images and using Nomad.

```
make docker_build_web
make docker_push_web
nomad job run nomad/services.nomad
nomad job run nomad/workers.nomad
```

TODO:

iptables -A INPUT -i eth0 -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -i eth0 -p tcp --dport 3554 -j ACCEPT
iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3554
