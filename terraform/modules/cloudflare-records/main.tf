provider "cloudflare" {
  email = "${var.cloudflare_email}"
  token = "${var.cloudflare_token}"
}

resource "cloudflare_record" "www" {
  domain = "${var.cloudflare_domain}"
  name   = "www"
  value  = "${var.a_record_ip}"
  type   = "A"
}

resource "cloudflare_record" "dahlkeio" {
  domain = "${var.cloudflare_domain}"
  name   = "dahlke.io"
  value  = "${var.a_record_ip}"
  type   = "A"
}
