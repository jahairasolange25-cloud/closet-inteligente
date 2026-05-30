# Scaling

## Overview
The scaling strategy for Closet Inteligente Digital covers horizontal and vertical scaling approaches for all platform components. The architecture is designed to handle growth from 1,000 to 1,000,000+ active users while maintaining performance and reliability.

---

## Scaling Philosophy

| Principle | Description |
|-----------|-------------|
| Horizontal first | Prefer adding more instances over bigger instances |
| Stateless services | Services designed to be horizontally scalable |
| Queue-based load leveling | AI pipeline uses queues to handle burst traffic |
| Caching first | Reduce load on downstream services with aggressive caching |
| Database as bottleneck | Design for database efficiency, use read replicas |
| Graceful degradation | Non-critical features degrade under load, core features stay up |
| Predictable scaling | Auto-scaling based on leading indicators (not lagging) |

---

## Horizontal Scaling Strategy

### Services Architecture

```
[CDN / Edge Network] (Vercel, global)
         |
[API Gateway] (NestJS, horizontally scaled)
    |        |        |        |
[Service A] [Service B] [Service C] [AI Pipeline]
    |        |        |        |
    +--------+--------+--------+
                |
         [Load Balancer]
                |
    +-----------+-----------+
    |           |           |
[PostgreSQL] [Redis]   [External APIs]
  (Primary)   (Cluster)
    |
[Read Replicas (x2-5)]
```

### Horizontal Scaling Parameters

| Service | Stateless | Auto-scaling | Min | Max | Scaling Metric |
|---------|-----------|-------------|-----|-----|----------------|
| API Gateway (NestJS) | Yes | Yes | 2 | 20 | CPU > 70%, Latency > 300ms |
| User Service | Yes | Yes | 2 | 10 | CPU > 70%, Requests > 1000/s |
| Garment Service | Yes | Yes | 2 | 15 | CPU > 70%, Requests > 500/s |
| Outfit Service | Yes | Yes | 2 | 10 | CPU > 70% |
| Storage Service | Yes | Yes | 2 | 10 | Queue depth > 100 |
| Real-time Service (WS) | Yes (Redis adapter) | Yes | 2 | 20 | Connections > 1000/instance |
| AI Pipeline Workers | Yes | Yes | 1 | 10 (GPU) | Queue depth > 50, GPU util < 80% |
| Background Workers | Yes | Yes | 1 | 20 | Queue depth > 100 |

### Container Configuration

| Service | CPU | Memory | GPU | Disk |
|---------|-----|--------|-----|------|
| API Gateway | 2 cores | 2 GB | N/A | 10 GB |
| User Service | 1 core | 1 GB | N/A | 10 GB |
| Garment Service | 2 cores | 2 GB | N/A | 10 GB |
| Outfit Service | 1 core | 1 GB | N/A | 10 GB |
| Storage Service | 2 cores | 4 GB | N/A | 50 GB (temp) |
| Real-time Service | 2 cores | 2 GB | N/A | 10 GB |
| AI Pipeline Workers | 4 cores | 16 GB | 1x T4 / A10G | 50 GB |
| Background Workers | 1 core | 1 GB | N/A | 10 GB |

---

## Vertical Scaling Strategy for AI Services

### GPU Requirements

| AI Task | Model | GPU Required | VRAM | Inference Time | Batch Size |
|---------|-------|-------------|------|---------------|------------|
| Garment Detection | Detectron2 (Mask R-CNN) | T4 / A10G | 4-8 GB | 2-5s | 1-4 |
| Size Estimation | Custom CNN + Transformer | T4 | 2-4 GB | 1-3s | 1-8 |
| Color Analysis | Custom CNN | CPU / T4 | 1-2 GB | 0.5-1s | 1-16 |
| Outfit Recommendation | Transformer (Cross-Encoder) | T4 | 2-4 GB | 1-3s | 1-8 |
| Avatar Generation | 3D GAN / Diffusion Model | A10G / A100 | 16-24 GB | 15-30s | 1-2 |
| Virtual Try-On | GAN / Diffusion-based | A10G / A100 | 8-16 GB | 5-15s | 1-2 |

