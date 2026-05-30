# Failure Simulation Suite — Closet Inteligente

This directory contains failure simulation scripts for testing system resilience.

## Prerequisites

- Docker Compose staging environment running
- bash or PowerShell (scripts provided in both formats)

## Scenarios

| # | Scenario | Script | Validates |
|---|----------|--------|-----------|
| 1 | Redis shutdown during runtime | `01-redis-shutdown.sh` | Queue recovery, cache miss handling |
| 2 | PostgreSQL restart | `02-postgres-restart.sh` | Connection pool recovery, retry logic |
| 3 | AI service timeout | `03-ai-timeout.sh` | Circuit breaker, timeout handling |
| 4 | AI worker crash | `04-ai-worker-crash.sh` | Worker restart, job retry |
| 5 | WebSocket disconnect storms | `05-websocket-disconnect.sh` | Reconnect backoff, rate limiting |
| 6 | Cloudinary failure | `06-cloudinary-failure.sh` | Upload fallback, error UX |
| 7 | Slow uploads | `07-slow-uploads.sh` | Request timeout, progress feedback |
| 8 | Malformed WebSocket payloads | `08-malformed-websocket.sh` | Input validation, error handling |
| 9 | Expired JWT reconnect loops | `09-expired-jwt-loop.sh` | Token refresh, security |
| 10 | Queue worker deadlocks | `10-queue-deadlock.sh` | Deadlock detection, job timeout |

## Usage

```bash
# Run a single scenario
./01-redis-shutdown.sh

# Run all scenarios
./run-all.sh

# Run with custom compose project
COMPOSE_PROJECT=closet-staging ./01-redis-shutdown.sh
```
