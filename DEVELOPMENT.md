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

### Resume Generation

The resume must be built separately from the frontend build process. This needs to be done before building the frontend:

```bash
make resume  # Generates the static resume HTML file in web/frontend/public/static/
```

## Fallback Page (for Maintenance)

Mistakes are made, and due to trying to use only free-tier offerings from the cloud providers,
that means some unexpected things come up where you might not have the time to fix it immediately and instead,
need a fallback maintenance page. Leveraging the User GitHub Pages feature provides a good option for this.

- [Example Repo](https://github.com/dahlke/dahlke.github.io)
- [Example Page](https://dahlke.github.io/)

## Testing

There tests for both the frontend and backend, which can be run manually, and are always run in GitHub Actions when a commit is pushed to the repo.

### Local Test

To run the tests locally, you can use one of the provided `make` commands.

```bash
make frontend_test_coverage
make go_test
```

### Helpful Git Hooks

If you'd like to run the tests on every commit, you can use one of the provided Git hooks. They are located in the `./hooks/pre-commit/` folder here. Symlink them to the git repo using:

```bash
cd .git/hooks
ln -s -f ../../hooks/pre-commit ./pre-commit
chmod +x ../../hooks/pre-commit ./pre-commit
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

### Authenticating to GCP and Cloudflare

- [Required GCP IAM Permissions](https://cloud.google.com/cloud-build/docs/building/build-vm-images-with-packer#required_iam_permissions)

```bash
# For Packer and Terraform
export GOOGLE_APPLICATION_CREDENTIALS="/Users/neil/.gcp/eklhad-web-packer.json"

# For the data collector
export GOOGLE_API_KEY=$(op item get "Google dahlke.io" --format=json | jq -r '.fields[5].value')

export CLOUDFLARE_TOKEN=$(op item get Cloudflare --format=json | jq -r '.fields[3].value')
export CLOUDFLARE_EMAIL=$(op item get Cloudflare --format=json | jq -r '.fields[4].value')
export CLOUDFLARE_API_KEY=$(op item get Cloudflare --format=json | jq -r '.fields[5].value')
```

export TFC_TOKEN=$(op item get "Terraform Cloud" --format=json | jq -r '.fields[3].value')
```

### Deploying

Before deploying, a few things need to be done. The React frontend needs to be compiled. A Linux artifact of the
application needs to be built. Then a Packer image needs to get created in GCP, and then used to deploy using
Terraform.

```bash
# Step 1: Collect and prepare data
make collect_data
make resume  # Must be run before frontend_build - generates static resume HTML

# Step 2: Build and package application
make frontend_build  # Will fail if resume hasn't been built
make go_build_linux
make artifact_linux_web
make go_build_macos
make artifact_macos_web

# Step 3: Create and deploy cloud infrastructure
make image_gcp
make tf_apply_gcp_auto
```

## Fallback Page (for Maintenance)

Mistakes are made, and due to trying to use only free-tier offerings from the cloud providers,
that means some unexpected things come up where you might not have the time to fix it immediately and instead,
need a fallback maintenance page. Leveraging the User GitHub Pages feature provides a good option for this.

- [Example Repo](https://github.com/dahlke/dahlke.github.io)
- [Example Page](https://dahlke.github.io/)
