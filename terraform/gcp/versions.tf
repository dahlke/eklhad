terraform {
  required_version = ">=1.7.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.85.0"
    }

    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0.0"
    }

    acme = {
      source  = "vancluever/acme"
      version = "~> 2.17.0"
    }

    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.20.0"
    }
  }
}