packer {
  required_plugins {
    googlecompute = {
      source  = "github.com/hashicorp/googlecompute"
      version = "~> 1"
    }
  }
}

source "googlecompute" "ubuntu" {
  image_name = "eklhad-web-packer-{{timestamp}}"
  project_id = "eklhad-web"
  source_image = "ubuntu-2004-focal-v20210415"
  ssh_username = "ubuntu"
  machine_type = "n2-standard-2"
  zone = "us-west1-b"
  service_account_email = "eklhad-web-packer@eklhad-web.iam.gserviceaccount.com"
}

build {
  sources = [
    "source.googlecompute.ubuntu"
  ]

  provisioner "shell" {
    inline = [
      "wget https://dl.google.com/go/go1.16.2.linux-amd64.tar.gz",
      "sudo tar -C /usr/local -xzf go1.16.2.linux-amd64.tar.gz",
      "touch ~/.bashrc",
      "echo \"PATH=$PATH:/usr/local/go/bin\" >> ~/.bashrc",
      "echo \"GOPATH=/home/ubuntu/go/src/\" >> ~/.bashrc"
    ]
  }

  provisioner "shell" {
    inline = [
      "mkdir -p /home/ubuntu/go/src/github.com/dahlke/eklhad/"
    ]
  }

  provisioner "file" {
    source = "./artifact/tar/linux/eklhad-web.tar.gz"
    destination = "/home/ubuntu/go/src/github.com/dahlke/eklhad/eklhad-web.tar.gz"
  }

  provisioner "shell" {
    inline = [
      "tar -C /home/ubuntu/go/src/github.com/dahlke/eklhad/ -xf /home/ubuntu/go/src/github.com/dahlke/eklhad/eklhad-web.tar.gz",
      "sudo setcap CAP_NET_BIND_SERVICE=+eip /home/ubuntu/go/src/github.com/dahlke/eklhad/web/main"
    ]
  }
}