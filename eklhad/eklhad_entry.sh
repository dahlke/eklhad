#!/bin/bash
set -e

if [[ "$1" = "eklhad" ]]; then
    # Start MySQL
    service mysql start

    echo "Loading schema from /eklhad/cnf/ddl.sql"
    ls /eklhad/
    cat /eklhad/cnf/ddl.sql
    mysql < /eklhad/cnf/ddl.sql
    echo "Loading data from /eklhad/cnf/data.sql"
    cat /eklhad/cnf/data.sql
    mysql < /eklhad/cnf/data.sql
    echo "Schema loaded"

    echo "Starting server"
    go run main.go
    # /eklhad/eklhadd start
    echo "Server started"

    # exec tail -F /var/log/mysql/error.log
else
    exec "$@"
fi
