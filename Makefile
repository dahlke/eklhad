CONTAINER = eklhad
SHELL := /bin/bash
CWD := $(shell pwd)

##########################
# DOCKER HELPERS
##########################

.PHONY: build
build:
	docker build -t ${CONTAINER} .

.PHONY: container
container: clean build
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

.PHONY: styles
styles: npm
	./eklhad/node_modules/less/bin/lessc eklhad/static/styles/less/index.less eklhad/static/styles/index.css && \
	rm -rf eklhad/node_modules

# Hacky hack since I don't want to patch resume-cli at the sed part.
.PHONY: resume
resume: npm
	cd eklhad/conf/ && \
	node ${CWD}/eklhad/node_modules/resume-cli/index.js export resume.html --format html --theme onepage
	sed 's/1991-03-19/today/g' ${CWD}/eklhad/conf/resume.html > ${CWD}/eklhad/static/resume.html && \
	rm ${CWD}/eklhad/conf/resume.html

##########################
# DEV HELPERS
##########################
.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile

.PHONY: npm
npm:
	cd eklhad && npm config set strict-ssl false && npm install
