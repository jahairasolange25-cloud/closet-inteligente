# Metrics Catalog — Closet Inteligente

> **Last Updated:** 2026-05-27
> **Purpose:** Complete reference of all exported metrics across services.

---

## Backend Metrics (Prometheus endpoint: `/metrics`)

### Counters

| Metric | Labels | Description |
|--------|--------|-------------|
| `closet_http_requests_total` | `method`, `route`, `status` | Total HTTP requests by method, route, status |
| `closet_http_errors_total` | `method`, `route`, `status` | HTTP 4xx/5xx responses |
| `closet_ws_connections_total` | — | WebSocket connections established |
| `closet_ws_disconnections_total` | — | WebSocket disconnections |
| `closet_pipeline_steps_total` | `step`, `status` | Pipeline step executions |
| `closet_ai_inferences_total` | `model`, `status` | AI model inferences |
| `closet_uploads_total` | `status` | File upload attempts |
| `closet_auth_requests_total` | `status` | Authentication requests |

### Histograms

| Metric | Labels | Description |
|--------|--------|-------------|
| `closet_http_request_duration_ms` | `method`, `route` | HTTP request duration (buckets: 1ms-10s) |
| `closet_bullmq_queue_depth` | `queue` | BullMQ queue depth |
| `closet_pipeline_step_duration_ms` | `step` | Pipeline step duration |
| `closet_ai_inference_duration_ms` | `model` | AI inference duration |
| `closet_upload_size_bytes` | — | Upload file size distribution |
| `closet_auth_duration_ms` | — | Auth request duration |

### Gauges

| Metric | Labels | Description |
|--------|--------|-------------|
| `process_uptime_seconds` | — | Process uptime |
| `closet_db_connections_total` | — | Active DB connections |
| `closet_redis_up` | — | Redis health (1=up, 0=down) |
| `closet_redis_memory_used_bytes` | — | Redis memory usage |
| `closet_process_memory_bytes` | `type` | Node process memory (rss, heapTotal, heapUsed) |

---

## AI Service Metrics (Prometheus endpoint: `/metrics`)

### Counters

| Metric | Labels | Description |
|--------|--------|-------------|
| `closet_ai_inferences_total` | `model`, `status` | Model inferences by model name |
| `closet_pipeline_steps_total` | `step`, `status` | Pipeline step executions |
| `closet_uploads_total` | — | Uploads processed |

### Histograms

| Metric | Labels | Description |
|--------|--------|-------------|
| `closet_ai_inference_duration_ms` | `model` | Inference latency per model |
| `closet_pipeline_step_duration_ms` | `step` | Step execution time |
| `closet_upload_size_bytes` | — | Upload size distribution |

### Gauges

| Metric | Labels | Description |
|--------|--------|-------------|
| `ai_service_uptime_seconds` | — | Python service uptime |
| `closet_process_memory_bytes` | `type` | Python process memory |

---

## Frontend Metrics (POST to /api/v1/analytics/client-events)

### Web Vitals

| Event Name | Unit | Description |
|-----------|------|-------------|
| `web_vital_lcp` | ms | Largest Contentful Paint |
| `web_vital_fid` | ms | First Input Delay |
| `web_vital_cls` | score | Cumulative Layout Shift |
| `web_vital_inp` | ms | Interaction to Next Paint |
| `web_vital_ttfb` | ms | Time to First Byte |

### Client-Side Metrics

| Event Name | Unit | Description |
|-----------|------|-------------|
| `api.latency` | ms | Client-side API call duration |
| `ws.reconnect` | count | WebSocket reconnect attempts |
| `upload.failure` | count | Upload failure events |
| `auth.refresh.failure` | count | Token refresh failures |
| `render.crash` | count | Three.js render crashes |

---

## Grafana Dashboards

| Dashboard | UID | Panels |
|-----------|-----|--------|
| Service Overview | `closet-service-overview` | Backend requests, errors, queue depth, WS connections, Redis memory, pipeline timing |

---

## Distributed Tracing

| Header | Description |
|--------|-------------|
| `X-Trace-Id` | Unique trace ID per request (UUID v4) |
| `X-Span-Id` | Span ID within trace (16-char hex) |
| `X-Request-ID` | Correlation ID (legacy, same as Trace ID) |

Traces are exported to OTel Collector at `otel-collector:4318` via OTLP protocol.

---

## Alert Thresholds (Recommended)

| Metric | Warning | Critical | Window |
|--------|---------|----------|--------|
| HTTP error rate | >5% | >10% | 5m |
| p95 latency | >2s | >5s | 5m |
| Queue depth | >100 | >500 | 1m |
| DB connections | >80% pool | >95% pool | 1m |
| Redis memory | >80% | >90% | 5m |
| WS reconnect rate | >10/min | >50/min | 1m |
| Pipeline failures | >5% | >15% | 5m |
