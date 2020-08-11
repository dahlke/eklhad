job "eklhad-web" {

  datacenters = ["dc1"]
  type = "service"

  group "web-service" {
    count = 1

    task "web" {
      driver = "docker"

      config {
        image = "eklhad/eklhad-web:latest"

        # TODO: make this for linux specifically in another file
        volumes = [
          "/Users/neil/src/github.com/dahlke/eklhad/web/data/:/go/eklhad-web/data/",
        ]
        
        # TODO: need to make sure we route port 80 to port 3554 in some way in prod.
        port_map {
          web = 3554
        }
      }

      resources {
        network {
          mbits = 10
          port  "web"  {
              static = 3554
          }
        }
      }

      service {
        name = "eklhad-web"
        tags = ["global", "eklhad", "web"]
        port = "web"

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