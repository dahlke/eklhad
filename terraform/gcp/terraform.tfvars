gcp_creds_path = "~/src/eklhad/secret/gcp-eklhad-service-account.json"

project = "eklhad-web"

region = "us-west1"

zone = "us-west1-a"

machine_type = "f1-micro"

image_id = "eklhad-web-1546841874"

ssh_user = "ubuntu"

ssh_pub_key_path = "~/.ssh/gcp/eklhad-web.pub"

ssh_private_key_path = "~/.ssh/gcp/eklhad-web"

web_binary_path = "./web/main"
