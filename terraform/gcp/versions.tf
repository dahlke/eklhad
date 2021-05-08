terraform {
  required_version = ">=0.15.3"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 3.66"
    }

    tls = {
      source = "hashicorp/tls"
      version = "~> 3.1"
    }

    acme = {
      source = "vancluever/acme"
      version = "~> 2.4"
    }

    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "~> 2.20"
    }
  }
}