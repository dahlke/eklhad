CONTAINER = eklhad
SHELL := /bin/bash
CWD := $(shell pwd)

##########################
# DOCKER HELPERS
##########################
.PHONY: docker_build
docker_build:
	docker build -t ${CONTAINER} .

.PHONY: container
container: resume styles go_build_linux docker_build clean
	docker run \
		-d \
		-p 8080:8080 \
		--name ${CONTAINER} \
		${CONTAINER}

.PHONY: logs
logs:
	docker logs -f ${CONTAINER}

.PHONY: start
start:
	docker start ${CONTAINER}

.PHONY: stop
stop:
	docker stop ${CONTAINER}

.PHONY: clean
clean:
	- docker stop -t 1 ${CONTAINER} && \
		docker rm ${CONTAINER}

.PHONY: console
console:
	docker exec -it\
		${CONTAINER} /bin/bash

##########################
# NODE HELPERS
##########################
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
# DEV HELPERS
##########################
.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile

.PHONY: npm
npm:
	cd eklhad && npm config set strict-ssl false && npm install
