
terraform {
  # NOTE: TF and TF provider versions in versions.tf
  backend "remote" {
    hostname     = "app.terraform.io"
    organization = "eklhad"

    # NOTE: Change execution mode to local after initial workspace creation
    workspaces {
      name = "gcp-eklhad-web"
    }
  }
}

provider "google" {
  project     = var.gcp_project
  region      = var.gcp_region
  zone        = var.gcp_zone
}

provider "acme" {
  # server_url = "https://acme-staging-v02.api.letsencrypt.org/directory"
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
}

resource "tls_private_key" "acme_private_key" {
  algorithm = "RSA"
}

resource "tls_private_key" "gcp_private_key" {
  algorithm = "RSA"
}

resource "acme_registration" "reg" {
  account_key_pem = tls_private_key.acme_private_key.private_key_pem
  email_address = var.email
}

resource "acme_certificate" "certificate" {
  account_key_pem           = acme_registration.reg.account_key_pem
  common_name               = "dahlke.io"
  subject_alternative_names = ["www.dahlke.io", "gcp.dahlke.io", "aws.dahlke.io", "foo.dahlke.io"]

  dns_challenge {
    provider = "cloudflare"
  }
}

resource "google_compute_address" "web" {
  name = "ipv4-address"
}

resource "google_compute_network" "web" {
  name = "${var.gcp_project}-network"
}

resource "google_compute_firewall" "web" {
  name    = "${var.gcp_project}-firewall"
  network = google_compute_network.web.name

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "3554"]
  }

  target_tags = var.tags
}

resource "google_compute_instance" "web" {
  name         = var.gcp_project
  machine_type = var.gcp_machine_type
  zone         = var.gcp_zone

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

  allow_stopping_for_update = true

  service_account {
    # Assume local Packer role, rather than create a 3rd role.
    email = "eklhad-web-packer@eklhad-web.iam.gserviceaccount.com"
    scopes = ["storage-rw"]
  }

  metadata = {
    sshKeys = "${var.ssh_user}:${var.env == "dev" ? file(var.local_ssh_pub_key_path) : tls_private_key.gcp_private_key.public_key_openssh}"
  }

  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = var.ssh_user
      private_key = var.env == "dev" ? file(var.local_ssh_private_key_path) : tls_private_key.gcp_private_key.private_key_pem
      host        = google_compute_address.web.address
    }

    inline = [
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_cert.pem",
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_issuer.pem",
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_private_key.pem",
      "echo \"${acme_certificate.certificate.certificate_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_cert.pem",
      "echo \"${acme_certificate.certificate.certificate_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_issuer.pem",
      "echo \"${acme_certificate.certificate.private_key_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_private_key.pem",
      "cd /home/ubuntu/go/src/github.com/dahlke/eklhad/web/",
      "nohup ./main -production",
      "sleep 1"
    ]
    // TODO: why does this never complete? The tee?
    // TODO: nohup ./main -production 2>&1 | tee /tmp/eklhad-web-logs.txt"
  }
}

resource "cloudflare_record" "gcp" {
  zone_id = var.cloudflare_zone_id
  name   = "gcp"
  value  = google_compute_address.web.address
  type   = "A"
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name   = "www"
  value  = google_compute_address.web.address
  type   = "A"
}

resource "cloudflare_record" "dahlkeio" {
  zone_id = var.cloudflare_zone_id
  name   = "dahlke.io"
  value  = google_compute_address.web.address
  type   = "A"
}