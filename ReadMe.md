# Install MongoDB
1. `cd` to `/config/db/` directory
2. use command `kubectl apply -f filename` to create object
    - db-storageclass.yaml
    - db-configMap.yaml
    - db-secret.yaml
    - db-service.yaml
    - db-statefulSets.yaml
3. run command to create MongoDB Replications
    - `kubectl exec -it mongodb-rs-0 -- mongo`
    - `use admin`
    - ```
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
    
    ```
4. find the primary node and create user `root`
    - `kubectl exec -it mongodb-rs-0 -- mongo`
    - `use admin`
    - ```
    db.createUser({
        user: "root",
        pwd: "password", 
        roles: [{ role: "root", db: "admin" }]
    })
    ```

# Install chat-app
1. `cd` to `/config/chat-app/` directory
2. use command `kubectl apply -f filename` to create object
    - 01-configMap.yaml
    - 01-secret.yaml
    - 02-https-ingress.yaml
    - 02-service.yaml
    - 03_serviceAccount.yaml
    - 04_hpa.yaml
    - 05_deployment.yaml
    - 06_rolebinding.yaml
3. set hosts for ingress
    - `kubectl get ingress -o wide`
    - `sudo gedit /etc/hosts`
    - add `IP domain`
4. access the service by `https://domain`