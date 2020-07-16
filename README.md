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

Install the Go development dependencies and start the web/API server. The web/API server will run on port 80.

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

### Data Collection

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

export GOOGLE_CLOUD_KEYFILE_JSON="/Users/neil/.gcp/eklhad-web-d0ced52f2f26.json"
export $(envchain cloudflare_eklhVkkad env | grep CLOUDFLARE_)
# export CLOUDFLARE_TOKEN=""
# export CLOUDFLARE_EMAIL=""
# export CLOUDFLARE_API_KEY=""

make image_gcp
make tf_apply_gcp_auto
```

## Testing

### CircleCI Docker Test Image

To build the test image, use the following commands.

```bash
make docker_build
docker run -i -t eklhad-web-tester:0.1 /bin/sh
```

Then, push it to Docker Hub.

```bash
make docker_push
```
