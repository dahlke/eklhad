# Use official Golang image with Go 1.23
FROM golang:1.23-alpine

# Copy the important files in
COPY ./web/frontend/build/ ./frontend/build/
COPY ./web/config.json ./config.json
COPY ./web/main ./main

ENTRYPOINT ["./main"]
