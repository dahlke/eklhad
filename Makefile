SHELL := /bin/bash
# APP_NAME = eklhad
WEB_APP_NAME = eklhad-web
WEB_APP_TAR_NAME = eklhad-web.tar.gz
CWD := $(shell pwd)

SECRETS_DIR=${CWD}/secret
AWS_CREDENTIALS_PATH=${SECRETS_DIR}/aws-iam-neil.json

PACKER_DIR=${CWD}/packer
PACKER_AMI_DEF_PATH=${PACKER_DIR}/aws/image.json

ARTIFACT_DIR=${CWD}/artifact
ARTIFACT_DIR_LINUX=${ARTIFACT_DIR}/tar/linux
ARTIFACT_DIR_MAC=${ARTIFACT_DIR}/tar/mac

OUTPUT_DIR=${CWD}/output
OUTPUT_DIR_AWS=${OUTPUT_DIR}/aws

WEB_APP_SRC_DIR=web/

##########################
# DEV HELPERS
##########################
.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile

.PHONY: fmt_tf
fmt_tf:
	git ls-files '*.tf' | xargs -n 1 terraform fmt

.PHONY: artifact_linux_web
artifact_linux_web: 
	tar cf ${ARTIFACT_DIR_LINUX}/${WEB_APP_TAR_NAME} ${WEB_APP_SRC_DIR}

.PHONY: artifact_mac_web
artifact_mac_web: 
	tar cf ${ARTIFACT_DIR_MAC}/${WEB_APP_TAR_NAME} ${WEB_APP_SRC_DIR}

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
go_build_linux: frontend_build
	cd web && \
	GOOS=linux GOARCH=amd64 go build main.go

.PHONY: go_build_mac
go_build_mac: frontend_build
	cd web && \
	go build main.go

##########################
# IMAGE BUILD HELPERS
##########################
.PHONY: image_aws
image_aws: 
	packer build -var-file=${AWS_CREDENTIALS_PATH} ${PACKER_AMI_DEF_PATH} > ${OUTPUT_DIR_AWS}/image.txt

##########################
# CLOUD DEPLOY HELPERS
##########################
.PHONY: tf_plan_aws
tf_plan_aws: 
	cd terraform/aws && terraform init && terraform plan -var-file="${AWS_CREDENTIALS_PATH}"

.PHONY: tf_apply_aws
tf_apply_aws: 
	cd terraform/aws && terraform apply -var-file="${AWS_CREDENTIALS_PATH}"

.PHONY: tf_out_aws
tf_out_aws: 
	cd terraform/aws && terraform output

.PHONY: tf_destroy_aws
tf_destroy_aws: 
	cd terraform/aws && terraform destroy -var-file="${AWS_CREDENTIALS_PATH}"
