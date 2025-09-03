variable "gcp_project" {
  description = "The GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "docker_hub_user" {
  description = "Docker Hub username"
  type        = string
  default     = "eklhad"
}

variable "docker_image_name" {
  description = "Docker image name"
  type        = string
  default     = "eklhad-web"
}

variable "docker_image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}