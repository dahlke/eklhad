# Eklhad

My personal, digital assets.

[TODO list](https://app.asana.com/0/1003113032464624/1003115450055924)

## Web

### Install Requirements
- `packer` is required to build an AMI for deployment via Terraform
- `terraform` is the tool we'll use to deploy our app. 
- `npm` is used to build static assets for the app.
- `go` is the server language of the app. Required for development and building for deployment.


### Cloud Prereqs

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

