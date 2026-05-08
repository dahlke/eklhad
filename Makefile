SHELL := /bin/bash
WEB_APP_NAME = eklhad-web
CWD := $(shell pwd)

WEB_APP_SRC_DIR=web/
WEB_APP_FRONTEND_BUILD_DIR=web/frontend/build/
WEB_APP_GO_BINARY_PATH=web/main
WEB_APP_CONFIG_PATH=web/config.json

DOCKER_HUB_USER=eklhad
DOCKER_WEB_IMAGE_NAME=eklhad-web
DOCKER_WEB_IMAGE_VERSION=$(shell git rev-parse --short HEAD)


##########################
# DEV SETUP
##########################
.PHONY: install-hooks
install-hooks:
	cp scripts/hooks/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "Git hooks installed."

##########################
# PHOTO HELPERS
##########################
.PHONY: generate_thumbs
generate_thumbs:
	python3 -m venv .venv && .venv/bin/pip install -q -r scripts/requirements.txt
	.venv/bin/python3 scripts/generate_thumbs.py

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
	node render-resume.js && \
	mv ${CWD}/web/frontend/conf/resume.html ${CWD}/web/frontend/public/static/resume.html

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
	test -n "$(MAPBOX_TOKEN_PROD)" || (echo "ERROR: MAPBOX_TOKEN_PROD is not set. Run: source secrets.op.sh" && exit 1)
	@git diff --quiet && git diff --cached --quiet || (echo "ERROR: Uncommitted changes detected. Commit before deploying to ensure the image matches the git tag." && exit 1)
	docker build --no-cache --platform linux/amd64 --build-arg VITE_MAPBOX_TOKEN=$(MAPBOX_TOKEN_PROD) -t ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) . && \
	docker tag ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):latest && \
	docker push ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):$(DOCKER_WEB_IMAGE_VERSION) && \
	docker push ${DOCKER_HUB_USER}/$(DOCKER_WEB_IMAGE_NAME):latest && \
	cd terraform/gcp_cloudrun && terraform init && terraform apply -auto-approve -var="docker_image_tag=$(DOCKER_WEB_IMAGE_VERSION)"

.PHONY: cloudrun_destroy
cloudrun_destroy:
	cd terraform/gcp_cloudrun && terraform destroy -auto-approve
