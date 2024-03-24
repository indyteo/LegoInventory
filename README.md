# LegoInventory
Lego inventory application in TypeScript, with Neo4j database, deployed in kubernetes infrastructure - E5FI - ESIEE Paris

## Installation
```shell
minikube start
alias kubectl="minikube kubectl --"
istioctl install --set profile=demo -y
```

### Building Docker images
This step is optional, just if you want to build Docker images yourself.
```shell
docker build -f api/Dockerfile -t indyteo/lego-inventory-api .
docker build -f data-provider/Dockerfile -t indyteo/lego-inventory-data-provider .
docker build -f report/Dockerfile -t indyteo/lego-inventory-report .
cd front && docker build -t indyteo/lego-inventory-front .
```

### Sending Docker images to Minikube
This step is needed if you do not want to push the Docker image you just built on a public registry.
```shell
docker image save indyteo/lego-inventory-api > api.tar
docker image save indyteo/lego-inventory-data-provider > data-provider.tar
docker image save indyteo/lego-inventory-report > report.tar
docker image save indyteo/lego-inventory-front > front.tar
minikube image load api.tar
minikube image load data-provider.tar
minikube image load report.tar
minikube image load front.tar
rm api.tar data-provider.tar report.tar front.tar
```

### Creating secrets
This step is mandatory.

#### Database
```shell
cp database/secret.yaml.example database/secret.yaml
vi database/secret.yaml
```
Set URL matching `database/service.yaml`'s name and generate a random password:
```yaml
stringData:
  url: "neo4j://lego4j:7687"
  user: "neo4j"
  pass: "YOUR-RANDOM-PASSWORD"
```

#### S3
```shell
cp s3/secret.yaml.example s3/secret.yaml
vi s3/secret.yaml
```
Set endpoint matching `s3/service.yaml`'s name and generate another random password:
```yaml
stringData:
  user: "lego-s3"
  pass: "ANOTHER-RANDOM-PASSWORD"
  endpoint: "http://s3:9000"
  region: "local"
```

### Creating local folders for volumes
This step is mandatory.
```shell
minikube ssh
sudo mkdir /var/lego4j-data
sudo mkdir /var/s3-data
```

## Create k8s resources
Note: You should wait before each step for each resource to be ready before continuing. Example: Wait for the database to be up before starting data-provider job, then wait for the job to complete before starting API.
```shell
# Create database resources
kubectl apply -f database/secret.yaml
kubectl apply -f database/volume.yaml
kubectl apply -f database/deployment.yaml
kubectl apply -f database/service.yaml

# Create S3 resources
kubectl apply -f s3/secret.yaml
kubectl apply -f s3/volume.yaml
kubectl apply -f s3/deployment.yaml
kubectl apply -f s3/service.yaml

# Create data-provider job
kubectl apply -f data-provider/job.yaml

# Optional: Start data-provider webserver to dynamically fill database
# kubectl apply -f data-provider/deployment.yaml
# kubectl apply -f data-provider/service.yaml

# Start API
kubectl apply -f api/deployment.yaml
kubectl apply -f api/service.yaml

# Start front
kubectl apply -f front/deployment.yaml
kubectl apply -f front/service.yaml

# Schedule stats reporting cronjob
kubectl apply -f report/cronjob.yaml

# Optional: Manually trigger stats reporting job
# kctl create job --from cronjob/report report-manual-trigger

# Create Istio services and gateway
kubectl apply -f services.yaml
kubectl apply -f gateway.yaml
```

## Expose Istio to localhost
Final step to be able to access the app.
```shell
kubectl -n istio-system port-forward deployment/istio-ingressgateway 31380:8080
```
Then visit <http://localhost:31380> to see the working app!

## Expose dev services to check everything work
This is only needed if you want to access Neo4j browser or MinioS3 console.
```shell
minikube service lego4j --url
minikube service s3 --url
```
