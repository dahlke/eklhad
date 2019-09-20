# Eklhad

[![CircleCI](https://circleci.com/gh/dahlke/eklhad/tree/master.svg?style=svg&circle-token=e37d2b20028dc6e1a4c66a18688d04d29d1c7fef)](https://circleci.com/gh/dahlke/eklhad/tree/master)

My personal web assets.

### Requirements

- `make`
- `go`
- `npm`
- `packer`
- `terraform`


## Development

Install the Go development dependencies and start the web/API server. The web/API server will run on port 80.

```bash
make go_get
make go_server_start
```

Install the Javascript development dependencies and start the frontend server. The frontend server will run on port 3000.
```bash
make npm
make frontend_start
```

To update the resume file, make all changes to `./web/frontend/conf/resume.json` and then run `make resume`.

## Geocoding City Data

The map requires each city visited to be geocoded. To geocode a city, add it to the array in [`cities.json`](./web/services/data/cities-array.json)
```
go run main.go -geocode
```

## Helpful Git Hooks

There are some pre-commit hooks that are useful since the same tests will be run in CircleCI. They are located in the `./hooks/pre-commit/` folder here. Symlink them to the git repo using:

```
cd .git/hooks
ln -s -f ../../hooks/pre-commit ./pre-commit
chmod +x ../../hooks/pre-commit ./pre-commit
```

### GCP Manual Deploy

There are several build stages that are required for the ultimate deployment. The React / SASS frontend code needs to be built, the Go web server needs to be compiled, an artifact zipped up, a Packer image needs to be created for the target cloud provider, and then that all needs to be deployed using Terraform.

You can read the [Makefile](./Makefile) to see what commands are being run under the hood, but to do all of the above process quickly, run:
```
make frontend_build
make artifact_linux_web
make image_gcp
make tf_apply_gcp
```


### CircleCI Docker Test Image

```
make docker_build
docker run -i -t eklhad-web-tester:0.1 /bin/sh
```

```
make docker_push
```