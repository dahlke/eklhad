job "eklhad-web-data-collectors" {
  datacenters = ["dc1"]
  type = "batch"

  periodic {
    # Run once per hour
    # cron             = "0 * * * * *"
    cron             = "@daily"
    prohibit_overlap = true
  }

  group "workers" {
    count = 1

    task "instagram" {
      driver = "docker"

      config {
        image = "eklhad/eklhad-web:latest"
        volumes = [
          "/Users/neil/src/github.com/dahlke/eklhad/web/data/:/go/eklhad-web/data/",
        ]

        args = [ "-instagram" ]
      }
    }

    task "gsheets" {
      driver = "docker"

      config {
        image = "eklhad/eklhad-web:latest"
        volumes = [
          "/Users/neil/src/github.com/dahlke/eklhad/web/data/:/go/eklhad-web/data/",
        ]

        args = [ "-gsheets" ]
      }
    }

    task "github" {
      driver = "docker"

      config {
        image = "eklhad/eklhad-web:latest"
        volumes = [
          "/Users/neil/src/github.com/dahlke/eklhad/web/data/:/go/eklhad-web/data/",
        ]

        args = [ "-github" ]
      }
    }
  }
}