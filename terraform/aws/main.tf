terraform {
  # NOTE: TF and TF provider versions in versions.tf
  backend "remote" {
    hostname     = "app.terraform.io"
    organization = "eklhad"

    # NOTE: Change execution mode to local after initial workspace creation
    workspaces {
      name = "aws-eklhad-web"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
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
  subject_alternative_names = ["aws.dahlke.io", "aws4.dahlke.io"]

  # Due to the expiration of DST Root CA X3
  preferred_chain = "ISRG Root X1"

  dns_challenge {
    provider = "cloudflare"
  }
}

locals {
  private_key_filename = "${var.prefix}-ssh-key.pem"
}

resource "aws_key_pair" "web" {
  key_name   = var.prefix
  public_key = file(var.local_ssh_public_key_path)
}

resource "aws_vpc" "web" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags = var.tags
}

resource "aws_subnet" "web" {
  vpc_id            = aws_vpc.web.id
  availability_zone = var.aws_zone
  cidr_block        = "10.0.10.0/24"

  tags = var.tags
}

resource "aws_security_group" "web" {
  name = "${var.prefix}-security-group"

  vpc_id = aws_vpc.web.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3554
    to_port     = 3554
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

  tags = var.tags
}

resource "aws_internet_gateway" "web" {
  vpc_id = aws_vpc.web.id

  tags = {
    Name = "${var.prefix}-internet-gateway"
  }
}

resource "aws_route_table" "web" {
  vpc_id = aws_vpc.web.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.web.id
  }
}

resource "aws_route_table_association" "web" {
  subnet_id      = aws_subnet.web.id
  route_table_id = aws_route_table.web.id
}


resource "aws_eip" "web" {
  instance = aws_instance.web.id
  vpc      = true
}

resource "aws_eip_association" "web" {
  instance_id   = aws_instance.web.id
  allocation_id = aws_eip.web.id
}

resource "aws_instance" "web" {
  # TODO: set a name on the instance
  ami                         = var.aws_image_id
  instance_type               = var.aws_machine_type
  key_name                    = aws_key_pair.web.key_name
  associate_public_ip_address = true
  subnet_id                   = aws_subnet.web.id
  vpc_security_group_ids      = [aws_security_group.web.id]

  tags = var.tags

  credit_specification {
    cpu_credits = "unlimited"
  }
}

resource "null_resource" "setup-web" {
  depends_on = [aws_eip_association.web]

  triggers = {
    build_number = timestamp()
  }

  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = var.ssh_user
      private_key = file(var.local_ssh_private_key_path)
      host        = aws_eip.web.public_ip
    }

    # TODO: inject GCP creds to retrieve data
    inline = [
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_cert.pem",
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_issuer.pem",
      "touch /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_private_key.pem",
      "echo \"${acme_certificate.certificate.certificate_pem}${acme_certificate.certificate.issuer_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_cert.pem",
      "echo \"${acme_certificate.certificate.private_key_pem}\" > /home/ubuntu/go/src/github.com/dahlke/eklhad/web/acme_private_key.pem",
      "cd /home/ubuntu/go/src/github.com/dahlke/eklhad/web/",
      "touch /tmp/eklhad-web-logs.txt",
      "nohup ./main -production &> /tmp/eklhad-web-logs.txt",
      "sleep 1"
    ]
  }
}

resource "cloudflare_record" "aws" {
  zone_id = var.cloudflare_zone_id
  name    = "aws"
  value   = aws_eip.web.public_ip
  type    = "A"
}

/*
NOTE: These resources are typically handled in the GCP TF configuration.
If need to fail over, uncomment these.
*/

/*
resource "cloudflare_record" "static" {
  zone_id = var.cloudflare_zone_id
  name   = "static"
  value  = "dahlke.github.io"
  type   = "CNAME"
}

resource "cloudflare_record" "dahlkeio" {
  zone_id = var.cloudflare_zone_id
  name   = "dahlke.io"
  value  = aws_eip.web.public_ip
  type   = "A"
}
*/