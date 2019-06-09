provider "google" {
  # TODO
  credentials = "${file("/Users/neil/.gcp/eklhad/eklhad-web-e91c00f7deef.json")}"
  project     = "${var.project}"
  region      = "${var.region}"
}

terraform {
  backend "remote" {
    hostname = "app.terraform.io"
    organization = "eklhad"

    workspaces {
      name = "gcp-eklhad-web"
    }
  }
}

resource "google_compute_address" "web" {
  name = "ipv4-address"
}

resource "google_compute_firewall" "web" {
  name    = "${var.project}-firewall"
  network = "${google_compute_network.web.name}"

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443"]
  }

  target_tags = "${var.tags}"
}

resource "google_compute_network" "web" {
  name = "${var.project}-network"
}

resource "google_compute_instance" "web" {
  name         = "${var.project}"
  machine_type = "${var.machine_type}"
  zone         = "${var.zone}"

  tags = "${var.tags}"

  boot_disk {
    initialize_params {
      image = "${var.image_id}"
    }
  }

  network_interface {
    network = "${google_compute_network.web.name}"

    access_config {
      nat_ip = "${google_compute_address.web.address}"
    }
  }

  metadata {
    sshKeys = "${var.ssh_user}:${file(var.ssh_pub_key_path)}"
  }

  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = "${var.ssh_user}"
      private_key = "${file(var.ssh_private_key_path)}"
    }

    inline = [
      "cd src/github.com/dahlke/eklhad/web",
      // "sudo nohup ./main -production &",
      "sudo nohup ./main &",
     "sleep 1",
    ]
  }
}

/*
module "eklhad_cloudflare_records" {
  source            = "../modules/cloudflare-records/"
  cloudflare_email  = "${var.cloudflare_email}"
  cloudflare_token  = "${file(var.cloudflare_token_path)}"
  cloudflare_domain = "${var.cloudflare_domain}"
  a_record_ip       = "${google_compute_address.web.address}"
}
*/