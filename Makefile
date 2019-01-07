SHELL := /bin/bash
APP_NAME = eklhad
CWD := $(shell pwd)

AWS_CREDENTIALS_PATH=secrets/aws_iam_neil.json
PACKER_AMI_DEF_PATH=packer/aws/image.json
PACKER_GCI_DEF_PATH=packer/gcp/image.json

##########################
# DEV HELPERS
##########################
.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile

.PHONY: clean_repo
clean_repo:
	rm -rf eklhad/node_modules

##########################
# CLOUD IMAGE HELPERS
##########################
.PHONY: tar_app
tar_app: resume styles go_build_linux clean_repo
	tar cf ${APP_NAME}.tar.gz eklhad/

.PHONY: pack_ami
pack_ami: 
	packer build -var-file=${AWS_CREDENTIALS_PATH} ${PACKER_AMI_DEF_PATH}

.PHONY: pack_ami_full
pack_ami_full: tar_app pack_ami;

.PHONY: pack_gci
pack_gci: 
	packer build ${PACKER_GCI_DEF_PATH}

##########################
# CLOUD DEPLOY HELPERS
##########################

.PHONY: deploy_gcp
deploy_gcp: 
	cd terraform/gcp && terraform apply

##########################
# GO HELPERS
##########################
.PHONY: go_build_linux
go_build_linux:
	cd eklhad && \
	GOOS=linux GOARCH=amd64 go build main.go

.PHONY: go_build_mac
go_build_mac:
	cd eklhad && \
	go build main.go

##########################
# NODE HELPERS
##########################
.PHONY: npm
npm:
	cd eklhad && npm config set strict-ssl false && npm install
.PHONY: styles
styles: npm
	./eklhad/node_modules/less/bin/lessc eklhad/static/styles/less/index.less eklhad/static/styles/index.css

# Hacky hack since I don't want to patch resume-cli at the sed part.
.PHONY: resume
resume: npm
	cd eklhad/conf/ && \
	node ${CWD}/eklhad/node_modules/resume-cli/index.js export resume.html --format html --theme onepage
	sed 's/1991-03-19/today/g' ${CWD}/eklhad/conf/resume.html > ${CWD}/eklhad/static/resume.html && \
	rm ${CWD}/eklhad/conf/resume.html