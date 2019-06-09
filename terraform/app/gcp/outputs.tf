output "ssh" {
  value = "ssh -i ${var.ssh_private_key_path} ${var.ssh_user}@${google_compute_address.web.address}"
}

output "ui_http" {
  value = "http://${google_compute_address.web.address}"
}
output "ui_https" {
  value = "https://${google_compute_address.web.address}"
}

output "public_ip" {
  value = "${google_compute_address.web.address}"
}

output "lets_encrypt_id" {
  value = "${acme_certificate.certificate.id}"
}

output "lets_encrypt_cert_url" {
  value = "${acme_certificate.certificate.certificate_url}"
}

output "lets_encrypt_cert_domain" {
  value = "${acme_certificate.certificate.certificate_domain}"
}

output "lets_encrypt_cert_pem" {
  value = "${acme_certificate.certificate.certificate_pem}"
}

output "lets_encrypt_cert_p12" {
  value = "${acme_certificate.certificate.certificate_p12}"
}

output "lets_encrypt_issuer_pem" {
  value = "${acme_certificate.certificate.issuer_pem}"
}

output "lets_encrypt_private_key_pem" {
  value = "${acme_certificate.certificate.private_key_pem}"
}
