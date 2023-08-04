variable "gcp_project" {
  type    = string
  default = "eklhad-web"
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

variable "gcp_image_id" {
  type = string
}

variable "tags" {
  type    = list(string)
  default = ["eklhad-web"]
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
