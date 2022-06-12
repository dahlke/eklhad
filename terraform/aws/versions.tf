terraform {
  required_version = ">=0.15.3"

  required_providers {
    google = {
      source  = "hashicorp/aws"
      version = "~> 4.18"
    }

    tls = {
      source = "hashicorp/tls"
      version = "~> 3.1"
    }

    acme = {
      source = "vancluever/acme"
      version = "~> 2.9"
    }

    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "~> 3.17"
    }
  }
}