### Vertical Scaling Options

| Tier | GPU | VRAM | Cost/Hour | Suitable For | Max Throughput |
|------|-----|------|-----------|-------------|---------------|
| Starter | NVIDIA T4 | 16 GB | ~$0.35 | Detection, color, size estimation | 100 images/min |
| Standard | NVIDIA A10G | 24 GB | ~$1.00 | Avatar generation, virtual try-on | 30 images/min |
| Performance | NVIDIA A100 | 40/80 GB | ~$3.50 | Batch processing, high throughput | 100 images/min |
| Premium | 2x NVIDIA A100 | 80+ GB | ~$7.00 | Training, large batch inference | 200 images/min |

### Auto-Scaling for GPU Workers

```yaml
scaling:
  min_replicas: 1
  max_replicas: 10
  metrics:
    - type: External
      metric:
        name: ai_queue_depth
        target:
          type: AverageValue
          averageValue: 50
    - type: Resource
      resource:
        name: gpu_utilization
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 120
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 300
```

---

## Database Connection Pooling

### Pool Configuration

```typescript
const poolConfig = {
  primary: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    maxUses: 7500,
  },
  replica: {
    max: 40,
    min: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    maxUses: 7500,
  },
};
```

Per-service pool allocation:
- API Gateway: max=10 (reads), max=5 (writes)
- Garment Service: max=15 (reads), max=5 (writes)
- User Service: max=5 (reads), max=3 (writes)
- Outfit Service: max=10 (reads), max=3 (writes)
- Background Jobs: max=5 (reads), max=5 (writes)

### PgBouncer Configuration

```ini
[databases]
closet_inteligente = host=localhost port=5432 dbname=closet_inteligente

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
pool_mode = transaction
default_pool_size = 25
max_client_conn = 200
max_db_connections = 50
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 300
query_timeout = 30
query_wait_timeout = 10
server_round_robin = 1
```

---

## Redis Cluster Configuration

### Cluster Topology

Redis Cluster (3 masters, 3 replicas):
- Master 1 (shard 0-5461) <--- Replica 1
- Master 2 (shard 5462-10922) <--- Replica 2
- Master 3 (shard 10923-16383) <--- Replica 3

### Cluster Configuration

```redis
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
appendfsync everysec
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 300
protected-mode yes
io-threads 4
io-threads-do-reads yes
```

### Key Distribution Strategy

| Key Pattern | Hashtag | Distribution | Reason |
|-------------|---------|--------------|--------|
| session:{token_hash} | {session} | Even across shards | Sessions are independent |
| user:{id}:* | {user:id} | Same shard per user | Co-locate user data |
| garment:{id}:* | No hashtag | Even across shards | Even distribution |
| ratelimit:{endpoint}:{user_id} | No hashtag | Even across shards | Even load |
| ai_queue:{job_type} | {ai_queue} | Same shard | Queue consistency |

---

## Load Balancing Strategy

### Load Balancing Layers

| Layer | Balancer Type | Algorithm | Sticky Sessions | Health Check |
|-------|--------------|-----------|-----------------|-------------|
| CDN -> Frontend | Vercel Edge Network | Anycast + Smart Routing | No | Automatic |
| API Gateway -> Services | Kubernetes Service | Round Robin | No | TCP + HTTP |
| Services -> Database | PgBouncer | Transaction-based | No | TCP |
| External APIs | Cloudflare LB | Geo-based + Least Connections | No | HTTP /health |
| WebSocket | Redis Pub/Sub adapter | N/A (broadcast) | Yes (per connection) | N/A |

### Traffic Routing Strategy

Regional routing:
- Users in Americas -> us-east-1
- Users in Europe -> eu-west-1 (when multi-region enabled)
- Users in Asia Pacific -> ap-southeast-1 (when multi-region enabled)

