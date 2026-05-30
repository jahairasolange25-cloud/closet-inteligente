# Observability Report

> **Generated:** 2026-05-27
> **Components:** Prometheus, Grafana, OpenTelemetry, Custom Metrics

---

## Architecture

```
Frontend (Web Vitals) ──→ Backend API ──→ OTel Collector (4317/4318)
                                              │
                                              ├──→ Prometheus (9090) ──→ Grafana (3000)
                                              └──→ Debug output (structured logs)
```

## Backend Metrics (`/metrics`)

| Category | Metrics | Type |
|----------|---------|------|
| HTTP | `http_requests_total`, `http_errors_total`, `http_request_duration_ms` | Counter, Histogram |
| WebSocket | `ws_connections_total`, `ws_disconnections_total` | Counter |
| Pipeline | `pipeline_steps_total`, `pipeline_step_duration_ms` | Counter, Histogram |
| AI | `ai_inferences_total`, `ai_inference_duration_ms` | Counter, Histogram |
| Queue | `bullmq_queue_depth` | Histogram |
| Upload | `uploads_total`, `upload_size_bytes` | Counter, Histogram |
| Auth | `auth_requests_total`, `auth_duration_ms` | Counter, Histogram |
| System | `db_connections_total`, `redis_up`, `redis_memory_used_bytes`, `process_memory_bytes` | Gauge |

## Python AI Metrics (`/metrics`)

| Metric | Type |
|--------|------|
| `ai_service_uptime_seconds` | Gauge |
| `closet_ai_inferences_total{model,status}` | Counter |
| `closet_ai_inference_duration_ms{model}` | Histogram |
| `closet_pipeline_steps_total{step,status}` | Counter |
| `closet_pipeline_step_duration_ms{step}` | Histogram |
| `closet_process_memory_bytes{type}` | Gauge |

## Frontend Metrics

| Source | Mechanism | Metrics |
|--------|-----------|---------|
| Web Vitals | `useWebVitals` hook | LCP, FID, CLS, INP, TTFB |
| Error tracking | `useErrorTracking` hook | Client-side JS errors via beacon API |
| API calls | Axios interceptor → `metrics.apiLatency()` | Per-endpoint latency |
| WebSocket | `metrics.wsReconnect()` | Reconnect attempt count |
| Upload | `metrics.uploadFailure()` | Failure count with reason |
| Render | `metrics.renderCrash()` | Three.js crash count |

## Distributed Tracing

- Headers: `X-Trace-Id` (UUID v4), `X-Span-Id` (16-char hex)
- OTel Collector receives OTLP gRPC + HTTP
- Batch processor: 1s timeout, 1024 msg batch
- Memory limiter: 512MB max, 128MB spike

## Grafana Dashboards

| Dashboard | UID | Provisioned |
|-----------|-----|-------------|
| Service Overview | `closet-service-overview` | Yes (file-based) |

Service Overview panels:
- Backend request rate (by route)
- Error rate (by status code)
- BullMQ queue depth
- WebSocket connections
- Redis memory usage
- Pipeline processing time

## Metrics Catalog

Full catalog: `project-memory/operations/metrics-catalog.md`

## Alert Thresholds (Recommended)

| Condition | Warn | Critical | Window |
|-----------|------|----------|--------|
| HTTP error rate >5% | ✓ | >10% | 5m |
| p95 latency >2s | ✓ | >5s | 5m |
| Queue depth >100 | ✓ | >500 | 1m |
| DB connections >80% pool | ✓ | >95% | 1m |
| Redis memory >80% | ✓ | >90% | 5m |
| WS reconnect rate >10/min | ✓ | >50/min | 1m |
