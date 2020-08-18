variable "env" {
  type = string
  default = "prod"
}

variable "gcp_project" {
  type = string
}

variable "gcp_region" {
  type = string
}

variable "gcp_zone" {
  type = string
}

variable "gcp_machine_type" {
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

variable "local_ssh_pub_key_path" {
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
