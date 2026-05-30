# Monitoring Strategy

## Overview
The monitoring strategy for Closet Inteligente Digital provides full observability across frontend, backend, AI pipeline, database, cache, real-time communications, storage, and infrastructure layers. All metrics are collected in real-time with 15-second granularity and retained for 90 days for trend analysis.

---

## Key Metrics to Monitor

### 1. API Response Times
| Metric | Description | Threshold p95 | Critical p99 |
|--------|-------------|---------------|--------------|
| `api.response_time` | All HTTP request durations | <200ms | <500ms |
| `api.response_time.ai` | AI inference endpoint durations | <10s | <30s |
| `api.response_time.uploads` | File upload endpoint durations | <5s | <15s |
| `api.response_time.avatar` | Avatar generation endpoint durations | <60s | <120s |
| `api.response_time.search` | Product search endpoint durations | <500ms | <2s |
| `api.response_time.auth` | Authentication endpoint durations | <300ms | <1s |

### 2. Error Rates
| Metric | Description | Warning | Critical |
|--------|-------------|---------|----------|
| `api.error_rate` | Percentage of 5xx responses | >1% | >5% |
| `api.error_rate.4xx` | Percentage of 4xx responses | >5% | >10% |
| `api.error_rate.ai` | AI pipeline failure rate | >2% | >10% |
| `api.error_rate.upload` | Upload failure rate | >1% | >5% |
| `api.error_rate.websocket` | WebSocket message failure rate | >1% | >3% |

### 3. AI Pipeline Success Rates
| Metric | Description | Target |
|--------|-------------|--------|
| `ai.pipeline.image_detection.success` | Garment detection success rate | >95% |
| `ai.pipeline.size_estimation.success` | Size estimation success rate | >90% |
| `ai.pipeline.color_analysis.success` | Color analysis success rate | >95% |
| `ai.pipeline.outfit_recommendation.success` | Outfit recommendation success rate | >90% |
| `ai.pipeline.avatar_generation.success` | Avatar generation success rate | >85% |
| `ai.pipeline.virtual_tryon.success` | Virtual try-on success rate | >85% |
| `ai.pipeline.pipeline_latency.p50` | Median AI pipeline latency | <5s |
| `ai.pipeline.pipeline_latency.p95` | P95 AI pipeline latency | <15s |
| `ai.pipeline.queue_depth` | AI job queue depth | <50 |

### 4. Database Query Performance
| Metric | Description | Warning | Critical |
|--------|-------------|---------|----------|
| `db.query_time.p50` | Median query time | <50ms | <100ms |
| `db.query_time.p95` | P95 query time | <200ms | <500ms |
| `db.connections.active` | Active connections | >80% pool | >95% pool |
| `db.connections.waiting` | Waiting connections | >5 | >20 |
| `db.table_size.garments` | Garments table size | N/A | N/A |
| `db.table_size.users` | Users table size | N/A | N/A |
| `db.slow_queries.count` | Queries exceeding 1s | >5/min | >20/min |
| `db.index_cache_hit_ratio` | Index cache hit ratio | <99% | <95% |
| `db.transactions.deadlocks` | Deadlock count | 0 | >0 |
| `db.replication.lag` | Replica lag time | <1s | >5s |

### 5. Redis Cache Hit Rates
| Metric | Description | Warning | Critical |
|--------|-------------|---------|----------|
| `redis.hit_rate` | Overall cache hit rate | <85% | <70% |
| `redis.hit_rate.session` | Session cache hit rate | <90% | <80% |
| `redis.hit_rate.garments` | Garment data cache hit rate | <80% | <65% |
| `redis.hit_rate.outfits` | Outfit recommendation cache hit rate | <75% | <60% |
| `redis.memory_usage.percent` | Memory usage percentage | >70% | >90% |
| `redis.connections.count` | Active connections | >500 | >1000 |
| `redis.evictions.rate` | Key eviction rate | >1/s | >10/s |

