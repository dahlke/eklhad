SHELL := /bin/bash
WEB_APP_NAME = eklhad-web
CWD := $(shell pwd)

WEB_APP_SRC_DIR=web/
WEB_APP_FRONTEND_BUILD_DIR=web/frontend/build/
WEB_APP_GO_BINARY_PATH=web/main
WEB_APP_CONFIG_PATH=web/config.json

DOCKER_HUB_USER=eklhad
DOCKER_WEB_IMAGE_NAME=eklhad-web
DOCKER_WEB_IMAGE_VERSION=0.1.2


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
 frontend_test: npm
	 cd web/frontend/ && npm run test

.PHONY: frontend_test_coverage
frontend_test_coverage: npm
	cd web/frontend/ && npm run test:coverage

.PHONY: frontend_test_watch
frontend_test_watch: npm
	cd web/frontend/ && npm run test:watch

.PHONY: frontend_run
frontend_run: npm
	cd web/frontend/ && npm run dev

.PHONY: frontend_build
frontend_build: npm
	@if [ ! -f "web/frontend/public/static/resume.html" ]; then \
		echo "Error: resume.html not found. Please run 'make resume' first."; \
		exit 1; \
	fi
	PUBLIC_URL=/static cd web/frontend/ && npm run build

##########################
# GO HELPERS
##########################
.PHONY: go_lint
go_lint:
	golint web/...

.PHONY: go_get
go_get:
	cd web && go get -u && go mod tidy

.PHONY: go_test
go_test:
	cd web && go test -v ./... -coverprofile=coverage.out

.PHONY: go_server_run
go_server_run:
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
	cd web && go run main.go -gsheets;

##########################
# DOCKER HELPERS
##########################
docker_build_web:
	docker build --platform linux/amd64 -t ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) . && \
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

##########################
# CLOUD RUN HELPERS
##########################
.PHONY: cloudrun_init
cloudrun_init:
	cd terraform/gcp_cloudrun && terraform init

.PHONY: cloudrun_plan
cloudrun_plan: cloudrun_init
	cd terraform/gcp_cloudrun && terraform plan

.PHONY: cloudrun_deploy
cloudrun_deploy:
	@echo "Building and pushing Docker image with tag: $(DOCKER_WEB_IMAGE_VERSION)"; \
	docker build --platform linux/amd64 -t ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) . && \
	docker tag ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):latest && \
	docker push ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) && \
	docker push ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):latest && \
	cd terraform/gcp_cloudrun && terraform init && terraform apply -auto-approve -var="docker_image_tag=$(DOCKER_WEB_IMAGE_VERSION)"

.PHONY: cloudrun_destroy
cloudrun_destroy:
	cd terraform/gcp_cloudrun && terraform destroy -auto-approve

##########################
# DEPRECATED: VM-BASED DEPLOYMENT
# The following commands are for the deprecated VM-based deployment.
# Use Cloud Run deployment commands above instead.
##########################

# DEPRECATED: VM-related variables
WEB_APP_TAR_NAME = eklhad-web.tar.gz
PACKER_GCP_DEF_PATH=packer/gcp/image.pkr.hcl
PACKER_GCP_IMAGE_CMD=`tail -n 1 /Users/neil/src/github.com/dahlke/eklhad/packer/gcp/output/image.txt | awk '{print $$12}'`
PACKER_GCP_OUTPUT_DIR=packer/gcp/output/
ARTIFACT_DIR_LINUX=${CWD}/artifact/tar/linux
ARTIFACT_DIR_MACOS=${CWD}/artifact/tar/macos
TF_GCP_APP_DIR=${CWD}/terraform/gcp

##########################
# DEPRECATED: IMAGE BUILD HELPERS (VM)
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

###############################
# DEPRECATED: GCP / TERRAFORM DEV HELPERS (VM)
###############################
.PHONY: vm_init_gcp
vm_init_gcp:
	cd ${TF_GCP_APP_DIR} && terraform init

.PHONY: vm_plan_gcp
vm_plan_gcp: vm_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform plan -var "gcp_image_id=$(PACKER_GCP_IMAGE_CMD)"

.PHONY: vm_apply_gcp
vm_apply_gcp: vm_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}"

.PHONY: vm_apply_gcp_auto
vm_apply_gcp_auto: vm_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}" -auto-approve

.PHONY: vm_apply_gcp_rotate_certs_auto
vm_apply_gcp_rotate_certs_auto: vm_init_gcp
	cd ${TF_GCP_APP_DIR} && terraform apply -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}" -replace "acme_certificate.certificate" -auto-approve

.PHONY: vm_out_gcp
vm_out_gcp:
	cd ${TF_GCP_APP_DIR} && terraform output

.PHONY: vm_destroy_gcp
vm_destroy_gcp:
	cd ${TF_GCP_APP_DIR} && terraform destroy -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}"

.PHONY: vm_destroy_gcp_auto
vm_destroy_gcp_auto:
	cd ${TF_GCP_APP_DIR} && terraform destroy -var "gcp_image_id=${PACKER_GCP_IMAGE_CMD}" -auto-approve
