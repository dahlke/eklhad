output "ip_ssh" {
  value = "ssh -i ${var.local_ssh_private_key_path} ${var.ssh_user}@${aws_eip.web.public_ip}"
}

output "ip_ui_http" {
  value = "http://${aws_eip.web.public_ip}"
}

output "ip_ui_https" {
  value = "https://${aws_eip.web.public_ip}"
}

output "ip_public_ip" {
  value = aws_eip.web.public_ip
}
