SHELL := /bin/bash
WEB_APP_NAME = eklhad-web
WEB_APP_TAR_NAME = eklhad-web.tar.gz
CWD := $(shell pwd)

PACKER_GCP_DEF_PATH=packer/gcp/image.json
PACKER_IMAGE_CMD=`tail -n 1 /Users/neil/src/github.com/dahlke/eklhad/packer/gcp/output/image.txt | awk '{print $$8}'`
PACKER_CIRCLECI_IMAGE_CMD=`tail -n 1 /go/src/github.com/dahlke/eklhad/packer/gcp/output/image.txt | awk '{print $$8}'`

PACKER_BUILD_OUTPUT_DIR=packer/gcp/output/
ARTIFACT_DIR_LINUX=${CWD}/artifact/tar/linux
TF_GCP_APP_DIR=${CWD}/terraform/gcp
WEB_APP_SRC_DIR=web/

DOCKER_HUB_USER=eklhad

DOCKER_WEB_IMAGE_NAME=eklhad-web
DOCKER_WEB_IMAGE_VERSION=0.1.0

DOCKER_TEST_IMAGE_NAME=eklhad-web-circleci
DOCKER_TEST_IMAGE_VERSION=0.1.1


##########################
# JS HELPERS
##########################
.PHONY: npm
npm:
	cd web/frontend && npm config set strict-ssl false && npm install

.PHONY: js_lint
js_lint:
	cd web/frontend/ && \
	prettier --write src/

# Hacky hack since I don't want to patch resume-cli at the sed part.
.PHONY: resume
resume: npm
	cd web/frontend/conf/ && \
	node ${CWD}/web/frontend/node_modules/resume-cli/index.js export resume.html --format html --theme onepage
	sed 's/1991-03-19/today/g' ${CWD}/web/frontend/conf/resume.html > ${CWD}/web/frontend/public/static/resume.html && \
	rm ${CWD}/web/frontend/conf/resume.html

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
	cd web/frontend/ && npm run-script build && rm -rf node_modules

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


##########################
# DATA COLLECTION HELPERS
##########################
.PHONY: collect_data
collect_data:
	cd web && \
	go run main.go -instagram && \
	go run main.go -github && \
	go run main.go -gsheets;

##########################
# IMAGE BUILD HELPERS
##########################
# TODO: only include necessary files for minimum size
.PHONY: artifact_linux_web
artifact_linux_web: go_build_linux
	mkdir -p ${ARTIFACT_DIR_LINUX};
	tar cf ${ARTIFACT_DIR_LINUX}/${WEB_APP_TAR_NAME} ${WEB_APP_SRC_DIR};

.PHONY: image_gcp
image_gcp:
	mkdir -p ${PACKER_BUILD_OUTPUT_DIR};
	packer -machine-readable build ${PACKER_GCP_DEF_PATH} >> ${PACKER_BUILD_OUTPUT_DIR}image.txt;

###############################
# GCP / TERRAFORM DEV HELPERS
###############################
.PHONY: tf_init_gcp
tf_init_gcp:
	cd ${TF_GCP_APP_DIR} && terraform init

.PHONY: tf_plan_gcp
tf_plan_gcp: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform plan -var "image_id=$(PACKER_IMAGE_CMD)"

.PHONY: tf_apply_gcp
tf_apply_gcp: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "image_id=${PACKER_IMAGE_CMD}"

.PHONY: tf_apply_gcp_auto
tf_apply_gcp_auto: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "image_id=${PACKER_IMAGE_CMD}" -auto-approve

.PHONY: tf_circleci_plan_gcp
tf_circleci_plan_gcp: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform plan -var "image_id=$(PACKER_CIRCLECI_IMAGE_CMD)"

.PHONY: tf_circleci_apply_gcp_auto
tf_circleci_apply_gcp_auto: tf_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "image_id=${PACKER_CIRCLECI_IMAGE_CMD}" -auto-approve

.PHONY: tf_out_gcp
tf_out_gcp:
	cd ${TF_GCP_APP_DIR} && terraform output -json

.PHONY: tf_destroy_gcp
tf_destroy_gcp:
	cd ${TF_GCP_APP_DIR} && terraform destroy


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