# Eklhad

[![CircleCI](https://circleci.com/gh/dahlke/eklhad/tree/master.svg?style=svg&circle-token=e37d2b20028dc6e1a4c66a18688d04d29d1c7fef)](https://circleci.com/gh/dahlke/eklhad/tree/master)

My personal web assets.

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
