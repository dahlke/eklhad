brew install graphviz

terraform init
terraform graph | dot -Tsvg > graph.svg

terraform plan
terraform apply