# [2015-06-17] How Pinterest Measures Real-Time User Engagement with Spark
_Originally published on the [MemSQL Blog](http://blog.memsql.com/pinterest-apache-spark-use-case/)._

![Spark Demo Animated](https://storage.googleapis.com/eklhad-web-images-public/spark-demo-animated.gif)

### Setting the Stage for Spark

With Spark [on track to replace MapReduce](https://www.lightbend.com/company/news/survey-indicates-apache-spark-gaining-developer-adoption-as-big-datas-projects-require-processing-speed), enterprises are flocking to the open source framework in effort to take advantage of its superior distributed data processing power.

IT leads that manage infrastructure and data pipelines of high-traffic websites are running Spark–in particular, Spark Streaming which is ideal for structuring real-time data on the fly–to reliably capture and process event data, and write it in a format that can immediately be queried by analysts.

As the world’s premiere visual bookmarking tool, Pinterest is one of the innovative organizations taking advantage of Spark. Pinterest found a natural fit in [MemSQL](https://www.memsql.com/)’s in-memory database and Spark Streaming, and is using these tools to find patterns in high-value user engagement data.

### Pinterest’s Spark Streaming Setup
##### Here’s how it works:

- Pinterest pushes event data, such as pins and repins, to Apache Kafka.
- Spark Streaming ingests event data from Apache Kafka, then filters by event type and enriches each event with full pin and geo-location data.
- Using the [MemSQL Spark Connector](https://www.memsql.com/blog/operationalizing-spark-with-memsql/), data is then written to MemSQL with each event type flowing into a separate table. MemSQL handles record deduplication (Kafka’s “at least once” semantics guarantee fault tolerance but not uniqueness).
- As data is streaming in, Pinterest is able to run queries in MemSQL to generate engagement metrics and report on various event data like pins, repins, comments and logins.

### Visualizing the Data
We built a demo with Pinterest to showcase the locations of repins as they happen. When an image is repinned, circles on the globe expand, providing a visual representation of the concentration of repins by location.

![Spark Demo Static](https://storage.googleapis.com/eklhad-web-images-public/spark-demo-static.gif)

The demo also leverages Spark to enrich streaming data with geolocation information between the time that it arrives and when it hits the database. MemSQL adds to this enrichment process by serving as a key/value cache for data that has already been processed and can be reused for future repins. Additionally, as part of the enrichment process, any repin that enters the system is looked up against MemSQL, and is saved to MemSQL if the full pin is missing. All full pins that come in through the stream are saved automatically to avoid this lookup.

### So, What’s the Point?
This infrastructure gives Pinterest the ability to identify (and react to) developing trends as they happen. In turn, Pinterest and their partners can get a better understanding of user behavior and provide more value to the Pinner community. Because everything SQL based, access to data is more widespread. Engineers and analyst can work with familiar tools to run queries and track high-value user activity such as repins.

It also should be noted that this Spark initiative is just the beginning for Pinterest. As the Spark framework evolves and the community continues to grow, Pinterest expects to expand use cases for MemSQL and Spark.

### Initial Results

After integrating Spark Streaming and MemSQL, running on AWS, into their data stack, Pinterest now has a source of record for sharing relevant user engagement data and metrics their data analyst and with key brands.

With MemSQL and Spark, Pinterest has found a method for repeatable, production-ready streaming and is able to go from pipe dump to graph in real time.