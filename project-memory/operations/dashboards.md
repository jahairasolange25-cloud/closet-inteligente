# Operational Dashboards

This document describes the operational dashboards available for monitoring the Closet Inteligente Digital platform.

## Dashboard Architecture

```
┌─────────────────────────────────────────┐
│         Prometheus (metrics store)       │
│  ┌─────────────────────────────────────┐ │
│  │  backend:5100/metrics               │ │
│  │  node_exporter:9100/metrics         │ │
│  │  postgres_exporter:9187/metrics     │ │
│  └─────────────────────────────────────┘ │
└────────────────┬────────────────────────┘
                 │ scrape (15s interval)
                 ▼
┌─────────────────────────────────────────┐
│         Grafana (visualization)          │
│  Dashboards:                             │
│  ├─ Closet Platform Overview            │
│  ├─ AI Pipeline Performance             │
│  ├─ Database & Cache                    │
│  ├─ Business Metrics                    │
│  └─ Alerting Overview                   │
└─────────────────────────────────────────┘
```

## Prometheus Metrics Endpoint

The backend exposes metrics at `GET /metrics` (port 4000) with:

| Metric | Type | Labels | Description |
|---|---|---|---|
| `process_uptime_seconds` | gauge | — | Process uptime in seconds |
| `http_requests_total` | counter | method, route, status | HTTP request count |
| `http_active_connections` | gauge | — | Current active connections |
| `http_request_duration_ms` | histogram | — | Request duration distribution |
| `db_connections_total` | gauge | — | Current database connections |
| `redis_up` | gauge | — | 1 if Redis is reachable, 0 otherwise |
| `bullmq_queue_size` | gauge | queue | Number of jobs in BullMQ queue |

### Scrape Configuration (prometheus.yml)

```yaml
scrape_configs:
  - job_name: 'closet-backend'
    static_configs:
      - targets: ['backend:4000']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'closet-ai'
    static_configs:
      - targets: ['closet-ai:5100']
    metrics_path: /health
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres_exporter:9187']
    scrape_interval: 15s

  - job_name: 'node'
    static_configs:
      - targets: ['node_exporter:9100']
    scrape_interval: 15s
```

## Dashboard: Closet Platform Overview

**Purpose:** High-level health of all services.

### Panels

| Panel | Query | Type |
|---|---|---|
| Service Uptime | `process_uptime_seconds{job="closet-backend"}` | Stat |
| Request Rate (1m) | `rate(http_requests_total[1m])` | Time series |
| Error Rate (5m) | `rate(http_requests_total{status=~"5.."}[5m])` | Time series |
| P99 Latency | `histogram_quantile(0.99, rate(http_request_duration_ms_bucket[5m]))` | Time series |
| Active Connections | `http_active_connections` | Gauge |
| DB Connections | `db_connections_total` | Gauge |
| Redis Status | `redis_up` | Stat |
| Queue Depth | `bullmq_queue_size` | Gauge |

### Alert Rules

| Alert | Condition | Severity |
|---|---|---|
| BackendDown | `up{job="closet-backend"} == 0` for 1m | critical |
| HighErrorRate | `rate(http_requests_total{status=~"5.."}[5m]) > 0.05` | warning |
| HighLatency | `http_request_duration_ms{quantile="0.99"} > 5000` | warning |
| HighDBConnections | `db_connections_total > 80` | warning |
| RedisDown | `redis_up == 0` for 1m | critical |
| QueueBacklog | `bullmq_queue_size > 100` | warning |

## Dashboard: AI Pipeline Performance

**Purpose:** Monitor AI pipeline stages and model inference.

### Panels

| Panel | Description | Source |
|---|---|---|
| Pipeline Completion Rate | % of pipelines completing successfully | `/health` detailed |
| Stage Durations | P99 duration per stage (download, bg removal, classify, colors, thumbnail) | AI metrics |
| Model Inference Time | Average inference duration per model call | AI metrics |
| Pipeline Throughput | Pipelines completed per minute | AI metrics |
| Model Cache Status | Whether rembg model is pre-loaded | `/health` |

### When to Investigate

- Stage duration spikes > 2x baseline
- Inference failures > 5% over 5 minutes
- Pipeline completion rate drops below 90%

## Dashboard: Database & Cache

**Purpose:** Deep-dive into PostgreSQL and Redis health.

### Panels

| Panel | Query | Source |
|---|---|---|
| Active Queries | `pg_stat_activity` count | PostgreSQL exporter |
| Cache Hit Ratio | Redis `keyspace_hits / (keyspace_hits + keyspace_misses)` | Redis exporter |
| Memory Usage | `used_memory / maxmemory` | Redis exporter |
| Replication Lag | `pg_stat_replication` replay lag | PostgreSQL exporter |
| Connection Pool | `db_connections_total` | Backend metrics |

## Dashboard: Business Metrics

**Purpose:** Track business-level KPIs.

### Panels

| Panel | Description |
|---|---|
| Garments Processed (24h) | Count of completed pipelines |
| Average Pipeline Duration | Mean duration across all pipelines |
| Top Categories | Distribution of AI classifications |
| Color Palette Diversity | Unique hex colors extracted |
| Confidence Distribution | Histogram of classification confidence scores |

## Grafana Provisioning

Dashboards can be provisioned automatically via config maps:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: closet
data:
  platform-overview.json: |
    {
      "title": "Closet Platform Overview",
      "uid": "closet-platform",
      "panels": [ ... ]
    }
```

## Alertmanager Configuration

```yaml
route:
  receiver: 'slack-alerts'
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: 'slack-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK'
        channel: '#alerts'
        send_resolved: true
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'
```

## Related Documentation

- [Monitoring](./monitoring.md) — General monitoring strategy
- [Health Checks](./health-checks.md) — Health check endpoints reference
- [Incident Response](./incident-response.md) — Runbooks for common incidents
- [Logging](./logging.md) — Logging architecture and log analysis
