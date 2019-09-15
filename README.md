# Eklhad

[![CircleCI](https://circleci.com/gh/dahlke/eklhad/tree/master.svg?style=svg&circle-token=e37d2b20028dc6e1a4c66a18688d04d29d1c7fef)](https://circleci.com/gh/dahlke/eklhad/tree/master)

My personal web assets.

## Requirements

- `npm`
- `make`
- `packer`
- `terraform`

### GCP Quick Deploy

```
make frontend_build
make artifact_linux_web
make image_gcp
```

Before proceeding, make sure you set the desired image in the `.tfvars` file.

```
make tf_plan_gcp
make tf_apply_gcp
```

### Development

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

Set up pre-commit hooks:
```
cd .git/hooks
ln -s -f ../../hooks/pre-commit ./pre-commit
chmod +x ../../hooks/pre-commit ./pre-commit
```
