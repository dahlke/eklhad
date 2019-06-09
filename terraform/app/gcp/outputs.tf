output "ssh" {
  value = "ssh -i ${var.ssh_private_key_path} ${var.ssh_user}@${google_compute_address.web.address}"
}

output "ui" {
  value = "https://${google_compute_address.web.address}"
}

output "public_ip" {
  value = "${google_compute_address.web.address}"
}
