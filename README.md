# Eklhad

My personal, digital assets.

## Web

### Install Requirements
- `packer` 
    - Packer is required to build an AMI for deployment via Terraform
- `terraform` 
    - Terraform is the tool we'll use to deploy our app. 
- `npm`
    - NPM is used to build static assets for the app.
- `go` 
    - Go is the server language of the app. Required for development and building for deployment.


### Cloud Prereqs

#### GCP
- Create Project
- Enable Google Compute API
- Build Packer Image
    - Update packer/gcp/image.json with project ID.
    - Take the Packer Image ID from the output and add it to terraform.tfvars as the image_id
- Deploy to GCP.

### Build Web

1) Build frontend assets.
```
make resume
make styles
```

2) Compile web server for target environment.
```
make go_build_linux
# or 
make go_build_mac
```

2a) [Optional] Clean compilation files from repo
```
make clean_repo
```

4) Bundle go server in tar file for deployment.
```
$ make artifact_linux_web
# or
$ make artifact_mac_web
```

5) Build cloud images with Packer from tar files.
```
$ make aws_image
# or
$ make gcp_image
```

6) Plan the changes on the chosen cloud provider.
```
$ make aws_plan
# or
$ make gcp_plan
```

7) Deploy to the chosen cloud provider.
```
$ make aws_apply
# or
$ make gcp_apply
```

## TODO
TODO listhttps://app.asana.com/0/1003113032464624/1003115450055924)