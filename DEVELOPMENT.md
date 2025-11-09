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
- [DNS Redirect Page](https://static.dahlke.io/)

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

## Deploying Eklhad Web to Cloud Run (Manual)

The application is deployed to Google Cloud Run. The deployment process involves building the React frontend,
compiling the Go web server, creating a Docker image, pushing it to Docker Hub, and then deploying using Terraform.

You can read the [Makefile](./Makefile) to see what commands are being run under the hood, but to do all of the above
process quickly, run:

### Backup Static Version

There is a static version of the page that has none of the dynamic content that can be reached at
[static.dahlke.io](https://static.dahlke.io), which is a redirect to GitHub Pages
[dahlke.github.io](https://dahlke.github.io) (the [repo](https://github.com/dahlke/dahlke.github.io)).
This is useful to fall back to if anything goes wrong deploying the app.

### Authenticating to GCP and Cloudflare

The deployment requires authentication to both GCP and Cloudflare. Make sure you have the necessary credentials set up.

```bash
# Source the secrets file which sets up all required environment variables
source secrets.op.sh

# This sets up:
# - GOOGLE_APPLICATION_CREDENTIALS for GCP authentication
# - CLOUDFLARE_API_TOKEN for Cloudflare DNS management
# - Other required API keys
```

### Deploying

The Dockerfile uses a multi-stage build process that automatically builds both the frontend and Go binary
for optimal image size. You only need to prepare the data and resume before building the Docker image.

```bash
# Step 1: Collect and prepare data
make collect_data
make resume  # Must be run before Docker build - generates static resume HTML in web/frontend/public/static/

# Step 2: Build and push Docker image, then deploy to Cloud Run
# The Dockerfile automatically builds:
#   - Frontend (React app) in a Node.js stage
#   - Go binary in a Go builder stage
#   - Final minimal runtime image with only the built artifacts
make cloudrun_deploy
```

**Note:** The Dockerfile handles all building automatically. You don't need to run `make frontend_build` or
`make go_build_linux` separately - the Docker build process does this for you using multi-stage builds
to keep the final image size minimal.

### Planning Changes

Before deploying, you can preview what Terraform will change:

```bash
# Plan Cloud Run deployment changes
make cloudrun_plan
```

### Testing Docker Image Locally

Before deploying, you can test the Docker image locally. The Docker build will automatically
build both the frontend and Go binary:

```bash
# Build the Docker image (automatically builds frontend and Go binary)
make docker_build_web

# Run it locally to test
make docker_run_web

# Then visit http://localhost:3554
```

**Note:** Make sure you've run `make resume` first if you need the resume page, as the Dockerfile
copies the resume from the source directory.

---

## DEPRECATED: VM-Based Deployment

The VM-based deployment has been deprecated in favor of Cloud Run. The following information is kept for reference only.

### Deploying to VM (DEPRECATED)

The old deployment process used a VM-based infrastructure. This required building Packer images and deploying to Compute Engine.

#### Authenticating to GCP and Cloudflare (VM Version)

```bash
# For Packer and Terraform
export GOOGLE_APPLICATION_CREDENTIALS="/Users/neil/.gcp/eklhad-web-packer.json"

# For the data collector
export GOOGLE_API_KEY=$(op item get "Google dahlke.io" --format=json | jq -r '.fields[5].value')

export CLOUDFLARE_TOKEN=$(op item get Cloudflare --format=json | jq -r '.fields[3].value')
export CLOUDFLARE_EMAIL=$(op item get Cloudflare --format=json | jq -r '.fields[4].value')
export CLOUDFLARE_API_KEY=$(op item get Cloudflare --format=json | jq -r '.fields[5].value')
```

#### VM Deployment Steps (DEPRECATED)

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

#### VM Terraform Commands (DEPRECATED)

```bash
# Initialize Terraform
make tf_init_gcp

# Plan changes
make tf_plan_gcp

# Apply changes
make tf_apply_gcp_auto

# Destroy infrastructure
make tf_destroy_gcp_auto
```

The VM infrastructure Terraform state is stored in GCS at:

- `gs://eklhad-web-private/terraform-vm.tfstate/`
