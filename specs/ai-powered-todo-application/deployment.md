# Deployment Configuration: AI-Powered Todo Application

## Phase IV - Local Deployment with Docker and Kubernetes

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  database:
    image: postgres:15
    container_name: todo-db
    environment:
      POSTGRES_DB: todo_app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - todo-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: todo-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@database:5432/todo_app
      - SECRET_KEY=your-super-secret-key
    depends_on:
      - database
    networks:
      - todo-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: todo-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - todo-network

  ai-services:
    build:
      context: ./ai-services
      dockerfile: Dockerfile
    container_name: todo-ai
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - BACKEND_URL=http://backend:8000
    depends_on:
      - backend
    networks:
      - todo-network

volumes:
  postgres_data:

networks:
  todo-network:
    driver: bridge
```

### Kubernetes Deployment Configuration

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: todo-app
```

```yaml
# k8s/database/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: todo-app
  labels:
    app: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: todo_app
            - name: POSTGRES_USER
              value: postgres
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-storage
          persistentVolumeClaim:
            claimName: postgres-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: todo-app
spec:
  selector:
    app: postgres
  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432
  type: ClusterIP
```

```yaml
# k8s/backend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: todo-app
  labels:
    app: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: todo-backend:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: connection-string
            - name: SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: app-secret
                  key: secret-key
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: todo-app
spec:
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: backend-ingress
  namespace: todo-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: api.todo.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
```

### Helm Chart Configuration

```yaml
# helm/Chart.yaml
apiVersion: v2
name: ai-todo-app
description: A Helm chart for AI-Powered Todo Application
type: application
version: 0.1.0
appVersion: "1.0.0"
```

```yaml
# helm/values.yaml
# Default values for ai-todo-app
# This is a YAML-formatted file.
# Declare variables to be passed into your templates.

replicaCount: 1

image:
  repository: todo-app
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: ""

backend:
  image:
    repository: todo-backend
    pullPolicy: IfNotPresent
    tag: latest
  service:
    type: ClusterIP
    port: 8000
  replicaCount: 2

frontend:
  image:
    repository: todo-frontend
    pullPolicy: IfNotPresent
    tag: latest
  service:
    type: ClusterIP
    port: 3000
  replicaCount: 2

database:
  image:
    repository: postgres
    tag: "15"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 5432
  postgresql:
    postgresqlDatabase: todo_app
    postgresqlUsername: postgres
    existingSecret: db-secret

aiServices:
  image:
    repository: todo-ai
    pullPolicy: IfNotPresent
    tag: latest
  replicaCount: 1

ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  hosts:
    - host: todo.local
      paths:
        - path: /
          pathType: Prefix
  tls: []
```

## Phase V - Cloud Deployment Configuration

### DigitalOcean/GCP Infrastructure as Code

```hcl
# cloud/digitalocean/terraform/main.tf
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

# Configure the DigitalOcean Provider
provider "digitalocean" {
  token = var.do_token
}

# Create a Kubernetes cluster
resource "digitalocean_kubernetes_cluster" "todo_cluster" {
  name   = "todo-app-cluster"
  region = var.cluster_region
  version = var.kubernetes_version

  node_pool {
    name       = "default-pool"
    size       = var.node_size
    node_count = var.node_count
  }
}

# Create a database cluster
resource "digitalocean_database_cluster" "todo_db" {
  name       = "todo-db-cluster"
  engine     = "pg"
  version    = "15"
  size       = var.db_size
  region     = var.cluster_region
  node_count = 1
}

# Create a load balancer for the application
resource "digitalocean_loadbalancer" "todo_lb" {
  name   = "todo-app-lb"
  region = var.cluster_region

  forwarding_rule {
    entry_port      = 80
    entry_protocol  = "http"
    target_port     = 80
    target_protocol = "http"
  }

  droplet_pool {
    name = digitalocean_kubernetes_cluster.todo_cluster.id
  }
}
```

```hcl
# cloud/digitalocean/terraform/variables.tf
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "cluster_region" {
  description = "Region for the Kubernetes cluster"
  type        = string
  default     = "nyc1"
}

variable "kubernetes_version" {
  description = "Kubernetes version to use"
  type        = string
  default     = "latest"
}

variable "node_size" {
  description = "Size of the nodes in the cluster"
  type        = string
  default     = "s-2vcpu-2gb"
}

variable "node_count" {
  description = "Number of nodes in the cluster"
  type        = string
  default     = 3
}

variable "db_size" {
  description = "Size of the database cluster"
  type        = string
  default     = "db-s-1vcpu-1gb"
}
```

### Kafka Configuration for Event Streaming

```yaml
# cloud/kafka/docker-compose.yml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
    depends_on:
      - kafka
```

### Dapr Configuration

```yaml
# cloud/dapr/components/statestore.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.redis
  version: v1
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: ""
```

```yaml
# cloud/dapr/components/pubsub.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub
spec:
  type: pubsub.redis
  version: v1
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: ""
```

```yaml
# cloud/dapr/config/config.yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: dapr-config
spec:
  tracing:
    samplingRate: "1"
    zipkin:
      endpointAddress: "http://zipkin.default.svc.cluster.local:9411/api/v2/spans"
  metric:
    enabled: true
  features:
    - name: AppHealthCheck
      enabled: true
```