### 6. WebSocket Connection Count
| Metric | Description | Warning | Critical |
|--------|-------------|---------|----------|
| `ws.connections.total` | Total active connections | N/A | N/A |
| `ws.connections.rate` | New connections per second | >100/s | >500/s |
| `ws.disconnections.rate` | Disconnections per second | >50/s | >200/s |
| `ws.messages.sent` | Messages sent per second | N/A | N/A |
| `ws.messages.received` | Messages received per second | N/A | N/A |
| `ws.latency.p95` | P95 message delivery latency | >100ms | >500ms |
| `ws.rooms.active` | Active room count | N/A | N/A |

### 7. File Upload Throughput
| Metric | Description | Warning | Critical |
|--------|-------------|---------|----------|
| `upload.throughput.mbps` | Upload throughput in Mbps | <50 | <20 |
| `upload.count` | Uploads per minute | N/A | N/A |
| `upload.size_avg` | Average upload size in MB | >10 | >50 |
| `upload.failure_rate` | Upload failure rate | >1% | >5% |
| `upload.processing_time` | Image processing time | <3s | <10s |
| `upload.cloudinary.latency` | Cloudinary upload latency | <2s | >5s |

### 8. User Activity Metrics
| Metric | Description | Target |
|--------|-------------|--------|
| `user.dau` | Daily active users | N/A |
| `user.mau` | Monthly active users | N/A |
| `user.sessions_per_day` | Sessions per user per day | >3 |
| `user.session_duration` | Average session duration | >10min |
| `user.onboarding_completion` | Onboarding completion rate | >70% |
| `user.outfit_creations` | Outfits created per day | N/A |
| `user.tryon_sessions` | Virtual try-on sessions per day | N/A |
| `user.wardrobe_items_added` | Items added to wardrobe per day | N/A |
| `user.retention.d1` | Day 1 retention | >40% |
| `user.retention.d7` | Day 7 retention | >25% |
| `user.retention.d30` | Day 30 retention | >15% |
| `user.bounce_rate` | Landing page bounce rate | <40% |
| `user.page_views` | Page views per session | >5 |

---

## Monitoring Tools

### 1. Railway/Render Built-in Monitoring
- **Metrics collected**: CPU, memory, disk I/O, network I/O, request count, response times, error rates
- **Dashboards**: Platform-provided dashboards for each service
- **Logs**: Integrated log viewer with search and filtering
- **Alerts**: CPU >80%, memory >80%, 5xx errors >1%, instance health check failures
- **Retention**: 14 days for metrics, 7 days for logs (platform default)

### 2. Vercel Analytics
- **Metrics collected**: Page views, unique visitors, web vitals (LCP, FID, CLS), bandwidth, function duration, function invocations
- **Dashboards**: Vercel dashboard for frontend performance
- **Speed Insights**: Real-user monitoring for page load performance
- **Web Analytics**: Traffic sources, top pages, user geography
- **Edge Functions**: Execution time, memory, invocation count

### 3. Custom Health Check Endpoints
- **Endpoint**: `GET /health` - Basic health check (returns 200 if service is running)
- **Endpoint**: `GET /health/ready` - Readiness check (verifies all dependencies)
- **Endpoint**: `GET /health/startup` - Startup check (confirms initialization complete)
- **Endpoint**: `GET /health/detailed` - Detailed health with component status and latency
- **Frequency**: Probed every 30 seconds by orchestrator, every 60 seconds by monitoring service
- **Integration**: Docker HEALTHCHECK, Railway/Render health check endpoints

---

## Alerting Thresholds & Notification Channels

### Alert Severity Levels

| Severity | Response Time | Color | Notification Channels |
|----------|--------------|-------|----------------------|
| CRITICAL | 15 minutes | Red | PagerDuty phone call + Slack + Email |
| HIGH | 30 minutes | Orange | Slack @here + Email + SMS |
| MEDIUM | 2 hours | Yellow | Slack @channel + Email |
| LOW | 8 hours (next business day) | Blue | Slack channel message + Email digest |

### Alert Rules

