FROM ubuntu:16.04

MAINTAINER Neil Dahlke <neil@dahlke.io>

RUN apt-get update --fix-missing;
RUN apt-get install -y vim make curl git wget;

ADD eklhad /eklhad/

COPY eklhad/eklhad_entry.sh /
ENTRYPOINT ["/eklhad_entry.sh"]
CMD ["eklhad"]
