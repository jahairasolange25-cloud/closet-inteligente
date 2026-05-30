# Load Test Report

> **Generated:** 2026-05-27
> **Tool:** k6
> **Location:** `tests/performance/`

---

## Test Scenarios

| Scenario | File | VUs | Duration | Metrics Collected |
|----------|------|-----|----------|-------------------|
| Auth Burst | `scenarios/auth-burst.js` | 20→50→100 | 70s | login/register duration, error rate |
| Upload Concurrency | `scenarios/upload-concurrency.js` | 5→20→10 | 135s | upload duration, size distribution |
| WebSocket Concurrency | `scenarios/websocket-concurrency.js` | 20→100→50 | 70s | connect duration, message latency |
| Outfit Generation | `scenarios/outfit-generation.js` | 10→30→15 | 70s | create/recommend duration |
| AI Queue Pressure | `scenarios/ai-queue-pressure.js` | 5→10→15 | 180s | pipeline duration, queue depth |
| Export Generation | `scenarios/export-generation.js` | 5→15→10 | 70s | export duration, poll time |
| Full Suite | `scenarios/full-suite.js` | 10→50→80 | 210s | All endpoints, composite |

## Running Tests

```bash
# Install k6 first: https://k6.io/docs/getting-started/installation/

# Run individual scenario
cd tests/performance
k6 run --vus 50 --duration 60s scenarios/auth-burst.js

# Run all scenarios with report
k6 run --summary-export=report.json scenarios/full-suite.js
```

## Expected Metrics

| Metric | Target p95 | Target p99 | Max Error Rate |
|--------|------------|------------|----------------|
| Auth requests | <2s | <5s | <5% |
| Upload | <6s | <15s | <10% |
| WebSocket connect | <2s | <5s | <5% |
| Outfit CRUD | <2s | <5s | <5% |
| Pipeline | <20s | <30s | <10% |
| Export | <5s | <10s | <5% |
| General API | <4s | <10s | <8% |

## Custom Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `auth_errors` | Rate | — |
| `login_duration` | Trend | — |
| `register_duration` | Trend | — |
| `refresh_duration` | Trend | — |
| `upload_errors` | Rate | — |
| `upload_duration` | Trend | — |
| `upload_size_bytes` | Trend | — |
| `ws_connect_errors` | Rate | — |
| `ws_connect_duration` | Trend | — |
| `ws_message_latency` | Trend | — |
| `outfit_errors` | Rate | — |
| `outfit_create_duration` | Trend | — |
| `outfit_recommend_duration` | Trend | — |
| `ai_queue_errors` | Rate | — |
| `ai_queue_depth` | Trend | — |
| `pipeline_duration` | Trend | — |
| `export_errors` | Rate | — |
| `export_request_duration` | Trend | — |

## Memory Leak Detection

During high-load scenarios, monitor:
- `closet_process_memory_bytes` — stable or growing?
- `closet_redis_memory_used_bytes` — bounded?
- BullMQ queue depth — draining completely?

## Degradation Behavior

Under load:
- Rate limiting kicks in at 120 req/min per user (staging config)
- Queue backpressure via BullMQ
- WebSocket reconnects with exponential backoff (1s → 30s max)
- Circuit breaker on AI service (opens after 5 failures in 30s)
