# Eklhad Web GCP Terraform Deployment

Install `graphviz` to generate a graph of the deployed resources:
```
brew install graphviz
```

Initialize `terraform` and graph the deployed resources:

```
terraform init
terraform graph | dot -Tsvg > graph.svg
```

See your changes and deploy:
```
terraform plan
terraform apply
```