| Rule ID | Condition | Severity | Description |
|---------|-----------|----------|-------------|
| `api-latency-p95` | `api.response_time > 500ms` for 5 min | HIGH | High API latency |
| `api-error-rate` | `api.error_rate > 5%` for 3 min | CRITICAL | Elevated error rate |
| `ai-pipeline-fail` | `ai.pipeline.image_detection.success < 85%` for 10 min | HIGH | AI pipeline degradation |
| `ai-queue-backup` | `ai.pipeline.queue_depth > 100` for 5 min | MEDIUM | AI job queue backing up |
| `db-connections` | `db.connections.active > 90%` for 2 min | HIGH | Database connection pool exhaustion |
| `db-slow-queries` | `db.slow_queries.count > 20/min` for 5 min | MEDIUM | Excessive slow queries |
| `db-replication-lag` | `db.replication.lag > 10s` | HIGH | Database replication lag |
| `redis-memory` | `redis.memory_usage.percent > 90%` | HIGH | Redis memory exhaustion risk |
| `redis-hit-rate` | `redis.hit_rate < 70%` for 15 min | MEDIUM | Low cache hit rate |
| `ws-connections` | `ws.connections.total > 80% of limit` | MEDIUM | WebSocket connection approaching limit |
| `ws-latency` | `ws.latency.p95 > 500ms` for 5 min | MEDIUM | WebSocket message delivery delay |
| `upload-throughput` | `upload.throughput.mbps < 20` for 5 min | LOW | Upload throughput degradation |
| `upload-failure` | `upload.failure_rate > 5%` for 3 min | HIGH | Upload failures elevated |
| `disk-usage` | Disk usage > 85% | HIGH | Disk space running low |
| `memory-usage` | Memory usage > 90% | HIGH | Memory pressure |
| `cpu-usage` | CPU usage > 90% for 10 min | HIGH | CPU saturation |
| `cert-expiry` | SSL certificate expires in < 14 days | HIGH | Certificate renewal needed |
| `web-vitals-lcp` | LCP > 4.0s for 5% of users | MEDIUM | Poor Largest Contentful Paint |
| `web-vitals-cls` | CLS > 0.25 for 5% of users | MEDIUM | Poor Cumulative Layout Shift |
| `user-bounce` | Bounce rate > 60% for 2 hours | LOW | Elevated bounce rate |

### Notification Channels

| Channel | Use | Integration |
|---------|-----|-------------|
| PagerDuty | CRITICAL alerts, on-call rotation | Webhook from monitoring service |
| Slack #ops-alerts | All alerts | Webhook with color-coded severity |
| Slack #ops-high-urgency | CRITICAL + HIGH alerts only | Dedicated webhook |
| Email (ops@closetinteligente.com) | MEDIUM + LOW daily digest | SMTP integration |
| SMS (on-call engineer) | CRITICAL alerts only | Twilio API |
| Discord #monitoring | MEDIUM + LOW (optional channel) | Webhook |

---

## Dashboard Layout & KPIs

### Dashboard 1: Executive Summary (C-level)
**Refresh**: Every 5 minutes

| Panel | Widget Type | Metrics |
|-------|-------------|---------|
| Revenue & Growth | Time series graph | DAU, MAU, conversion rate, revenue |
| User Activity | Stat cards | Active users, sessions, new registrations |
| Platform Health | Status indicators | Overall status (operational/degraded/down) |
| Top Errors | List | Top 5 errors by frequency |
| Performance Summary | Gauges | API p95 latency, page load time |

### Dashboard 2: API & Backend Performance
**Refresh**: Every 30 seconds

| Panel | Widget Type | Metrics |
|-------|-------------|---------|
| Request Rate | Time series graph | Requests per second by endpoint group |
| Response Times | Heatmap | p50, p95, p99 response times by endpoint |
| Error Rates | Stacked area chart | 4xx vs 5xx errors over time |
| Active Connections | Time series graph | Database connections, Redis connections, WS connections |
| Top Slow Endpoints | Table | Top 10 slowest endpoints |
| Service Health | Status grid | All microservice health status |

### Dashboard 3: AI Pipeline
**Refresh**: Every 15 seconds

