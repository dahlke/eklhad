output "www_hostname" {
  value = "${cloudflare_record.www.hostname}"
}
output "dahlkeio_hostname" {
  value = "${cloudflare_record.dahlkeio.hostname}"
}

/*
output "test_hostname" {
  value = "${cloudflare_record.test.hostname}"
}
*/
