# Eklhad

[![CircleCI](https://circleci.com/gh/dahlke/eklhad/tree/master.svg?style=svg&circle-token=e37d2b20028dc6e1a4c66a18688d04d29d1c7fef)](https://circleci.com/gh/dahlke/eklhad/tree/master)

My personal web assets.

## Development

### Requirements

- `make`
- `git`
- `go`
- `npm`
- [`packer`](https://github.com/hashicorp/packer)
- [`terraform`](https://github.com/hashicorp/terraform)

### Recommended

- [`prettier`](https://github.com/prettier/prettier)
- [`golint`](https://github.com/golang/lint)

### Backend Server

Install the Go development dependencies and start the web/API server. The web/API server will run on port 3554.

```bash
make go_get
make go_server_start
```

### Frontend Server

Install the Javascript development dependencies and start the frontend server. The frontend server will run on [localhost, port 3000](http://localhost:3000).

```bash
make npm
make frontend_start
```

To update the resume file, make all changes to `./web/frontend/conf/resume.json` and then run `make resume`.

### Helpful Git Hooks

There are some pre-commit hooks that are useful since the same tests will be run in CircleCI. They are located in the `./hooks/pre-commit/` folder here. Symlink them to the git repo using:

```bash
cd .git/hooks
ln -s -f ../../hooks/pre-commit ./pre-commit
chmod +x ../../hooks/pre-commit ./pre-commit
```

## Deploying

### GCP Manual Deploy

There are several build stages that are required for the ultimate deployment. The React / SASS frontend code needs to be built, the Go web server needs to be compiled, an artifact zipped up, a Packer image needs to be created for the target cloud provider, and then that all needs to be deployed using Terraform.

You can read the [Makefile](./Makefile) to see what commands are being run under the hood, but to do all of the above process quickly, run:

```bash
make frontend_build
make artifact_linux_web

# https://cloud.google.com/cloud-build/docs/building/build-vm-images-with-packer#required_iam_permissions
export GOOGLE_CREDENTIALS_PATH=/tmp/gcp.json
touch $GOOGLE_CREDENTIALS_PATH
export GOOGLE_CREDENTIALS_JSON=$(op get item "Google dahlke.io" | jq -r '.details.sections[1].fields[0].v' | jq -r .)
echo $GOOGLE_CREDENTIALS_JSON > $GOOGLE_CREDENTIALS_PATH

make image_gcp

export CLOUDFLARE_TOKEN=$(op get item Cloudflare | jq -r '.details.sections[1].fields[0].v')
export CLOUDFLARE_EMAIL=$(op get item Cloudflare | jq -r '.details.sections[1].fields[1].v')
export CLOUDFLARE_API_KEY=$(op get item Cloudflare | jq -r '.details.sections[1].fields[2].v')

export TFC_TOKEN=$(op get item "Terraform Cloud" | jq -r '.details.sections[1].fields[0].v')
echo 'credentials "app.terraform.io" {\n\ttoken = "'$TFC_TOKEN'"\n} ' > ~/.terraformrc

make tf_apply_gcp_auto
```

## Testing

### CircleCI Docker Test Image

To build the test image, use the following commands.

```bash
make docker_build_circleci
```

Then, push it to Docker Hub.

```bash
make docker_push_circleci
```


# TODO: note about development and how it can be problematic if you don't setup the default port in the frontend and change it in the backend.

# TODO: add this to a note elsewhere.
https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage
https://cloud.google.com/billing/docs/how-to/notify#functions_billing_auth-python