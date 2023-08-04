# Eklhad Development

## Local Development

### Data Collection

These will run only one time, and retrieve the latest data for each data source.

#### Pull Most Recent Data from Google Sheets (and Geocode the necessary data points)

```bash
cd web/
go run main.go -gsheets
```

#### Pull All Data from All Sources

```bash
source secrets.op.sh
make collect_data
```

## Fallback Page (for Maintenance)

Mistakes are made, and due to trying to use only free-tier offerings from the cloud providers,
that means some unexpected things come up where you might not have the time to fix it immediately and instead,
need a fallback maintenance page. Leveraging the User GitHub Pages feature provides a good option for this.

- [Example Repo](https://github.com/dahlke/dahlke.github.io)
- [Example Page](https://dahlke.github.io/)

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

To run the tests in CircleCI, a custom image is required. To build this test image and push it to Docker Hub, use the
following commands:

```bash
make docker_build_circleci
make docker_push_circleci
```

## Deploying Eklhad Web (Manual)

There are several build stages that are required for the ultimate deployment. The React frontend code needs to be
built, the Go web server needs to be compiled, an artifact zipped up, a Packer image needs to be created for the target
cloud provider, and then that all needs to be deployed using Terraform.

You can read the [Makefile](./Makefile) to see what commands are being run under the hood, but to do all of the above
process quickly, run:

### Backup Static Version

There is a static version of the page that has none of the dynamic content that can be reached at
[static.dahlke.io](https://static.dahlke.io), which is a redirect to GitHub Pages
[dahlke.github.io](https://dahlke.github.io) (the [repo](https://github.com/dahlke/dahlke.github.io)).
This is useful to fall back to if anything goes wrong deploying the app to the free tier of cloud
provider services.

### Authenticating to GCP, TFC and Cloudflare

- [Required GCP IAM Permissions](https://cloud.google.com/cloud-build/docs/building/build-vm-images-with-packer#required_iam_permissions)

```bash
# For Packer and Terraform
export GOOGLE_APPLICATION_CREDENTIALS="/Users/neildahlke/.gcp/eklhad-web-packer.json"

# For the data collector
export GOOGLE_API_KEY=$(op get item "Google dahlke.io" | jq -r '.details.sections[1].fields[2].v')

export CLOUDFLARE_TOKEN=$(op get item Cloudflare | jq -r '.details.sections[1].fields[0].v')
export CLOUDFLARE_EMAIL=$(op get item Cloudflare | jq -r '.details.sections[1].fields[1].v')
export CLOUDFLARE_API_KEY=$(op get item Cloudflare | jq -r '.details.sections[1].fields[2].v')

export TFC_TOKEN=$(op get item "Terraform Cloud" | jq -r '.details.sections[1].fields[0].v')
echo 'credentials "app.terraform.io" {\n\ttoken = "'$TFC_TOKEN'"\n} ' > ~/.terraformrc
```

### Deploying

Before deploying, a few things need to be done. The React frontend needs to be compiled. A Linux artifact of the
application needs to be built. Then a GCP image is created using Packer containing the new Linux artifact, and is used
to deploy using Terraform.

```bash
make collect_data
make frontend_build
make artifact_linux_web # or make artifact_macos_web
make image_gcp
make tf_apply_gcp_auto
```
