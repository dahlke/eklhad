FROM alpine:3.10.2

# Install Golang
ENV GO_VERSION 1.16
ADD https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz /
RUN tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
ENV PATH $PATH:/usr/local/go/bin
ENV GOPATH /

# Create the directory for the app on the GOPATH
RUN mkdir -p /src/github.com/dahlke/eklhad/web/
# Since the musl and glibc so are compatible, you can make this symlink and it will fix the missing dependency.
# https://stackoverflow.com/questions/34729748/installed-go-binary-not-found-in-path-on-alpine-linux-docker
RUN mkdir /lib64 && ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2

# https://github.com/golang/go/issues/27303
ENV CGO_ENABLED 0

# Install some useful tools
RUN apk add --update make git bash

# Copy the web directory in
COPY ./web/ /src/github.com/dahlke/eklhad/web/
WORKDIR /src/github.com/dahlke/eklhad/web
RUN go get

ENTRYPOINT ["go", "run", "main.go"]