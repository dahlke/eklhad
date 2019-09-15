# Eklhad

My personal web assets.

## Requirements

- `make`
- `packer`
- `terraform`


Set up pre-commit hooks:

```
cd .git/hooks
ln -s -f ../../hooks/pre-commit ./pre-commit
chmod +x ../../hooks/pre-commit ./pre-commit
```

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