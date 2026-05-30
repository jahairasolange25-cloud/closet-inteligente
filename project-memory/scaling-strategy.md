# Scaling Strategy — Closet Inteligente Digital

> **Last Updated:** 2026-05-27
> **Status:** Design
> **Target:** 10K+ active users with < 200ms p95 response time.

---

## Horizontal Scaling

### Backend (NestJS)

- **Stateless** — scale horizontally behind ALB
- **Session** — JWT-based, no server-side session
- **WebSocket** — Socket.IO Redis adapter for multi-instance
- **Rate limiting** — Redis-backed, per-user

### AI Service (Python/FastAPI)

- **CPU workers** — Stateless, scale by request queue depth
- **GPU workers** — Stateful (model loaded), scale by pipeline queue depth
- **Model cache** — Pre-loaded on startup, shared via EFS for cold starts

### Worker Scaling Rules

| Worker Type | Metric | Min | Max | Scale Up | Scale Down |
|---|---|---|---|---|---|
| API (NestJS) | CPU > 70% | 2 | 20 | +2 per min | -1 per 5 min |
| AI CPU | Queue depth > 50 | 1 | 10 | +1 per min | -1 per 10 min |
| AI GPU | Queue depth > 20 | 1 | 5 | +1 per 5 min | Manual |
| BullMQ Worker | Queue depth > 100 | 1 | 5 | +1 per 2 min | -1 per 10 min |

---

## Database Scaling

### Read Replicas

```
1 primary (write) + 2 replicas (read) per region
Reads: garments list, outfits list, analytics queries
Writes: garment create/update, outfit mutations
```

### Connection Pool

```typescript
const poolConfig = {
  max: 20,        // per instance
  idleTimeout: 30000,
  connectionTimeout: 5000,
  min: 2,         // keep warm connections
};
```

### pgvector Optimization

- IVFFlat index with lists = sqrt(n_rows)
- Re-index weekly or after 10% data change
- Probe = `lists / 10` for balance

---

## Queue Partitioning

```
Queue: garment-pipeline
  → Partitions: [0-3], [4-7], [8-11], [12-15] (by garment_id hash)
  → Each partition has dedicated worker
  → Ensures FIFO per garment

Queue: avatar-generation
  → Partition by user_id hash
  → Max 1 concurrent job per user
```

---

## Edge Caching

### Cloudflare Cache Rules

| Path | Cache | Edge TTL | Browser TTL |
|---|---|---|---|
| `/api/v1/garments` | Standard | 1m | 30s |
| `/api/v1/outfits` | Standard | 1m | 30s |
| `/api/v1/analytics` | No cache | — | — |
| `/_next/static/*` | Standard | 1y | 1y |
| `/api/v1/storage/*` | No cache | — | — |

### React Query Defaults

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,    // 2 min
      cacheTime: 10 * 60 * 1000,    // 10 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## Cost-Efficiency Measures

1. **Auto-stop idle AI GPU instances** after 15 min idle
2. **RDS Reserved Instances** for baseline capacity
3. **S3 Lifecycle policies** — move old garments to Glacier after 1 year
4. **CDN cache hit ratio target** > 80% for images
5. **Compression** — Brotli for API responses, WebP/AVIF for images
6. **Bundle splitting** — Next.js dynamic imports for non-critical routes

---

## Failure Modes

| Failure | Impact | Mitigation |
|---|---|---|
| Redis down | Rate limiting, queue, consent broken | Circuit breaker → degraded mode |
| DB replica down | Read queries failover to primary | Connection pool retry |
| AI service down | Pipeline processing delayed | Queue jobs retry for 24h |
| Cloudinary down | Image uploads fail | Fallback to S3 direct upload |
| GPU OOM | AI inference fails | Fallback to CPU with warning |

---

## Performance Budgets

| Metric | P50 | P95 | P99 |
|---|---|---|---|
| API response | < 100ms | < 300ms | < 1s |
| AI inference | < 2s | < 5s | < 10s |
| Pipeline (full) | < 15s | < 30s | < 60s |
| Page load (SSR) | < 1s | < 2s | < 3s |
| Image transform | < 500ms | < 1s | < 2s |
