name = "eklhad-web"

region = "us-west-2"

availability_zone = "us-west-2b"

instance_type = "t2.micro"

ami_id = "ami-0499f4a98d4535fd6"

vpc_cidr_block = "10.0.0.0/16"

subnet_cidr_block = "10.0.0.0/24"

ssh_user = "ubuntu"

ssh_key_name = "eklhad-web-aws"

ssh_private_key_path = "~/.ssh/aws/eklhad-web-aws.pem"

web_binary_path = "./eklhad/main"