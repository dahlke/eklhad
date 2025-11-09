# Eklhad

My personal web assets. I use this project to try out many different types of new web technologies, so it is highly overengineered and shouldn't be used by anybody.

## Getting Started

**See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete development and deployment instructions.**

## Requirements

- `make`
- `git`
- `go`
- `npm`
- [`terraform`](https://github.com/hashicorp/terraform)
- `docker` (for Cloud Run deployment)

### Optional

- [`packer`](https://github.com/hashicorp/packer) (deprecated - only needed for VM-based deployment)
- [`golint`](https://github.com/golang/lint)

## Quick Start

### Backend Server

Install the Go development dependencies and start the web/API server. The web/API server will run on port 3554.

```bash
make go_get
make go_server_run
```

### Frontend Server

Install the Javascript development dependencies and start the frontend server. The frontend server will run on [localhost, port 3000](http://localhost:3000).

```bash
make npm
make frontend_run
```

### Resume

To update the resume file, make all changes to `./web/frontend/conf/resume.json` and then run `make resume`.

For more detailed information on development, testing, and deployment, see [DEVELOPMENT.md](./DEVELOPMENT.md).
