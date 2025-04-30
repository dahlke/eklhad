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
  project = var.gcp_project
  region  = var.gcp_region
  zone    = var.gcp_zone
}

provider "acme" {
  # server_url = "https://acme-staging-v02.api.letsencrypt.org/directory"
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
}

resource "tls_private_key" "acme_private_key" {
  algorithm = "RSA"
}

resource "acme_registration" "reg" {
  account_key_pem = tls_private_key.acme_private_key.private_key_pem
  email_address   = var.email
}

resource "acme_certificate" "certificate" {
  account_key_pem           = acme_registration.reg.account_key_pem
  common_name               = "dahlke.io"
  subject_alternative_names = ["gcp.dahlke.io", "gcp7.dahlke.io"]
  # NOTE: Due to the expiration of DST Root CA X3, we use ISRG Root X1
  preferred_chain = "ISRG Root X1"

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
      image = var.gcp_image_id
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
    email  = "eklhad-web-packer@eklhad-web.iam.gserviceaccount.com"
    scopes = ["storage-rw"]
  }

  metadata = {
    sshKeys = "${var.ssh_user}:${file(var.local_ssh_public_key_path)}"
  }
}

resource "null_resource" "setup-web" {
  depends_on = [google_compute_instance.web]

  triggers = {
    build_number = timestamp()
  }

  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = var.ssh_user
      private_key = file(var.local_ssh_private_key_path)
      host        = google_compute_address.web.address
    }

    inline = [
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_cert.pem",
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_issuer.pem",
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_private_key.pem",
      "echo -e \"${acme_certificate.certificate.certificate_pem}\n${acme_certificate.certificate.issuer_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_cert.pem",
      "echo \"${acme_certificate.certificate.private_key_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_private_key.pem",
      "cd /home/ubuntu/go/src/github.com/dahlke/eklhad/web/",
      "touch /tmp/eklhad-web-logs.txt",
      "nohup ./main -production &> /tmp/eklhad-web-logs.txt",
      "sleep 1"
    ]
  }
}


resource "cloudflare_record" "gcp" {
  zone_id = var.cloudflare_zone_id
  name    = "gcp"
  value   = google_compute_address.web.address
  type    = "A"
}


/*
NOTE: These resources could also be managed from the AWS configuration in the
event of a failover
*/
resource "cloudflare_record" "static" {
  zone_id = var.cloudflare_zone_id
  name    = "static"
  value   = "dahlke.github.io"
  type    = "CNAME"
}

resource "cloudflare_record" "dahlkeio" {
  zone_id = var.cloudflare_zone_id
  name    = "dahlke.io"
  value   = google_compute_address.web.address
  type    = "A"
}

# Add www subdomain as CNAME to root domain
resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = "dahlke.io"
  type    = "CNAME"
  proxied = true
}

# Add MX record for email
resource "cloudflare_record" "mx" {
  zone_id  = var.cloudflare_zone_id
  name     = "dahlke.io"
  value    = "mail.dahlke.io"
  type     = "MX"
  priority = 10
}

# Add SPF record to prevent email spoofing
resource "cloudflare_record" "spf" {
  zone_id = var.cloudflare_zone_id
  name    = "dahlke.io"
  value   = "v=spf1 -all"
  type    = "TXT"
}

# Add DMARC record
resource "cloudflare_record" "dmarc" {
  zone_id = var.cloudflare_zone_id
  name    = "_dmarc"
  value   = "v=DMARC1; p=reject; rua=mailto:dmarc@dahlke.io"
  type    = "TXT"
}