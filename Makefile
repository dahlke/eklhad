CONTAINER = eklhad
SHELL := /bin/bash

##########################
# DOCKER HELPERS
##########################

.PHONY: build
build:
	docker build -t ${CONTAINER} .

.PHONY: container
container: styles build
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
.PHONY: todo
todo:
	@ag "TODO" --ignore Makefile

.PHONY: npm
npm:
	cd eklhad && npm install

.PHONY: styles
styles: npm
	./eklhad/node_modules/less/bin/lessc eklhad/static/styles/less/index.less eklhad/static/styles/index.css && rm -rf eklhad/node_modules

