# Eklhad Web AWS Terraform Deployment

TODO: notes about using the free tier https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all

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