| Panel | Widget Type | Metrics |
|-------|-------------|---------|
| Pipeline Success Rate | Gauge | Overall AI pipeline success rate |
| Queue Depth | Time series graph | AI job queue depth over time |
| Processing Latency | Time series graph | p50, p95, p99 AI pipeline latency |
| Worker Utilization | Time series graph | GPU utilization, memory, job throughput |
| Recent Failures | Table | Last 50 AI pipeline failures with error details |
| Model Performance | Stat cards | Per-model success rates and latencies |

### Dashboard 4: Database & Cache
**Refresh**: Every 30 seconds

| Panel | Widget Type | Metrics |
|-------|-------------|---------|
| Query Performance | Time series graph | p50, p95 query times |
| Connection Pool | Gauge | Active vs max connections |
| Cache Hit Rates | Time series graph | Redis hit rate by cache namespace |
| Replication Lag | Time series graph | Streaming replication lag |
| Table Sizes | Bar chart | Size of top 10 tables |
| Slow Queries | Table | Recent slow queries with full query text |
| Redis Memory | Gauge | Memory usage percentage |
| Redis Evictions | Time series graph | Key eviction rate |

### Dashboard 5: User Experience
**Refresh**: Every 1 minute

| Panel | Widget Type | Metrics |
|-------|-------------|---------|
| Web Vitals | Time series graph | LCP, FID, CLS over time (p75) |
| Page Load Times | Time series graph | By route/page |
| User Sessions | Time series graph | Active sessions, new sessions |
| Funnel Conversion | Funnel chart | Registration -> Onboarding -> Add Item -> Try-On -> Share |
| Error Impact | Scatter plot | Users affected by errors over time |
| Client-side Errors | Table | Top JavaScript errors with user count |

### Dashboard 6: Infrastructure
**Refresh**: Every 15 seconds

| Panel | Widget Type | Metrics |
|-------|-------------|---------|
| Service CPU | Time series graph | CPU percentage by service |
| Service Memory | Time series graph | Memory usage by service |
| Network I/O | Time series graph | Inbound/outbound traffic by service |
| Disk Usage | Gauge | Disk usage percentage per volume |
| Container Status | Status grid | Running/stopped/crashed containers |
| Deployment History | Table | Recent deployments with status |

---

## Log Aggregation Strategy

### Architecture
1. **Log Shipping**: All services emit structured JSON logs to stdout/stderr
2. **Log Agent**: Vector/Datadog Agent runs as sidecar in each container
3. **Log Transport**: Logs are shipped via HTTPS/TCP to the central aggregation service
4. **Log Storage**: 
   - Hot storage (30 days): Elasticsearch cluster (3 nodes, replicated)
   - Warm storage (60 days): Elasticsearch with reduced replicas
   - Cold storage (90+ days): Compressed JSON in S3-compatible storage (Backblaze B2)
5. **Log Indexing**: Logs are indexed by service name, timestamp, log level, request ID, user ID (hashed)

### Log Processing Pipeline
1. Collection -> 2. Parse JSON -> 3. Enrich (add service, host, environment tags) -> 4. PII Redaction -> 5. Index -> 6. Alert Evaluation -> 7. Storage

### Log Query Interface
- Kibana dashboard for log search and visualization
- Pre-built saved searches for common scenarios
- Alert integration for error log patterns

---

## Distributed Tracing Approach

### Implementation
- **OpenTelemetry SDK** integrated into all services (NestJS, Next.js, Python AI services)
- **Trace propagation** via W3C Trace Context headers
- **Trace exporter** sends to Jaeger or Grafana Tempo
- **Sampling rate**: 100% for error traces, 10% for successful requests (head-based), dynamic sampling based on endpoint criticality

### Trace Structure
- **Frontend spans**: Page load, route change, API call, component render, image load
- **Backend spans**: HTTP request handler, database query, Redis operation, external API call, file processing
- **AI spans**: Image preprocessing, model inference, postprocessing, result caching
- **End-to-end traces**: From user click to response rendering, including all service hops

