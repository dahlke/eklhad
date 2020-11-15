# MemSQL, Tableau, and the Democratization of Data

_Originally published on the [MemSQL Blog](http://blog.memsql.com/memsql-tableau-and-the-democratization-of-data/)._

_[We love fast databases. It makes the experience of interacting with your database that much more enjoyable.” – Tableau](https://www.tableau.com/about/blog/2016/8/tableau-10-includes-even-more-data-source-options-57505)_

Today’s business decisions are about seconds, not minutes. To accommodate this trend, businesses have moved to evidence-backed decision making and widespread data access. Modern business intelligence tools abound, making it easier for the average analyst to create compelling visualizations. In this post, I’ll address how this new mode of thinking about data, the Democratization of Data, comes with two challenges – making data easily available and making it actionable in real time.

---

## Making Data Available

Companies are migrating to a new model of data distribution – shared access to a centralized database with both historical data and real-time data. This is a far cry from the traditional approach of using many small database instances with stale data, isolated silos, and limited user access. Now, raw data is available to everyone. Employees are empowered to dive into the data, discover new opportunities, or close efficiency gaps in a way that has never been done before. The need for data now coupled with scalability has attracted many developers to in-memory, clustered databases.

## Making Data Actionable in Real Time

Innovations in data visualization have produced powerful, usable tools that afford companies the opportunity to be data-driven. One tool we see embedded across different industries is Tableau. With its mature ecosystem and rich featureset, the business intelligence platform makes it easy for individuals to create compelling, interactive data visualizations. It is a very attractive package for different business levels because it does not require expertise or a degree in visual design or information systems. Any user can create meaningful, actionable dashboards providing views of the business from thirty thousand feet as well as at ground level.

But even with a Tableau license in hand, users still face issues – the dashboards are slow or the data is stale. The problem often lies in the database layer. It is imperative that data is up-to-date to be relevant to today’s fast moving business operations. Common issues include:

![Long Query Time](https://storage.googleapis.com/eklhad-web-public/images/query-time.gif)

- No access to real-time, limited to batch loads
- Slow query execution
- Concurrency limitations
- Siloed data
- Limited hardware choices / technical debt accumulation

MemSQL and Tableau have collaborated to provide the best possible business intelligence solution on the market, making great strides to address the aforementioned challenges. In August, Tableau announced the named [MemSQL Connector](https://help.tableau.com/current/pro/desktop/en-us/examples_memsql.htm), available in Tableau 10, for native integration between the two platforms.

At Tableau Conference 2016, MemSQL showcases MemSQL Springs, a real-time showcase application for resort demographic analysis. The story is simple. When a team of executives gathers in a room and ends up staring at a loading spinner, the company bleeds money. You do not have multiple minutes to wait for your dashboards to update each and every time you want to ask your data a question.

![MemSQL Springs](https://storage.googleapis.com/eklhad-web-public/images/memsql-springs.gif)

And yet this is an issue that many organizations still face. Slow dashboards are a roadblock to becoming data-driven. Your business needs instant results.

By combining MemSQL and Tableau, users have reduced query latency from many minutes to a few seconds. This puts time back on the clock and dollars back in businesses’ pockets.
