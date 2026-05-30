# Cloud Architecture V2 — Closet Inteligente Digital

> **Last Updated:** 2026-05-27
> **Status:** Design — Not implemented
> **Purpose:** Multi-region, horizontally scalable architecture for production.

---

## Architecture Overview

```
                          ┌──────────────┐
                          │  Cloudflare   │
                          │  CDN + DNS    │
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │  ALB / API Gateway       │
                    │  (Regional)              │
                    └──────┬────────────┬─────┘
                           │            │
              ┌────────────┴──┐  ┌─────┴────────────┐
              │  Web Tier     │  │  API Tier         │
              │  Next.js      │  │  NestJS           │
              │  (Edge)       │  │  (ECS Fargate)    │
              └───────────────┘  └─────┬────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────┴─────┐    ┌──────┴──────┐    ┌─────┴─────┐
              │ PostgreSQL │    │   Redis     │    │  AI Pod   │
              │  RDS       │    │  ElastiCache│    │  (GPU)    │
              │  + pgvector│    │  + Cluster  │    └───────────┘
              └───────────┘    └─────────────┘
```

---

## Key Design Decisions

### 1. Object Storage Abstraction

| Provider | Role | Fallback |
|---|---|---|
| Cloudinary | Primary image CDN | S3-compatible (MinIO) |
| S3 (AWS) | File storage + models | Cloudinary fallback |
| Local filesystem | Dev only | N/A |

### 2. Database Scaling

- **Read replicas:** 2 minimum per region
- **pgvector:** Indexed with IVFFlat (lists=100) for < 100K rows
- **Connection pooling:** PgBouncer or RDS Proxy
- **Sharding:** By user_id hash for > 100K users

### 3. Cache Strategy

| Layer | Technology | TTL | Invalidates |
|---|---|---|---|
| HTTP (edge) | Cloudflare | 5m | On purge |
| Application | Redis | 30m | On garment change |
| Database | Query cache | 2m | On write |
| Frontend | React Query | 2m | On mutation |

### 4. Queue Architecture

- **BullMQ** with Redis Cluster
- **Queue per domain:** pipeline, export, avatar, notification
- **Worker auto-scaling:** Based on queue depth (target: 100 jobs/worker)
- **Dead letter:** Failed jobs moved to `*:failed` queue after 3 retries

### 5. AI Worker Scaling

- **GPU Pods:** Auto-scale based on queue depth (min: 1, max: 10)
- **CPU Pods:** Stateless, scale by request count
- **Model cache:** Shared EFS volume for model weights
- **Batch inference:** Group similar requests for GPU efficiency

### 6. Multi-Region Strategy

| Region | Purpose | Status |
|---|---|---|
| us-east-1 | Primary | Planned |
| eu-west-1 | EU data residency | Planned |
| ap-southeast-1 | APAC latency | Future |

---

## Networking

### CDN Strategy

- **Static assets:** Cloudflare CDN (100+ PoPs)
- **Images:** Cloudinary CDN with transformations
- **API:** Regional ALB → NestJS (no global routing yet)
- **WebSocket:** Socket.IO with Redis adapter for multi-instance

### Signed URL Delivery

```typescript
// Generate signed URL for authenticated asset access
function generateSignedCDNUrl(
  path: string,
  expiresIn: number = 3600,
): string {
  const expiry = Math.floor(Date.now() / 1000) + expiresIn;
  const signature = crypto
    .createHmac('sha256', CDN_SECRET)
    .update(`${path}${expiry}`)
    .digest('hex');
  return `https://cdn.closet.app/${path}?exp=${expiry}&sig=${signature}`;
}
```

---

## Image Optimization Pipeline

```typescript
interface ImageOptimizationConfig {
  formats: ['webp', 'avif', 'jpg'];
  breakpoints: [320, 640, 960, 1280, 1920];
  quality: { webp: 80; avif: 70; jpg: 85 };
  transformations: {
    background_removal: boolean;
    auto_enhance: boolean;
    smart_crop: boolean;
  };
}
```

- Upload → original stored in S3
- Cloudinary transforms on-the-fly via URL params
- CDN caches transformed variants
- AVIF as preferred format, WebP fallback

---

## Security

- All traffic through Cloudflare (DDoS protection)
- WAF rules: SQLi, XSS, path traversal
- API keys via AWS Secrets Manager
- Signed CDN URLs for private assets
- Encryption at rest (RDS + S3 SSE-S3)

---

## Monitoring

| Service | Tool | Retention |
|---|---|---|
| Metrics | Prometheus + Grafana Cloud | 30 days |
| Traces | OTel Collector → Honeycomb | 14 days |
| Logs | CloudWatch Logs → Elasticsearch | 90 days |
| Alerts | PagerDuty + Opsgenie | — |
| Uptime | Cloudflare + Pingdom | — |

---

## Cost Projections (Monthly)

| Service | Dev | Staging | Production (1K users) | Production (10K users) |
|---|---|---|---|---|
| Compute (ECS) | $50 | $150 | $500 | $2,500 |
| Database (RDS) | $15 | $50 | $200 | $800 |
| Redis | $0 | $20 | $50 | $200 |
| AI (GPU) | $0 | $100 | $500 | $2,000 |
| Storage (S3) | $5 | $20 | $50 | $200 |
| CDN | $0 | $10 | $50 | $200 |
| **Total** | **$70** | **$350** | **$1,350** | **$5,900** |
