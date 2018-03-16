CONTAINER = eklhad
SHELL := /bin/bash

##########################
# DOCKER HELPERS
##########################

.PHONY: build
build:
	docker build -t ${CONTAINER} .

.PHONY: container
container: build
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
	docker stop -t 1 ${CONTAINER} && \
		docker rm ${CONTAINER}

.PHONY: console
console:
	docker exec -it\
		${CONTAINER} /bin/bash

##########################
# DEV HELPERS
##########################
.PHONY: server
server:
	go run eklhad/main.go

.PHONY: dev
dev:
	docker run \
		-d \
		-p 8080:8080 \
		--name ${CONTAINER} \
		-v ${PWD}:/eklhad \
		${CONTAINER}

.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile

.PHONY: styles
styles:
	./eklhad/node_modules/less/bin/lessc eklhad/static/styles/less/index.less eklhad/static/styles/index.css
