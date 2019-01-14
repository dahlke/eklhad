variable "name" {
  type = "string"
}

variable "region" {
  type = "string"
}

variable "availability_zone" {
  type = "string"
}

variable "instance_type" {
  type = "string"
}

variable "ami_id" {
  type = "string"
}

variable "vpc_cidr_block" {
  type = "string"
}

variable "subnet_cidr_block" {
  type = "string"
}

variable "ssh_user" {
  type = "string"
}

variable "ssh_key_name" {
  type = "string"
}

variable "ssh_private_key_path" {
  type = "string"
}

variable "web_binary_path" {
  type = "string"
}
