SHELL := /bin/bash
WEB_APP_NAME = eklhad-web
WEB_APP_TAR_NAME = eklhad-web.tar.gz
CWD := $(shell pwd)

PACKER_GCP_DEF_PATH=packer/gcp/image.pkr.hcl
PACKER_AWS_DEF_PATH=packer/aws/image.pkr.hcl
PACKER_AWS_IMAGE_CMD=`tail -n 1 /Users/neildahlke/src/github.com/dahlke/eklhad/packer/aws/output/image.txt | awk '{print $$6}' | cut -c 1-21`
PACKER_GCP_IMAGE_CMD=`tail -n 1 /Users/neildahlke/src/github.com/dahlke/eklhad/packer/gcp/output/image.txt | awk '{print $$8}'`
# TODO: AWS CIRCLECI
PACKER_GCP_CIRCLECI_IMAGE_ID=`tail -n 1 /go/src/github.com/dahlke/eklhad/packer/gcp/output/image.txt | awk '{print $$8}'`

PACKER_GCP_OUTPUT_DIR=packer/gcp/output/
PACKER_AWS_OUTPUT_DIR=packer/aws/output/
ARTIFACT_DIR_LINUX=${CWD}/artifact/tar/linux
ARTIFACT_DIR_MACOS=${CWD}/artifact/tar/macos
TF_GCP_APP_DIR=${CWD}/terraform/gcp
TF_AWS_APP_DIR=${CWD}/terraform/aws
WEB_APP_SRC_DIR=web/
WEB_APP_FRONTEND_BUILD_DIR=web/frontend/build/
WEB_APP_GO_BINARY_PATH=web/main
WEB_APP_CONFIG_PATH=web/config.json

DOCKER_HUB_USER=eklhad

DOCKER_WEB_IMAGE_NAME=eklhad-web
DOCKER_WEB_IMAGE_VERSION=0.1.1

DOCKER_TEST_IMAGE_NAME=eklhad-web-circleci
DOCKER_TEST_IMAGE_VERSION=0.1.2


##########################
# JS HELPERS
##########################
.PHONY: npm
npm:
	cd web/frontend && npm config set strict-ssl false && npm install

.PHONY: js_lint
js_lint:
	cd web/frontend/ && \
	node node_modules/eslint/bin/eslint.js src/*.js* src/**/*.js*

.PHONY: js_lint_fix
js_lint_fix:
	cd web/frontend/ && \
	node node_modules/eslint/bin/eslint.js --fix src/**/*.js*
	# node node_modules/eslint/bin/eslint.js --fix src/*.js* src/**/*.js*

.PHONY: js_lint_fix_dry
js_lint_fix_dry:
	cd web/frontend/ && \
	node node_modules/eslint/bin/eslint.js --fix-dry-run src/*.js src/**/*.js

.PHONY: resume
resume: npm
	cd web/frontend/conf/ && \
	npx resume export resume.html --format html --theme classic && \
	mv ${CWD}/web/frontend/conf/resume.html ${CWD}/web/frontend/public/static/resume.html;

.PHONY: frontend_test
frontend_test: npm resume
	cd web/frontend/ && npm run-script test-once

.PHONY: frontend_test_watch
frontend_test_watch: npm resume
	cd web/frontend/ && npm run-script test

.PHONY: frontend_start
frontend_start: npm resume
	cd web/frontend/ && npm run-script start

.PHONY: frontend_build
frontend_build: npm resume
	cd web/frontend/ && npm run-script build

.PHONY: frontend_audit_fix
frontend_audit_fix: npm
	cd web/frontend/ && npm audit fix


##########################
# GO HELPERS
##########################
.PHONY: go_lint
go_lint:
	golint web/...

.PHONY: go_get
go_get:
	cd web && go get

.PHONY: go_test
go_test:
	cd web && go test -v ./... -coverprofile=coverage.out

.PHONY: go_server_start
go_server_start:
	cd web && go run main.go

.PHONY: go_build_linux
go_build_linux:
	cd web && GOOS=linux GOARCH=amd64 go build main.go

.PHONY: go_build_macos
go_build_macos:
	cd web && GOOS=darwin GOARCH=amd64 go build main.go


##########################
# DATA COLLECTION HELPERS
##########################
.PHONY: collect_data
collect_data:
	cd web && \
	go run main.go -github && \
	go run main.go -instagram && \
	go run main.go -twitter && \
	go run main.go -gsheets;

##########################
# IMAGE BUILD HELPERS
##########################
.PHONY: artifact_linux_web
artifact_linux_web: go_build_linux
	mkdir -p ${ARTIFACT_DIR_LINUX};
	tar zcf ${ARTIFACT_DIR_LINUX}/${WEB_APP_TAR_NAME} ${WEB_APP_FRONTEND_BUILD_DIR} ${WEB_APP_GO_BINARY_PATH} ${WEB_APP_CONFIG_PATH};

.PHONY: artifact_macos_web
artifact_macos_web: go_build_macos
	mkdir -p ${ARTIFACT_DIR_MACOS};
	tar zcf ${ARTIFACT_DIR_MACOS}/${WEB_APP_TAR_NAME} ${WEB_APP_FRONTEND_BUILD_DIR} ${WEB_APP_GO_BINARY_PATH} ${WEB_APP_CONFIG_PATH};

