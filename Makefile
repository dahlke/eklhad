SHELL := /bin/bash
# APP_NAME = eklhad
WEB_APP_NAME = eklhad-web
WEB_APP_TAR_NAME = eklhad-web.tar.gz
CWD := $(shell pwd)

SECRETS_DIR=${CWD}/secret

PACKER_DIR=${CWD}/packer
PACKER_AMI_DEF_PATH=${PACKER_DIR}/aws/image.json

ARTIFACT_DIR=${CWD}/artifact
ARTIFACT_DIR_LINUX=${ARTIFACT_DIR}/tar/linux

TF_AWS_APP_DIR=${CWD}/terraform/app/aws

WEB_APP_SRC_DIR=web/

##########################
# DEV HELPERS
##########################
.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile

# TODO: only include necessary files for minimum size
.PHONY: artifact_linux_web
artifact_linux_web: go_build_linux
	tar cf ${ARTIFACT_DIR_LINUX}/${WEB_APP_TAR_NAME} ${WEB_APP_SRC_DIR}

##########################
# WEB HELPERS
##########################
.PHONY: npm
npm:
	cd web/frontend && npm config set strict-ssl false && npm install

# Hacky hack since I don't want to patch resume-cli at the sed part.
.PHONY: resume
resume: npm
	cd web/frontend/conf/ && \
	node ${CWD}/web/frontend/node_modules/resume-cli/index.js export resume.html --format html --theme onepage
	sed 's/1991-03-19/today/g' ${CWD}/web/frontend/conf/resume.html > ${CWD}/web/frontend/public/resume.html && \
	rm ${CWD}/web/frontend/conf/resume.html

.PHONY: frontend_test
frontend_test: npm resume
	cd web/frontend/ && npm run-script test

.PHONY: frontend_start
frontend_start: npm resume
	cd web/frontend/ && npm run-script start

.PHONY: frontend_build
frontend_build: npm resume
	cd web/frontend/ && npm run-script build

##########################
# GO HELPERS
##########################
.PHONY: go_build_linux
go_build_linux: 
	cd web && GOOS=linux GOARCH=amd64 go build main.go

##########################
# IMAGE BUILD HELPERS
##########################
.PHONY: image_aws
image_aws: 
	packer build ${PACKER_AMI_DEF_PATH} 

##########################
# CLOUD DEPLOY HELPERS
##########################
.PHONY: tf_init_aws
tf_init_aws: 
	cd ${TF_AWS_APP_DIR} && terraform init

.PHONY: tf_plan_aws
tf_plan_aws: tf_init_aws
	cd ${TF_AWS_APP_DIR} && terraform plan

.PHONY: tf_apply_aws
tf_apply_aws: 
	cd ${TF_AWS_APP_DIR} && terraform apply

.PHONY: tf_out_aws
tf_out_aws: 
	cd ${TF_AWS_APP_DIR} && terraform output -json

.PHONY: tf_destroy_aws
tf_destroy_aws: 
	cd ${TF_AWS_APP_DIR} && terraform destroy
