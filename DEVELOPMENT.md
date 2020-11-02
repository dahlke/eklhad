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

Before running the worker, you'll need to export a `GITHUB_TOKEN` env var (a [personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)).

```bash
export GITHUB_TOKEN=$(op get item GitHub | jq -r '.details.sections[1].fields[0].v')
export GITHUB_SECRET=$(op get item GitHub | jq -r '.details.sections[1].fields[1].v')
cd web/
go run main.go -github
```

#### Pull All Data from Twitter

```bash
export TWITTER_CONSUMER_API_KEY=$(op get item Twitter | jq -r '.details.sections[1].fields[0].v')
export TWITTER_CONSUMER_SECRET_KEY=$(op get item Twitter | jq -r '.details.sections[1].fields[1].v')
cd web/
go run main.go -twitter
```

## Testing

There tests for both the frontend and backend, which can be run manually, and are always run in CircleCI when a commit is pushed to the repo.

### Local Test

To run the tests locally, you can use one of the provided `make` commands.

```bash
make frontend_test
make go_test
```

### Helpful Git Hooks

If you'd like to run the tests on every commit, you can use one of the provided Git hooks. They are located in the `./hooks/pre-commit/` folder here. Symlink them to the git repo using:

```bash
cd .git/hooks
ln -s -f ../../hooks/pre-commit ./pre-commit
chmod +x ../../hooks/pre-commit ./pre-commit
```

### CircleCI Docker Test Image

To run the tests in CircleCI, a custom image is required. To build this test image and push it to Docker Hub, use the following commands:

```bash
make docker_build_circleci
make docker_push_circleci
```

## Deploying Eklhad Web (Manual)

There are several build stages that are required for the ultimate deployment. The React / SASS frontend code needs to be built, the Go web server needs to be compiled, an artifact zipped up, a Packer image needs to be created for the target cloud provider, and then that all needs to be deployed using Terraform.

You can read the [Makefile](./Makefile) to see what commands are being run under the hood, but to do all of the above process quickly, run:

### Authenticating to GCP, TFC and Cloudflare.

- [Required GCP IAM Permissions](https://cloud.google.com/cloud-build/docs/building/build-vm-images-with-packer#required_iam_permissions)

```bash
export GCLOUD_KEYFILE_JSON=$(op get item "Google dahlke.io" | jq -r '.details.sections[1].fields[0].v' | jq -r .)

export GITHUB_TOKEN=$(op get item GitHub | jq -r '.details.sections[1].fields[0].v')
export GITHUB_SECRET=$(op get item GitHub | jq -r '.details.sections[1].fields[1].v')

export CLOUDFLARE_TOKEN=$(op get item Cloudflare | jq -r '.details.sections[1].fields[0].v')
export CLOUDFLARE_EMAIL=$(op get item Cloudflare | jq -r '.details.sections[1].fields[1].v')
export CLOUDFLARE_API_KEY=$(op get item Cloudflare | jq -r '.details.sections[1].fields[2].v')

export TFC_TOKEN=$(op get item "Terraform Cloud" | jq -r '.details.sections[1].fields[0].v')
echo 'credentials "app.terraform.io" {\n\ttoken = "'$TFC_TOKEN'"\n} ' > ~/.terraformrc
```

### Deploying

Before deploying, a few things need to be done. The React frontend needs to be compiled. A Linux artifact of the application needs to be built. Then a GCP image is created using Packer containing the new Linux artifact, and is used to deploy using Terraform.

```bash
make frontend_build
make collect_data
make artifact_linux_web # or make artifact_macos_web
make image_gcp
make tf_apply_gcp_auto
```