### Key Trace Attributes
| Attribute | Description |
|-----------|-------------|
| `http.method` | HTTP method |
| `http.url` | Request URL (query params redacted) |
| `http.status_code` | Response status code |
| `service.name` | Service that generated the span |
| `db.system` | Database type (postgresql, redis) |
| `db.statement` | Parameterized query (no bind values) |
| `ai.model` | AI model name used for inference |
| `user.id` | Hashed user identifier |
| `request.id` | Request correlation ID |

---

## SLA Monitoring

### Service Level Objectives (SLOs)

| Service | Metric | Target | Measurement Window | Error Budget |
|---------|--------|--------|-------------------|--------------|
| API Gateway | Availability | 99.9% | 30 days | 43 min/month |
| API Gateway | Latency (p95) | <200ms | 30 days | N/A |
| Frontend | Availability | 99.9% | 30 days | 43 min/month |
| Frontend | Page load (p95) | <2s | 30 days | N/A |
| AI Pipeline | Availability | 99.5% | 30 days | 3.6 hours/month |
| AI Pipeline | Success rate | >95% | 7 days | N/A |
| Database | Availability | 99.95% | 30 days | 21 min/month |
| Database | Query latency (p95) | <200ms | 30 days | N/A |
| Redis | Availability | 99.9% | 30 days | 43 min/month |
| WebSocket | Availability | 99.9% | 30 days | 43 min/month |
| File Upload | Availability | 99.5% | 30 days | 3.6 hours/month |
| File Upload | Throughput | >50 Mbps | 30 days | N/A |

### SLA Reporting
- **Burn rate alerts**: Triggered if error budget is consumed at >2x rate for 1 hour, >3x for 6 hours, >5x for 3 days
- **Monthly SLA report**: Generated on 1st of each month, distributed to engineering leadership
- **SLA dashboard**: Real-time SLO compliance status with burn rate indicators

---

## Anomaly Detection Setup

### Detection Methods
1. **Static thresholds**: Fixed boundaries for well-understood metrics (error rates, latency)
2. **Dynamic thresholds**: Statistical baselines computed from 7-day rolling windows (p50, p95, stddev)
3. **Seasonal decomposition**: 24-hour and 7-day seasonal patterns for traffic-based metrics
4. **Machine learning models**: Prophet-based forecasting for user activity, API traffic, and storage growth
5. **Log pattern analysis**: Automated clustering of log messages to detect novel error patterns

### Anomaly Types
| Type | Detection | Action |
|------|-----------|--------|
| Spike | Metric exceeds 3x rolling stddev | Alert + auto-diagnostic |
| Drop | Metric falls below 0.5x rolling baseline | Alert + dependency check |
| Trend Change | Sustained deviation over 2+ hours | Alert + trend analysis |
| Seasonal Shift | Pattern deviates from expected seasonal behavior | MEDIUM alert + investigation |
| Novel Error | Error message not seen in previous 7 days | MEDIUM alert + log analysis |

### Auto-Diagnostic Actions
Upon anomaly detection, the system automatically:
1. Captures a snapshot of related metrics (15 min before and after)
2. Correlates with recent deployments (git log)
3. Checks upstream and downstream dependency health
4. Runs a set of synthetic monitoring tests against affected endpoints
5. Creates a diagnostic report in the incident management system

---

## Incident Response Runbook Structure

### Runbook Template

```markdown
# Runbook: [Incident Type Name]

## Description
[Brief description of what this runbook covers]

## Symptoms
- [Symptom 1]
- [Symptom 2]
- [Symptom 3]

## Severity
[SEV1/SEV2/SEV3/SEV4]

## Initial Diagnosis
1. [Step 1: Check dashboard]
2. [Step 2: Check logs]
3. [Step 3: Run diagnostic command]

## Immediate Mitigation
1. [Step 1: e.g., Restart service]
2. [Step 2: e.g., Scale up instances]
3. [Step 3: e.g., Rollback deployment]

## Root Cause Investigation
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Verification
- [How to confirm the fix is working]

## Resolution
- [Steps to apply permanent fix]

## Post-Recovery
- [Steps for cleanup, monitoring, tuning]
```

