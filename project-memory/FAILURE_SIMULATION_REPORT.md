# Failure Simulation Report

> **Generated:** 2026-05-27
> **Scripts:** `tests/failure-simulation/`

---

## Scenario Coverage

| # | Scenario | Script | What It Tests | Expected Recovery |
|---|----------|--------|---------------|-------------------|
| 1 | Redis shutdown | `01-redis-shutdown.sh` | Queue recovery, degraded mode | Auto-restart, cache rebuild |
| 2 | PostgreSQL restart | `02-postgres-restart.sh` | Connection pool, retry | Pool reconnects, queries resume |
| 3 | AI service timeout | `03-ai-timeout.sh` | Circuit breaker, timeout | Returns 408/504, retry after recovery |
| 4 | AI worker crash | `04-ai-worker-crash.sh` | Restart policy, job retry | Docker auto-restart, BullMQ retry |
| 5 | WebSocket disconnect storm | `05-websocket-disconnect.sh` | Mass connect/disconnect | Backend stable, no leaks |
| 6 | Cloudinary failure | `06-cloudinary-failure.sh` | Upload fallback, error UX | Returns 502, graceful degradation |
| 7 | Slow uploads | `07-slow-uploads.sh` | Request timeout, body limit | 413/408 response |
| 8 | Malformed WebSocket | `08-malformed-websocket.sh` | Input validation | Rejects without crash |
| 9 | Expired JWT loop | `09-expired-jwt-loop.sh` | Rate limiting, auth guards | 429 after rate limit |
| 10 | Queue worker deadlock | `10-queue-deadlock.sh` | Job processing, queue drain | All jobs complete |

## Running

```bash
# Single scenario
./tests/failure-simulation/01-redis-shutdown.sh

# All scenarios (requires Docker staging environment)
cd tests/failure-simulation
for f in [0-9]*.sh; do
  bash "$f" 2>&1 | tee -a "run-$(date +%Y%m%d).log"
done
```

## Resilience Guarantees

- All services have `restart: unless-stopped` policy
- Backend has healthcheck before frontend starts
- BullMQ jobs retry with exponential backoff (3 attempts)
- HTTP AIPipelineAdapter has circuit breaker (5 failures → open, 30s half-open)
- Database pool auto-reconnects on connection loss
- WebSocket reconnects with exponential backoff (1s → 30s)
- Rate limiting prevents abuse during failure storms

## Known Gaps

1. No Redis cluster — single point of failure (acceptable for staging)
2. No DB read replicas — backend goes read-only during failover
3. No CDN for static assets — nginx serves directly
4. No health check on backend in dev compose (fixed in staging)
