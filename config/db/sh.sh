use admin;
rs.initiate(
  {
    _id: "rs0",
    members: [
      { _id : 0, host : "mongodb-rs-0.mongodb-rs.default.svc.cluster.local:27017",priority: 50 },
      { _id : 1, host : "mongodb-rs-1.mongodb-rs.default.svc.cluster.local:27017" ,priority: 60},
      { _id : 2, host : "mongodb-rs-2.mongodb-rs.default.svc.cluster.local:27017",arbiterOnly: true }
    ]
  }
)

# primary node
use admin
db.createUser({
  user: "root",
  pwd: "password", 
  roles: [{ role: "root", db: "admin" }]
})