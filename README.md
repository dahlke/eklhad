# Eklhad

My personal web assets. I use this project to try out many different types of new web technologies, so it is highly overengineered and shouldn't be used by anybody.

## Requirements

- `make`
- `git`
- `go`
- `npm`
- [`packer`](https://github.com/hashicorp/packer)
- [`terraform`](https://github.com/hashicorp/terraform)

### Recommended

- [`golint`](https://github.com/golang/lint)

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

To update the resume file, make all changes to `./web/frontend/conf/resume.json` and then run `make resume`.
