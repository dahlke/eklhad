terraform {
  required_version = ">=1.7.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.85.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.20.0"
    }
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

provider "cloudflare" {
  # Uses CLOUDFLARE_API_TOKEN environment variable automatically
}

# Enable required APIs
resource "google_project_service" "run" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "iam" {
  service = "iam.googleapis.com"
  disable_on_destroy = false
}

# Note: Using existing service account, so Compute Engine API not needed

# Enable Domains API for domain mapping
resource "google_project_service" "domains" {
  service = "domains.googleapis.com"
  disable_on_destroy = false
}

# Grant the Cloud Run service agent the necessary permissions
resource "google_project_iam_member" "cloud_run_service_agent" {
  project = var.gcp_project
  role    = "roles/run.serviceAgent"
  member  = "serviceAccount:service-${data.google_project.project.number}@serverless-robot-prod.iam.gserviceaccount.com"
  depends_on = [google_project_service.run]
}

# Get project information
data "google_project" "project" {
}

# Grant the Cloud Run service agent permission to act as the packer service account
# This allows Cloud Run to use the existing service account
resource "google_service_account_iam_member" "cloud_run_act_as_packer" {
  service_account_id = "projects/${var.gcp_project}/serviceAccounts/eklhad-web-packer@${var.gcp_project}.iam.gserviceaccount.com"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:service-${data.google_project.project.number}@serverless-robot-prod.iam.gserviceaccount.com"
  depends_on         = [google_project_service.iam, google_project_service.run]
}

locals {
  container_image = "${var.docker_hub_user}/${var.docker_image_name}:${var.docker_image_tag}"
}

# Cloud Run service
resource "google_cloud_run_service" "eklhad" {
  name     = "eklhad-web"
  location = var.gcp_region

  template {
    spec {
      # Use the existing packer service account
      service_account_name = "eklhad-web-packer@${var.gcp_project}.iam.gserviceaccount.com"
      containers {
        image = local.container_image
        ports {
          container_port = 3554
        }
        # PORT is automatically set by Cloud Run - don't set it manually
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run, google_service_account_iam_member.cloud_run_act_as_packer]
}

# Make the service public
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth" {
  location    = google_cloud_run_service.eklhad.location
  project     = var.gcp_project
  service     = google_cloud_run_service.eklhad.name
  policy_data = data.google_iam_policy.noauth.policy_data
}

# Domain mapping for dahlke.io
resource "google_cloud_run_domain_mapping" "default" {
  location = var.gcp_region
  name     = "dahlke.io"

  metadata {
    namespace = var.gcp_project
  }

  spec {
    route_name = google_cloud_run_service.eklhad.name
  }

  depends_on = [google_project_service.domains, google_cloud_run_service.eklhad]
}

# Cloudflare DNS records for dahlke.io pointing to Cloud Run
# Extract A records from domain mapping
locals {
  a_records = [
    for record in google_cloud_run_domain_mapping.default.status[0].resource_records :
    record.rrdata if record.type == "A"
  ]
}

# Update dahlke.io A record to point to Cloud Run
resource "cloudflare_record" "dahlkeio" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "A"
  value          = local.a_records[0]  # Use first A record
  ttl            = 1  # Auto TTL
  comment        = "Cloud Run domain mapping - updated from VM"
  allow_overwrite = true  # Allow overwriting existing record from VM terraform
  depends_on     = [google_cloud_run_domain_mapping.default]
}

# Update gcp.dahlke.io A record to point to Cloud Run
resource "cloudflare_record" "gcp" {
  zone_id        = var.cloudflare_zone_id
  name           = "gcp"
  type           = "A"
  value          = local.a_records[0]  # Use first A record
  ttl            = 1  # Auto TTL
  comment        = "Cloud Run domain mapping - updated from VM"
  allow_overwrite = true  # Allow overwriting existing record from VM terraform
  depends_on     = [google_cloud_run_domain_mapping.default]
}

# Output the DNS records that were created
output "domain_mapping_records" {
  description = "DNS records for domain mapping"
  value       = google_cloud_run_domain_mapping.default.status[0].resource_records
}

# Output the service URL for preview
output "service_url" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.eklhad.status[0].url
}

output "custom_domain" {
  description = "The custom domain URL"
  value       = "https://dahlke.io"
}