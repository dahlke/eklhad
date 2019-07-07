terraform {
  required_version = "0.12.2"

  backend "remote" {
    hostname     = "app.terraform.io"
    organization = "eklhad"

    workspaces {
      name = "gcp-eklhad-web"
    }
  }
}

provider "google" {
  credentials = file("/Users/neil/.gcp/eklhad/eklhad-web-e91c00f7deef.json")
  project     = var.project
  region      = var.region
  zone        = var.zone
}

provider "acme" {
  # server_url = "https://acme-staging-v02.api.letsencrypt.org/directory"
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
}

resource "tls_private_key" "private_key" {
  algorithm = "RSA"
}

resource "acme_registration" "reg" {
  account_key_pem = tls_private_key.private_key.private_key_pem
  email_address = var.email
}

resource "acme_certificate" "certificate" {
  account_key_pem           = acme_registration.reg.account_key_pem
  common_name               = "dahlke.io"
  subject_alternative_names = ["www.dahlke.io", "gcp.dahlke.io", "aws.dahlke.io"]

  dns_challenge {
    provider = "cloudflare"
  }
}

resource "google_compute_address" "web" {
  name = "ipv4-address"
}

resource "google_compute_firewall" "web" {
  name    = "${var.project}-firewall"
  network = google_compute_network.web.name

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443"]
  }

  target_tags = var.tags
}

resource "google_compute_network" "web" {
  name = "${var.project}-network"
}

resource "google_compute_instance" "web" {
  name         = var.project
  machine_type = var.machine_type
  zone         = var.zone

  tags = var.tags

  boot_disk {
    initialize_params {
      image = var.image_id
    }
  }

  network_interface {
    network = google_compute_network.web.name

    access_config {
      nat_ip = google_compute_address.web.address
    }
  }

  metadata = {
    sshKeys = "${var.ssh_user}:${file(var.ssh_pub_key_path)}"
  }

  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = var.ssh_user
      private_key = file(var.ssh_private_key_path)
      host        = google_compute_address.web.address
    }

    inline = [
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_cert.pem",
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_issuer.pem'",
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_private_key.pem'",
      "echo \"${acme_certificate.certificate.certificate_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_cert.pem",
      "echo \"${acme_certificate.certificate.certificate_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_issuer.pem",
      "echo \"${acme_certificate.certificate.private_key_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_private_key.pem",
      "cd ./go/src/github.com/dahlke/eklhad/web/",
      "nohup ./main -production &",
      "sleep 1",
    ]
  }
}

resource "cloudflare_record" "gcp" {
  domain = var.cloudflare_domain
  name   = "gcp"
  value  = google_compute_address.web.address
  type   = "A"
}

resource "cloudflare_record" "www" {
  domain = var.cloudflare_domain
  name   = "www"
  value  = google_compute_address.web.address
  type   = "A"
}

resource "cloudflare_record" "dahlkeio" {
  domain = var.cloudflare_domain
  name   = "dahlke.io"
  value  = google_compute_address.web.address
  type   = "A"
}

