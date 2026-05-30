# Staging Readiness Report

> **Generated:** 2026-05-27
> **Phase:** Staging + Production Simulation

---

## Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| `docker-compose.staging.yml` | CREATED | Production-like with 8 services |
| `infrastructure/nginx/` | CREATED | Reverse proxy + gzip/brotli + WS proxy |
| `frontend/Dockerfile` | CREATED | Multi-stage, standalone Next.js output |
| `.env.staging.example` | CREATED | Staging-specific env template |
| `backend/.env.staging` | CREATED | Backend staging env |

## Services

| Service | Healthcheck | Restart | Resource Limits |
|---------|-------------|---------|-----------------|
| Nginx | `nginx -t` | `unless-stopped` | 256M / 0.25 CPU |
| Frontend | HTTP :3000 | `unless-stopped` | 256M / 0.25 CPU |
| Backend | HTTP :4000/health | `unless-stopped` | 512M / 0.5 CPU |
| AI Service | HTTP :5100/health | `unless-stopped` | 1G / 1.0 CPU |
| PostgreSQL | pg_isready | `unless-stopped` | 512M / 0.5 CPU |
| Redis | redis-cli ping | `unless-stopped` | 256M / 0.25 CPU |
| Prometheus | HTTP :9090/-/healthy | `unless-stopped` | 512M / 0.5 CPU |
| Grafana | HTTP :3000/api/health | `unless-stopped` | 256M / 0.25 CPU |
| OTel Collector | gRPC health probe | `unless-stopped` | 256M / 0.25 CPU |

## Networking

- All services on `closet-staging-network` (172.28.0.0/16)
- Nginx exposed on port 80
- Prometheus on 9090 (internal)
- Grafana on 3001 (mapped from internal 3000)
- OTel Collector on 4317 (gRPC) + 4318 (HTTP)

## Volumes

| Volume | Purpose | Persistence |
|--------|---------|-------------|
| `closet-staging-pgdata` | PostgreSQL data | Named, persistent |
| `closet-staging-redisdata` | Redis AOF + RDB | Named, persistent |
| `closet-staging-shared-uploads` | Backend-AI file sharing | Named, persistent |
| `closet-staging-logs` | Nginx + backend logs | Named, persistent |
| `closet-staging-grafana-data` | Grafana state | Named, persistent |
| `closet-staging-prometheus-data` | Metrics TSDB | Named, persistent |

## Startup Ordering

```
postgres ──→ redis ──→ closet-ai ──→ backend ──→ frontend ──→ nginx
                                              └──→ prometheus ──→ grafana
                                                              └──→ otel-collector
```

## Cold Boot Command

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up --build -d
```

## Shutdown

```bash
docker compose -f docker-compose.staging.yml down -t 60
```

## Key Gaps

1. Cloudinary credentials required for upload endpoints
2. SSL/TLS not configured (requires certs for HTTPS)
3. No Redis password set in staging (add for production)
4. Backend metrics need `prom-client` npm package for full Prometheus support
5. Frontend standalone build requires `next build` to generate `.next/standalone`
