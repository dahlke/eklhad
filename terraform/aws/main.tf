variable "aws_access_key" {}
variable "aws_secret_key" {}

provider "aws" {
  region     = "${var.region}"
  access_key = "${var.aws_access_key}"
  secret_key = "${var.aws_secret_key}"
}

resource "aws_vpc" "eklhad_web" {
  cidr_block           = "${var.vpc_cidr_block}"
  enable_dns_hostnames = true
}

resource "aws_subnet" "eklhad_web" {
  vpc_id            = "${aws_vpc.eklhad_web.id}"
  cidr_block        = "${var.subnet_cidr_block}"
  availability_zone = "${var.availability_zone}"

  tags {
    name = "${var.name}"
  }
}

resource "aws_security_group" "eklhad_web" {
  name   = "eklhad_web"
  vpc_id = "${aws_vpc.eklhad_web.id}"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks     = ["0.0.0.0/0"]
    prefix_list_ids = []
  }

  tags {
    Name = "${var.name}"
  }
}

resource "aws_eip" "eklhad_web" {
  instance = "${aws_instance.eklhad_web.id}"
  vpc      = true
}

resource "aws_internet_gateway" "eklhad_web" {
  vpc_id = "${aws_vpc.eklhad_web.id}"
}

resource "aws_route_table" "eklhad_web" {
  vpc_id = "${aws_vpc.eklhad_web.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.eklhad_web.id}"
  }

  tags {
    Name = "${var.name}"
  }
}

resource "aws_route_table_association" "eklhad_web" {
  subnet_id      = "${aws_subnet.eklhad_web.id}"
  route_table_id = "${aws_route_table.eklhad_web.id}"
}

resource "aws_instance" "eklhad_web" {
  ami                         = "${var.ami_id}"
  instance_type               = "${var.instance_type}"
  key_name                    = "${var.ssh_key_name}"
  associate_public_ip_address = true
  subnet_id                   = "${aws_subnet.eklhad_web.id}"
  vpc_security_group_ids      = ["${aws_security_group.eklhad_web.id}"]

  tags {
    Name = "${var.name}"
  }

  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = "${var.ssh_user}"
      private_key = "${file(var.ssh_private_key_path)}"
    }

    inline = [
      "cd web/",
      "nohup ./main &",
      "sleep 1",
    ]
  }
}

module "eklhad_cloudflare_records" {
  source            = "../modules/cloudflare-records/"
  cloudflare_email  = "${var.cloudflare_email}"
  cloudflare_token  = "${file(var.cloudflare_token_path)}"
  cloudflare_domain = "${var.cloudflare_domain}"
  a_record_ip       = "${aws_instance.eklhad_web.public_ip}"
}
