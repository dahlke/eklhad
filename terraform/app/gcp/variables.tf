variable "gcp_creds_path" {
  type = string
}

variable "project" {
  type = string
}

variable "region" {
  type = string
}

variable "zone" {
  type = string
}

variable "machine_type" {
  type = string
}

variable "tags" {
  type    = list(string)
  default = ["web"]
}

variable "image_id" {
  type = string
}

variable "ssh_user" {
  type = string
}

variable "ssh_pub_key_path" {
  type = string
}

variable "ssh_private_key_path" {
  type = string
}

variable "cloudflare_domain" {
  type = string
}

variable "email" {
  type = string
}

