output "ssh" {
  value = "ssh -i ${var.ssh_private_key_path} ${var.ssh_user}@${google_compute_instance.web.network_interface.0.access_config.0.assigned_nat_ip}"
}

output "ui" {
  value = "http://${google_compute_instance.web.network_interface.0.access_config.0.assigned_nat_ip}:8080"
}

output "public_ip" {
  value = "${google_compute_instance.web.network_interface.0.access_config.0.assigned_nat_ip}"
}