### Runbook Inventory

| Runbook | Triggers | Location |
|---------|----------|----------|
| API High Latency | `api-latency-p95` alert | `runbooks/api-high-latency.md` |
| API Error Spike | `api-error-rate` alert | `runbooks/api-error-spike.md` |
| AI Pipeline Failure | `ai-pipeline-fail` alert | `runbooks/ai-pipeline-failure.md` |
| Database Connection Exhaustion | `db-connections` alert | `runbooks/db-connection-pool.md` |
| Database Replication Lag | `db-replication-lag` alert | `runbooks/db-replication-lag.md` |
| Redis Memory Pressure | `redis-memory` alert | `runbooks/redis-memory.md` |
| Redis Cache Storm | `redis-hit-rate` alert | `runbooks/redis-cache-storm.md` |
| WebSocket Connection Flood | `ws-connections` alert | `runbooks/ws-connection-flood.md` |
| Upload Service Degradation | `upload-throughput` alert | `runbooks/upload-degradation.md` |
| Service Crash | Container restart detected | `runbooks/service-crash.md` |
| Deployment Failure | Deployment pipeline failure | `runbooks/deployment-failure.md` |
| Security Incident | Auth anomaly, rate limit breach | `runbooks/security-incident.md` |
| Database Corruption | Consistency check failure | `runbooks/db-corruption.md` |
| Certificate Expiry | `cert-expiry` alert | `runbooks/cert-renewal.md` |
| Storage Full | `disk-usage` > 90% | `runbooks/storage-full.md` |

---

## Monitoring Architecture Diagram (Text)

```
[User Browser] ---> [Vercel Edge/CDN] ---> [Next.js Frontend]
                                              |
                                              v
[Monitoring Agent] <--- [NestJS API Gateway] ---> [Health Checks]
       |                     |         |               |
       |                     |         v               v
       |                     |    [Python AI Services] ---> [GPU Workers]
       |                     |         |               |
       |                     v         v               v
       |                [PostgreSQL] [Redis] [Supabase/Cloudinary]
       v
[OpenTelemetry Collector]
       |
       +---> [Metrics Backend (VictoriaMetrics)]
       |         |
       |         +---> [Grafana Dashboards]
       |         +---> [Alertmanager]
       |         +---> [PagerDuty/Slack]
       |
       +---> [Logs Backend (Elasticsearch)]
       |         |
       |         +---> [Kibana Log Explorer]
       |         +---> [Log Alert Rules]
       |
       +---> [Traces Backend (Jaeger/Tempo)]
                 |
                 +---> [Trace Explorer]
                 +---> [Service Map]
```

---

## Monitoring Runbook

### Adding a New Metric
1. Define metric name, type, and labels in the OpenTelemetry instrumentation
2. Expose metric on the `/metrics` endpoint (Prometheus format)
3. Add recording rule or alert rule in Prometheus/VictoriaMetrics config
4. Create or update Grafana dashboard panel
5. Set up alert notification routing
6. Document metric in this file
7. Verify metric appears in dashboard within 5 minutes

### On-Call Rotation
- **Schedule**: Weekly rotation (Mon 09:00 to Mon 09:00)
- **Team**: All backend and infrastructure engineers
- **Primary**: First responder, handles all alerts
- **Secondary**: Backup, handles when primary is occupied
- **Escalation**: After 15 min of no response, secondary is paged; after 30 min, engineering manager
- **Handoff**: Weekly handoff meeting every Monday at 09:00
- **Shadow program**: Junior engineers shadow the on-call rotation for training

### Monitoring Maintenance
- **Dashboard review**: Monthly review of dashboard relevance and metric coverage
- **Alert tuning**: Quarterly review of alert thresholds and false positive rates
- **Tool updates**: Dependency updates for monitoring infrastructure every 2 weeks
- **Data retention**: Verify log and metric retention policies monthly
- **Backup of config**: Grafana dashboards exported to git on every change
