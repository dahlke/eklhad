packer {
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = "~> 1"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "eklhad-web-packer-{{timestamp}}"
  instance_type = "t2.micro"
  region        = "us-west-1"

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-focal-20.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }

    most_recent = true
    owners      = ["099720109477"]
  }

  ssh_username = "ubuntu"
}

build {
  sources = [
    "source.amazon-ebs.ubuntu"
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