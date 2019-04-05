# Eklhad

My personal, digital assets.

[TODO list](https://app.asana.com/0/1003113032464624/1003115450055924)

## Web

### Install Requirements
- `packer` is required to build an AMI for deployment via Terraform
- `terraform` is the tool we'll use to deploy our app. 
- `npm` is used to build static assets for the app.
- `go` is the server language of the app. Required for development and building for deployment.


### AWS Quick Deploy

Build the React Frontend, the Go web server, a tarball app artifact, then the AMI.

```
make frontend_build go_build_linux artifact_linux_web image_aws
```

```
source ~/.cloudflare/eklhad/eklhad-creds.sh
source ~/.aws/eklhad/eklhad-creds.sh

make tf_plan_aws
make tf_apply_aws
```

