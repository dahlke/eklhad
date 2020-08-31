job "eklhad-web" {

  datacenters = ["dc1"]
  type = "service"

  group "web-service" {
    count = 1

    volume "data" {
      type = "host"
      read_only = false
      source = "eklhad-web-data"
    }

    task "web" {
      driver = "docker"

      volume_mount {
        volume      = "data"
        destination = "/go/eklhad-web/data"
      }

      config {
        image = "eklhad/eklhad-web:latest"
        args = [
          "-production"
        ]
        port_map = {
          http = 3554
        }
      }

      resources {
        network {
          mbits = 10
          port "http" {
            static = 3554
          }
        }
      }

      service {
        name = "eklhad-web"
        tags = ["global", "eklhad", "web"]
        port = "http"

        check {
          name     = "alive"
          type     = "tcp"
          interval = "10s"
          timeout  = "2s"
        }
      }
    }
  }
}