# Eklhad
### My Personal Website

#### Deployment Requirements
- `packer` 
    - Packer is required to build an AMI for deployment via Terraform
- `terraform` 
    - Terraform is the tool we'll use to deploy our app. 
- `npm`
    - NPM is used to build static assets for the app.
- `go` 
    - Go is the server language of the app. Required for development and building for deployment.

# Deploying

## GCP
- Create Project
- Enable Google Compute API
- Build Packer Image
    - Update packer/gcp/image.json with project ID.
    - Take the Packer Image ID from the output and add it to terraform.tfvars as the image_id
- Deploy to GCP.

## AWS