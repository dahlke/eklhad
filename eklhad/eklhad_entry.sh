#!/bin/bash
set -e

if [[ "$1" = "eklhad" ]]; then
    echo "Starting server"
    cd /eklhad/
    ./main
    echo "Server started"
else
    exec "$@"
fi
