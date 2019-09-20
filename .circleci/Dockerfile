FROM alpine:3.10.2

# Install Golang
ENV GO_VERSION 1.13
ADD https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz /
RUN tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
ENV PATH $PATH:/usr/local/go/bin
RUN mkdir $HOME/go

# Since the musl and glibc so are compatible, you can make this symlink and it will fix the missing dependency.
# https://stackoverflow.com/questions/34729748/installed-go-binary-not-found-in-path-on-alpine-linux-docker
RUN mkdir /lib64 && ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2

# https://github.com/golang/go/issues/27303
ENV CGO_ENABLED 0

# Install Node and Git
RUN apk add --update nodejs npm git

# Install Packer
ENV PACKER_VERSION 1.4.3
ADD https://releases.hashicorp.com/packer/${PACKER_VERSION}/packer_${PACKER_VERSION}_linux_amd64.zip /
RUN unzip /packer_${PACKER_VERSION}_linux_amd64 -d /usr/local/bin/

# Install Terraform
ENV TERRAFORM_VERSION 0.12.9
ADD https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip /
RUN unzip /terraform_${TERRAFORM_VERSION}_linux_amd64.zip -d /usr/local/bin/
