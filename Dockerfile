FROM ubuntu:16.04

MAINTAINER Neil Dahlke <neil@dahlke.io>

RUN apt-get update --fix-missing;
RUN apt-get install -y vim make curl git wget;

# Install Go 1.10
RUN wget -q https://dl.google.com/go/go1.10.linux-amd64.tar.gz
RUN tar -C /usr/local -xzf go1.10.linux-amd64.tar.gz
ENV PATH=$PATH:/usr/local/go/bin

# Set up GOPATH and Go src directory
RUN mkdir /go
ENV GOPATH /go
ENV PATH $GOPATH/bin:$PATH

ADD eklhad /eklhad/
WORKDIR /eklhad/eklhad/

COPY eklhad/eklhad_entry.sh /
ENTRYPOINT ["/eklhad_entry.sh"]
CMD ["eklhad"]