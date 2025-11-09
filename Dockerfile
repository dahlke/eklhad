# Multi-stage build for optimized image size

# Stage 1: Build the Go application
FROM golang:1.25-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /build

# Copy go mod files
COPY web/go.mod web/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY web/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o main .

# Stage 2: Create minimal runtime image
FROM alpine:latest

# Install CA certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

# Copy built binary from builder stage
COPY --from=builder /build/main .

# Copy frontend build and config
COPY --from=builder /build/frontend/build/ ./frontend/build/
COPY --from=builder /build/config.json ./config.json

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3554

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3554/health || exit 1

ENTRYPOINT ["./main"]
