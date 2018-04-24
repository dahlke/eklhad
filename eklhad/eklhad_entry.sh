#!/bin/bash
set -e

if [[ "$1" = "eklhad" ]]; then
    # Start MySQL
    service mysql start

    echo "Loading schema from /eklhad/conf/ddl.sql"
    ls /eklhad/
    cat /eklhad/conf/ddl.sql
    mysql < /eklhad/conf/ddl.sql
    echo "Loading data from /eklhad/conf/data.sql"
    cat /eklhad/conf/data.sql
    mysql < /eklhad/conf/data.sql
    echo "Schema loaded"

    echo "Starting server"
    go run main.go
    # /eklhad/eklhadd start
    echo "Server started"

    # exec tail -F /var/log/mysql/error.log
else
    exec "$@"
fi
