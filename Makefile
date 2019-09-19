SHELL := /bin/bash
# APP_NAME = eklhad
WEB_APP_NAME = eklhad-web
WEB_APP_TAR_NAME = eklhad-web.tar.gz
CWD := $(shell pwd)

PACKER_DIR=${CWD}/packer
PACKER_GCP_DEF_PATH=${PACKER_DIR}/gcp/image.json
ARTIFACT_DIR=${CWD}/artifact
ARTIFACT_DIR_LINUX=${ARTIFACT_DIR}/tar/linux
TF_GCP_APP_DIR=${CWD}/terraform/app/gcp
WEB_APP_SRC_DIR=web/

##########################
# DEV HELPERS
##########################
.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile,web/frontend/node_modules

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
.PHONY: go_get
go_get:
	cd web && go get

.PHONY: go_server_start
go_server_start:
	cd web && go run main.go

.PHONY: go_build_linux
go_build_linux:
	cd web && GOOS=linux GOARCH=amd64 go build main.go

##########################
# IMAGE BUILD HELPERS
##########################
# TODO: only include necessary files for minimum size
.PHONY: artifact_linux_web
artifact_linux_web: go_build_linux
	tar cf ${ARTIFACT_DIR_LINUX}/${WEB_APP_TAR_NAME} ${WEB_APP_SRC_DIR}

.PHONY: image_gcp
image_gcp:
	packer -machine-reeadable build ${PACKER_GCP_DEF_PATH} >> gcp_packer_build_output.txt

##########################
# CLOUD DEPLOY HELPERS
##########################
.PHONY: tf_init_gcp
tf_init_gcp:
	cd ${TF_GCP_APP_DIR} && terraform init

.PHONY: tf_plan_gcp
tf_plan_gcp: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform plan

.PHONY: tf_apply_gcp
tf_apply_gcp:
	cd ${TF_GCP_APP_DIR} && terraform apply

.PHONY: tf_out_gcp
tf_out_gcp:
	cd ${TF_GCP_APP_DIR} && terraform output -json

.PHONY: tf_destroy_gcp
tf_destroy_gcp:
	cd ${TF_GCP_APP_DIR} && terraform destroy
