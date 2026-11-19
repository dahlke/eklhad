terraform {
  required_version = ">=1.7.0"
  backend "gcs" {
    bucket = "eklhad-web-private"
    prefix = "terraform-cloudrun.tfstate"
  }
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
# Note: If certificate provisioning gets stuck, you can force a refresh by:
# 1. terraform destroy -target=google_cloud_run_domain_mapping.default
# 2. Wait 5-10 minutes for cleanup
# 3. terraform apply
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
# Extract A and AAAA records from domain mapping
locals {
  a_records = [
    for record in google_cloud_run_domain_mapping.default.status[0].resource_records :
    record.rrdata if record.type == "A"
  ]
  aaaa_records = [
    for record in google_cloud_run_domain_mapping.default.status[0].resource_records :
    record.rrdata if record.type == "AAAA"
  ]
}

# Create all 4 A records for dahlke.io (Cloud Run requires all of them)
resource "cloudflare_record" "dahlkeio_a1" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "A"
  value          = local.a_records[0]
  ttl            = 1
  comment        = "Cloud Run domain mapping - A record 1/4"
  allow_overwrite = true
  depends_on     = [google_cloud_run_domain_mapping.default]
}

resource "cloudflare_record" "dahlkeio_a2" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "A"
  value          = local.a_records[1]
  ttl            = 1
  comment        = "Cloud Run domain mapping - A record 2/4"
  allow_overwrite = true
  depends_on     = [google_cloud_run_domain_mapping.default]
}

resource "cloudflare_record" "dahlkeio_a3" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "A"
  value          = local.a_records[2]
  ttl            = 1
  comment        = "Cloud Run domain mapping - A record 3/4"
  allow_overwrite = true
  depends_on     = [google_cloud_run_domain_mapping.default]
}

resource "cloudflare_record" "dahlkeio_a4" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "A"
  value          = local.a_records[3]
  ttl            = 1
  comment        = "Cloud Run domain mapping - A record 4/4"
  allow_overwrite = true
  depends_on     = [google_cloud_run_domain_mapping.default]
}

# Create all 4 AAAA records for dahlke.io (Cloud Run requires all of them)
resource "cloudflare_record" "dahlkeio_aaaa1" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "AAAA"
  value          = local.aaaa_records[0]
  ttl            = 1
  comment        = "Cloud Run domain mapping - AAAA record 1/4"
  allow_overwrite = true
  depends_on     = [google_cloud_run_domain_mapping.default]
}

resource "cloudflare_record" "dahlkeio_aaaa2" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "AAAA"
  value          = local.aaaa_records[1]
  ttl            = 1
  comment        = "Cloud Run domain mapping - AAAA record 2/4"
  allow_overwrite = true
  depends_on     = [google_cloud_run_domain_mapping.default]
}

resource "cloudflare_record" "dahlkeio_aaaa3" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "AAAA"
  value          = local.aaaa_records[2]
  ttl            = 1
  comment        = "Cloud Run domain mapping - AAAA record 3/4"
  allow_overwrite = true
  depends_on     = [google_cloud_run_domain_mapping.default]
}

resource "cloudflare_record" "dahlkeio_aaaa4" {
  zone_id        = var.cloudflare_zone_id
  name           = "dahlke.io"
  type           = "AAAA"
  value          = local.aaaa_records[3]
  ttl            = 1
  comment        = "Cloud Run domain mapping - AAAA record 4/4"
  allow_overwrite = true
  depends_on     = [google_cloud_run_domain_mapping.default]
}

# gcp.dahlke.io DNS record removed - no longer needed

# Other Cloudflare DNS records (moved from VM terraform)
resource "cloudflare_record" "static" {
  zone_id = var.cloudflare_zone_id
  name    = "static"
  value   = "dahlke.github.io"
  type    = "CNAME"
  allow_overwrite = true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = "dahlke.io"
  type    = "CNAME"
  proxied = true
  allow_overwrite = true
}

resource "cloudflare_record" "mx" {
  zone_id  = var.cloudflare_zone_id
  name     = "dahlke.io"
  value    = "mail.dahlke.io"
  type     = "MX"
  priority = 10
  allow_overwrite = true
}

resource "cloudflare_record" "dmarc" {
  zone_id = var.cloudflare_zone_id
  name    = "_dmarc"
  value   = "v=DMARC1; p=reject; rua=mailto:dmarc@dahlke.io"
  type    = "TXT"
  allow_overwrite = true
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