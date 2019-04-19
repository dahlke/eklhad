name = "eklhad-web"

region = "us-west-2"

availability_zone = "us-west-2b"

instance_type = "t2.micro"

ami_id = "ami-071239c06a6f84027"

vpc_cidr_block = "10.0.0.0/16"

subnet_cidr_block = "10.0.0.0/24"

ssh_user = "ubuntu"

ssh_key_name = "eklhad-web-aws"

ssh_private_key_path = "~/.ssh/aws/eklhad-web-aws.pem"

web_binary_path = "./web/main"

cloudflare_email = "neil.dahlke@gmail.com"

cloudflare_token_path = "~/src/dahlke/eklhad/secret/cloudflare.txt"

cloudflare_domain = "dahlke.io"