Failure routing:
- Primary region health check fails -> Route all traffic to secondary region
- Partial failure -> Route affected traffic to healthy instances

---

## Auto-Scaling Triggers

### Kubernetes HPA Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 500
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 4
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
```

### Auto-Scaling Triggers by Service

| Service | Primary Trigger | Secondary Trigger | Cooldown Up | Cooldown Down |
|---------|----------------|-------------------|-------------|---------------|
| API Gateway | CPU > 70% | Requests/s > 500 | 60s | 300s |
| User Service | CPU > 70% | Requests/s > 1000 | 60s | 300s |
| Garment Service | CPU > 70% | Requests/s > 500 | 60s | 300s |
| Outfit Service | CPU > 70% | Memory > 80% | 60s | 300s |
| Storage Service | Queue depth > 100 | CPU > 70% | 120s | 300s |
| Real-time Service | Connections > 1000 | CPU > 70% | 120s | 600s |
| AI Pipeline | Queue depth > 50 | GPU util > 70% | 120s | 300s |
| Background Workers | Queue depth > 100 | CPU > 70% | 60s | 300s |

---

## CDN Scaling

### CDN Architecture

```
[Origin Server] --> [Cloudinary CDN] --> [User (Global)]
                        |
              [Cloudflare CDN (Optional)]
                        |
                   [User (Regional)]
```

### CDN Scaling Strategy

| Phase | Monthly Bandwidth | PoPs | Configuration |
|-------|-------------------|------|--------------|
| Startup | < 1 TB | 10 (Vercel default) | Standard CDN |
| Growth | 1-10 TB | 20+ | Cloudinary + Vercel Edge |
| Scale | 10-100 TB | 50+ | Multi-CDN, custom optimization |
| Enterprise | 100+ TB | Global | Dedicated CDN contract |

---

## Database Read Replicas

### Replica Architecture

```
[Primary Database] (writes)
    +---> [Read Replica 1] (all reads, analytics)
    +---> [Read Replica 2] (all reads, search)
    +---> [Read Replica 3] (heavy analytics, reporting)
```

### Read Replica Configuration

| Replica | Purpose | Instance Size | Read Load | Sync Mode |
|---------|---------|--------------|-----------|-----------|
| Primary | All writes, critical reads | 4 vCPU, 16 GB RAM | 10% | - |
| Replica 1 | Application reads | 4 vCPU, 16 GB RAM | 40% | Async (streaming) |
| Replica 2 | Search queries | 4 vCPU, 16 GB RAM | 30% | Async (streaming) |
| Replica 3 | Analytics + reporting | 2 vCPU, 8 GB RAM | 20% | Async (streaming) |

### Read/Write Splitting

Read queries are routed to replicas via round-robin. All write queries and transactions go to the primary. Replication lag is monitored: target < 1 second, warning at 5s, critical at 30s.

---

## Sharding Strategy for User Data

### Sharding Decision

Sharding will be implemented when:
1. Database exceeds 500 GB
2. Write throughput exceeds primary capacity (10,000 writes/s)
3. Read replicas cannot keep up with replication lag < 1s

### Sharding Architecture (Future)

Consistent hashing based on user_id (SHA-256) to select shard. Each shard contains a complete schema for its users. Global tables (feature_flags, admin_users, audit_logs) are replicated across all shards.

### Cross-Shard Query Rules

- Avoid JOINs across shards
- Denormalize data where needed
- For cross-shard queries, scatter-gather pattern with fan-out
- Maintain global lookup table for rarely-changing data (brands, categories)

---

## Queue-Based Load Leveling for AI Pipeline

### Queue Architecture

```
[API Gateway] --> [Redis/Bull Queue] --> [AI Workers (GPU)]
                      |                        |
                      |                   [Process Results]
                      |                        |
                      +----> [Dead Letter Queue]
