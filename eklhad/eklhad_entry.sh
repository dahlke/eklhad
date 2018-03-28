#!/bin/bash
set -e

if [[ "$1" = "eklhad" ]]; then
    # Start MySQL
    service mysql start

    echo "Loading schema from /eklhad/sql/ddl.sql"
    ls /eklhad/
    cat /eklhad/sql/ddl.sql
    mysql < /eklhad/sql/ddl.sql
    echo "Loading data from /eklhad/sql/data.sql"
    cat /eklhad/sql/data.sql
    mysql < /eklhad/sql/data.sql
    echo "Schema loaded"

    echo "Starting server"
    go run main.go
    # /eklhad/eklhadd start
    echo "Server started"

    # exec tail -F /var/log/mysql/error.log
else
    exec "$@"
fi
