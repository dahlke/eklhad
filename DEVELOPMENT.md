# Eklhad Development

## Local Development

### Frontend (`bun`)

The React/Vite frontend in `web/frontend/` uses [`bun`](https://bun.sh) as both the package manager and script runner — `npm` is no longer used. Installs are dramatically faster, and the `packageManager` field in `web/frontend/package.json` pins the bun version so local and CI environments match.

Install `bun` if you don't already have it:

```bash
brew install bun
# or: curl -fsSL https://bun.sh/install | bash
```

Common operations (all wrapped by `make` targets):

```bash
make bun_install              # install deps (web/frontend/bun.lock)
make frontend_run             # vite dev server on :3000
make frontend_build           # production build (requires `make resume` first)
make frontend_test            # vitest
make frontend_test_coverage   # vitest with coverage
```

Vitest remains the test runner — we do not use `bun test`. The `node_modules` layout produced by `bun install` is compatible with Vite, Vitest, and PostCSS/Tailwind tooling.

### Python Scripts (`uv`)

Helper scripts in `scripts/` (thumbnail generation, photo backfill, route inference, etc.) are run via [`uv`](https://docs.astral.sh/uv/). Dependencies are declared in `pyproject.toml` and pinned in `uv.lock` — there is no `requirements.txt` and no need to manage a virtualenv manually.

Install `uv` if you don't already have it:

```bash
brew install uv
# or: curl -LsSf https://astral.sh/uv/install.sh | sh
```

Run a script — `uv` will create/sync the environment from the lockfile automatically on first run:

```bash
uv run python scripts/generate_thumbs.py
# or via make:
make generate_thumbs
```

Add a new dependency (updates both `pyproject.toml` and `uv.lock`):

```bash
uv add <package>
```

Sync the environment explicitly (e.g. after pulling changes to the lockfile):

```bash
uv sync
```

When adding a new script, drop it in `scripts/` and run it with `uv run python scripts/<name>.py` — no separate install step needed.

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

A combined pre-commit hook lives at `scripts/hooks/pre-commit`. It blocks sensitive/org-specific content from being committed, then runs Go formatting + vet + tests and the JS test suite (via `bun`). Install it with:

```bash
make install-hooks
```

To bypass once (use with caution): `git commit --no-verify`.

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
#   - Frontend (React app) in a Bun stage
#   - Go binary in a Go builder stage
#   - Final minimal runtime image with only the built artifacts
make cloudrun_deploy
```

**Note:** The Dockerfile handles all building automatically. You don't need to run `make frontend_build` or
`make go_build_linux` separately - the Docker build process does this for you using multi-stage builds
to keep the final image size minimal.

The Cloud Run infrastructure Terraform state is stored in GCS at:

- `gs://eklhad-web-private/terraform-cloudrun.tfstate/`

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
