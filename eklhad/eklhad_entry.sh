#!/bin/bash
set -e

if [[ "$1" = "eklhad" ]]; then
    echo "Preprocessing CSS..."
    /eklhad/node_modules/less/bin/lessc /eklhad/static/styles/less/index.less /eklhad/static/styles/index.css &&
	node /eklhad/node_modules/resume-cli/index.js export resume.html --format html --theme onepage
    echo "CSS processed."

    echo "Creating static resume file..."
	cd /eklhad/conf/
	node /eklhad/node_modules/resume-cli/index.js export resume.html --format html --theme onepage
	sed 's/1991-03-19/today/g' /eklhad/conf/resume.html > /eklhad/static/resume.html
    echo "Static resume file created."

    echo "Starting server"
    cd /eklhad/
    go build main.go
    ./main
    # /eklhad/eklhadd start
    echo "Server started"

    # exec tail -F /var/log/mysql/error.log
else
    exec "$@"
fi