.PHONY: image_gcp
image_gcp:
	mkdir -p ${PACKER_GCP_OUTPUT_DIR};
	packer -machine-readable build ${PACKER_GCP_DEF_PATH} >> ${PACKER_GCP_OUTPUT_DIR}image.txt;

.PHONY: image_aws
image_aws:
	mkdir -p ${PACKER_AWS_OUTPUT_DIR};
	packer -machine-readable build ${PACKER_AWS_DEF_PATH} >> ${PACKER_AWS_OUTPUT_DIR}image.txt;

###############################
# GCP / TERRAFORM DEV HELPERS
###############################
.PHONY: tf_init_gcp
tf_init_gcp:
	cd ${TF_GCP_APP_DIR} && terraform init

.PHONY: tf_plan_gcp
tf_plan_gcp: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform plan -var "gcp_image_id=$(PACKER_GCP_IMAGE_CMD)"

.PHONY: tf_apply_gcp
tf_apply_gcp: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}"

.PHONY: tf_apply_gcp_auto
tf_apply_gcp_auto: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}" -auto-approve

.PHONY: tf_apply_gcp_rotate_certs_auto
tf_apply_gcp_rotate_certs_auto: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}" -replace "acme_certificate.certificate" -auto-approve

.PHONY: tf_out_gcp
tf_out_gcp:
	cd ${TF_GCP_APP_DIR} && terraform output

.PHONY: tf_destroy_gcp
tf_destroy_gcp:
	cd ${TF_GCP_APP_DIR} && terraform destroy -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}"

.PHONY: tf_destroy_gcp_auto
tf_destroy_gcp_auto:
	cd ${TF_GCP_APP_DIR} && terraform destroy -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}" -auto-approve

###############################
# AWS / TERRAFORM DEV HELPERS
###############################
.PHONY: tf_aws_init
tf_aws_init:
	cd ${TF_AWS_APP_DIR} && terraform init

.PHONY: tf_plan_aws
tf_plan_aws: tf_aws_init
	cd ${TF_AWS_APP_DIR} && terraform plan -var "aws_image_id=$(PACKER_AWS_IMAGE_CMD)"

.PHONY: tf_apply_aws
tf_apply_aws: tf_aws_init
	cd ${TF_AWS_APP_DIR} && terraform apply -var "aws_image_id=${PACKER_AWS_IMAGE_CMD}"

.PHONY: tf_apply_aws_auto
tf_apply_aws_auto: tf_aws_init
	cd ${TF_AWS_APP_DIR} && terraform apply -var "aws_image_id=${PACKER_AWS_IMAGE_CMD}" -auto-approve

# TODO: AWS helper for CircleCI

.PHONY: tf_apply_aws_rotate_certs_auto
tf_apply_aws_rotate_certs_auto: tf_init_aws
	cd ${TF_AWS_APP_DIR} && terraform apply -var "aws_image_id=${PACKER_AWS_IMAGE_CMD}" -replace "acme_certificate.certificate" -auto-approve


.PHONY: tf_out_aws
tf_out_aws:
	cd ${TF_AWS_APP_DIR} && terraform output

.PHONY: tf_destroy_aws
tf_destroy_aws:
	cd ${TF_AWS_APP_DIR} && terraform destroy -var "aws_image_id=${PACKER_AWS_IMAGE_CMD}"

.PHONY: tf_destroy_aws_auto
tf_destroy_aws_auto:
	cd ${TF_AWS_APP_DIR} && terraform destroy -var "aws_image_id=${PACKER_AWS_IMAGE_CMD}" -auto-approve


##########################
# DOCKER HELPERS
##########################
docker_build_web:
	docker build -t ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) . && \
	docker tag ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) && \
	docker tag ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):latest

docker_push_web:
	docker push ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION)
	docker push ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):latest

docker_run_web:
	docker run \
		-it  \
		-p 3554:3554 \
		${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION)

docker_run_web_dev:
	docker run \
		-v ${CWD}/web:/web \
		-it  \
		-p 3554:3554 \
		${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION)
		# ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) -port 3000

docker_build_circleci:
	cd .circleci && \
	docker build -t ${DOCKER_HUB_USER}/$(DOCKER_TEST_IMAGE_NAME):$(DOCKER_TEST_IMAGE_VERSION) . && \
	docker tag ${DOCKER_HUB_USER}/$(DOCKER_TEST_IMAGE_NAME):$(DOCKER_TEST_IMAGE_VERSION) ${DOCKER_HUB_USER}/$(DOCKER_TEST_IMAGE_NAME):$(DOCKER_TEST_IMAGE_VERSION) && \
	docker tag ${DOCKER_HUB_USER}/$(DOCKER_TEST_IMAGE_NAME):$(DOCKER_TEST_IMAGE_VERSION) ${DOCKER_HUB_USER}/$(DOCKER_TEST_IMAGE_NAME):latest

docker_push_circleci:
	docker push ${DOCKER_HUB_USER}/$(DOCKER_TEST_IMAGE_NAME):$(DOCKER_TEST_IMAGE_VERSION)
	docker push ${DOCKER_HUB_USER}/$(DOCKER_TEST_IMAGE_NAME):latest

docker_run_circleci:
	docker run -it ${DOCKER_HUB_USER}/$(DOCKER_TEST_IMAGE_NAME):$(DOCKER_TEST_IMAGE_VERSION)
