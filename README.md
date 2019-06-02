# Eklhad

My personal, digital assets.

[TODO list](https://app.asana.com/0/1003113032464624/1003115450055924)

## Web

### Install Requirements
- `packer` is required to build an AMI for deployment via Terraform
- `terraform` is the tool we'll use to deploy our app. 
- `npm` is used to build static assets for the app.
- `go` is the server language of the app. Required for development and building for deployment.

### Development

Clone the repo

```
$ git clone
```

Install the Go development dependencies.

```
$ go get
```

sudo iptables -t nat -I OUTPUT -p tcp -d 127.0.0.1 --dport 80 -j REDIRECT --to-ports 8080
sudo iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080
   
sudo iptables -t nat -I OUTPUT -p tcp -d 127.0.0.1 --dport 443 -j REDIRECT --to-ports 8081
sudo iptables -t nat -I PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports 8081

Install the Javascript development dependencies.
```
$ npm start
```


### Deployment

#### AWS Quick Deploy

Build the React Frontend, the Go web server, a tarball app artifact, then the AMI.

```
make frontend_build 
make artifact_linux_web 
make image_aws
```

Before proceeding, make sure you set the desired AMI in the tfvars file.

```
make tf_plan_aws
make tf_apply_aws
```

# Install Golang

_https://github.com/golang/go/wiki/Ubuntu_

```
wget https://dl.google.com/go/go1.12.4.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.12.4.linux-amd64.tar.gz
echo "export PATH=$PATH:/usr/local/go/bin" >> ~/.profile
echo "export GOPATH=/home/ubuntu/" >> ~/.profile
source ~/.profile
```


terraform import tfe_workspace.aws-eklhad-web eklhad/aws-eklhad-web