provider "google" {
  credentials = "${file("../../secrets/gcp-eklhad-service-account.json")}"
  project     = "${var.project}"
  region      = "${var.region}"
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
    ports    = ["22", "80", "443", "8080"]
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
      "cd eklhad/",
      "nohup ./main &",
      "sleep 1",
    ]
  }
}
