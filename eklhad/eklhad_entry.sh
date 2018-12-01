#!/bin/bash
set -e

if [[ "$1" = "eklhad" ]]; then
    echo "Starting server"
    cd /eklhad/
    go build main.go
    ./main
    # /eklhad/eklhadd start
    echo "Server started"
else
    exec "$@"
fi
