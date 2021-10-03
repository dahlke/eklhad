output "ssh" {
  value = "ssh -i ${var.local_ssh_private_key_path} ${var.ssh_user}@${google_compute_address.web.address}"
}

output "ui_http" {
  value = "http://${google_compute_address.web.address}"
}

output "ui_https" {
  value = "https://${google_compute_address.web.address}"
}

output "public_ip" {
  value = google_compute_address.web.address
}