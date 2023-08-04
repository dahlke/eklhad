variable "prefix" {
  type    = string
  default = "eklhad-web"
}

variable "aws_region" {
  type = string
}

variable "aws_zone" {
  type = string
}

variable "aws_machine_type" {
  type = string
}

variable "aws_image_id" {
  type = string
}

variable "tags" {
  type = map(any)
  default = {
    Name = "eklhad-web"
  }
}

variable "ssh_user" {
  type = string
}

variable "local_ssh_public_key_path" {
  type = string
}

variable "local_ssh_private_key_path" {
  type = string
}

variable "cloudflare_zone_id" {
  type = string
}

variable "email" {
  type = string
}