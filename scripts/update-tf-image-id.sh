#!/bin/bash

# Script to update local Terraform variables with latest GCP image ID
# Usage: ./scripts/update-tf-image-id.sh

set -e

# Get the latest image ID from Packer output
IMAGE_ID=$(tail -n 1 /Users/neil/src/github.com/dahlke/eklhad/packer/gcp/output/image.txt | awk '{print $12}')

if [ -z "$IMAGE_ID" ]; then
    echo "Error: Could not extract image ID from Packer output"
    exit 1
fi

echo "Updating local Terraform variables with image ID: $IMAGE_ID"

# Update the terraform.auto.tfvars file
TFVARS_FILE="/Users/neil/src/github.com/dahlke/eklhad/terraform/gcp/terraform.auto.tfvars"

if [ ! -f "$TFVARS_FILE" ]; then
    echo "Error: $TFVARS_FILE not found"
    exit 1
fi

# Update the gcp_image_id line in the tfvars file
sed -i.bak "s/gcp_image_id.*=.*\".*\"/gcp_image_id               = \"$IMAGE_ID\"/" "$TFVARS_FILE"

echo "Successfully updated gcp_image_id to: $IMAGE_ID in $TFVARS_FILE"
echo "Backup created at: ${TFVARS_FILE}.bak"