```

### Queue Configuration

```typescript
const aiQueue = new Bull('ai-processing', {
  redis: { host: process.env.REDIS_HOST, port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
    timeout: 60000,
  },
  limiter: { max: 5, duration: 1000 },
  settings: {
    lockDuration: 30000,
    lockRenewTime: 15000,
    stalledInterval: 30000,
    maxStalledCount: 2,
  },
});

const JOB_PRIORITIES = {
  'garment-detection': 10,
  'size-estimation': 10,
  'color-analysis': 10,
  'outfit-recommendation': 5,
  'avatar-generation': 1,
  'virtual-tryon': 10,
  'batch-processing': 0,
};
```

### Dead Letter Queue

Failed jobs after max retries are moved to a dead letter queue for manual inspection. Alerts are triggered on repeated AI pipeline failures.

---

## Cache Warming Strategy

### Warmup Jobs

- Popular garments (every 5 min): Top 100 garments by views
- Search suggestions (every 10 min): Popular search terms
- User session (on login): User recent data preloaded to Redis
- AI detection results (on upload background): Results cached to Redis
- CDN (on deploy): Pre-build and upload static assets

### Post-Deployment Warmup

After deployment, cache warming runs for 60 seconds, hitting critical endpoints to populate caches before full traffic is routed.

---

## Cold Start Mitigation for Serverless Functions

### Cold Start Analysis

| Function Type | Average Cold Start | Package Size | Mitigation |
|--------------|-------------------|--------------|------------|
| Next.js API routes | 500ms-1s | ~5 MB | Keep-alive, minify dependencies |
| Next.js SSR pages | 800ms-1.5s | ~10 MB | ISR, keep-alive |
| Edge Functions | 50ms-200ms | ~1 MB | Minimize dependencies |

### Mitigation Strategies

1. Keep-alive pings every 5 minutes to warm endpoints
2. Lazy initialization of heavy clients (Prisma, Redis)
3. ISR (Incremental Static Regeneration) for frequently changing pages
4. Edge Functions for low-compute endpoints
5. Minify dependencies in production builds

---

## Rate Limiting at Scale

### Distributed Rate Limiting Architecture

Rate limiting uses Redis sorted sets for sliding window counters. Each request is tracked per-user or per-IP with atomic Redis operations.

### Rate Limiting Tiers

| Tier | Daily Limit | Rate Limit (per min) | Concurrent Requests |
|------|-------------|---------------------|-------------------|
| Free | 100 requests | 10 | 1 |
| Basic | 1,000 requests | 60 | 5 |
| Premium | 10,000 requests | 300 | 20 |
| Enterprise | Unlimited | Custom | Custom |

---

## Capacity Planning

### Growth Projections

| Phase | Timeframe | MAU | DAU | Peak RPS | API Instances | GPU Workers |
|-------|-----------|-----|-----|----------|---------------|-------------|
| Launch | Month 1 | 1,000 | 200 | 10 | 2 | 1 |
| Growth | Month 6 | 10,000 | 2,000 | 50 | 3 | 2 |
| Scale | Year 1 | 50,000 | 10,000 | 250 | 6 | 4 |
| Expansion | Year 2 | 250,000 | 50,000 | 1,250 | 15 | 8 |
| Enterprise | Year 3 | 1,000,000 | 200,000 | 5,000 | 30+ | 20+ |

### Resource Estimates

| Phase | API Gateway | Services | AI Workers | Database | Redis | Storage |
|-------|-------------|----------|------------|----------|-------|---------|
| Launch | 2 x 2CPU/2GB | 2 x 1CPU/1GB | 1 x 4CPU/16GB/T4 | 2CPU/8GB | 1GB | 100GB |
| Scale | 6 x 2CPU/4GB | 8 x 2CPU/2GB | 4 x 4CPU/16GB/A10G | 4CPU/16GB + 2 replicas | 2GB cluster | 500GB |
| Enterprise | 30 x 4CPU/8GB | 40 x 4CPU/4GB | 20 x 8CPU/32GB/A100 | 8CPU/32GB + 5 replicas | 8GB cluster | 5TB |
