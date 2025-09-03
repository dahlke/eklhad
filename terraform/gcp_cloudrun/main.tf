terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
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

# Enable Domains API
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

# Grant the compute service account permission to be used by Cloud Run
resource "google_service_account_iam_member" "compute_service_account" {
  service_account_id = "projects/${var.gcp_project}/serviceAccounts/${data.google_project.project.number}-compute@developer.gserviceaccount.com"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
  depends_on         = [google_project_service.iam]
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
      containers {
        image = local.container_image
        ports {
          container_port = 3554
        }
        env {
          name  = "PORT"
          value = "3554"
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
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
}

# Output the DNS records that need to be created
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