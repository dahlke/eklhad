SHELL := /bin/bash
# APP_NAME = eklhad
WEB_APP_NAME = eklhad-web
WEB_APP_TAR_NAME = eklhad-web.tar.gz
CWD := $(shell pwd)

SECRETS_DIR=${CWD}/secret
AWS_CREDENTIALS_PATH=${SECRETS_DIR}/aws-iam-neil.json

PACKER_DIR=${CWD}/packer
PACKER_AMI_DEF_PATH=${PACKER_DIR}/aws/image.json
PACKER_GCI_DEF_PATH=${PACKER_DIR}/gcp/image.json

ARTIFACT_DIR=${CWD}/artifact
ARTIFACT_DIR_LINUX=${ARTIFACT_DIR}/tar/linux
ARTIFACT_DIR_MAC=${ARTIFACT_DIR}/tar/mac

OUTPUT_DIR=${CWD}/output
OUTPUT_DIR_AWS=${OUTPUT_DIR}/aws
OUTPUT_DIR_GCP=${OUTPUT_DIR}/gcp


WEB_APP_SRC_DIR=web/

##########################
# DEV HELPERS
##########################
.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile

.PHONY: clean_repo
clean_repo:
	rm -rf web/node_modules

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
# IMAGE BUILD HELPERS
##########################
.PHONY: image_aws
image_aws: 
	packer build -var-file=${AWS_CREDENTIALS_PATH} ${PACKER_AMI_DEF_PATH} > ${OUTPUT_DIR_AWS}/image.txt

.PHONY: image_gcp
image_gcp: 
	packer build ${PACKER_GCI_DEF_PATH} > ${OUTPUT_DIR_GCP}/image.txt

##########################
# CLOUD DEPLOY HELPERS
##########################
.PHONY: tf_plan_gcp
tf_plan_gcp: 
	cd terraform/gcp && terraform init && terraform plan

.PHONY: tf_apply_gcp
tf_apply_gcp: 
	cd terraform/gcp && terraform apply

.PHONY: tf_out_gcp
tf_out_gcp: 
	cd terraform/gcp && terraform output

.PHONY: tf_destroy_gcp
tf_destroy_gcp: 
	cd terraform/gcp && terraform destroy

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

##########################
# GO HELPERS
##########################
.PHONY: go_build_linux
go_build_linux:
	cd web && \
	GOOS=linux GOARCH=amd64 go build main.go

.PHONY: go_build_mac
go_build_mac:
	cd web && \
	go build main.go

##########################
# WEB HELPERS
##########################
.PHONY: npm
npm:
	cd web && npm config set strict-ssl false && npm install

.PHONY: styles
styles: npm
	./web/node_modules/less/bin/lessc web/static/styles/less/index.less web/static/styles/index.css

# Hacky hack since I don't want to patch resume-cli at the sed part.
.PHONY: resume
resume: npm
	cd web/conf/ && \
	node ${CWD}/web/node_modules/resume-cli/index.js export resume.html --format html --theme onepage
	sed 's/1991-03-19/today/g' ${CWD}/web/conf/resume.html > ${CWD}/web/static/resume.html && \
	rm ${CWD}/web/conf/resume.html

.PHONY: frontend
frontend: npm resume styles