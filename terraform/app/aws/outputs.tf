output "ssh" {
  value = "ssh -i ${var.ssh_private_key_path} ${var.ssh_user}@${aws_eip.eklhad_web.public_ip}"
}

output "ui" {
  value = "http://${aws_eip.eklhad_web.public_ip}"
}

output "public_ip" {
  value = "${aws_eip.eklhad_web.public_ip}"
}
