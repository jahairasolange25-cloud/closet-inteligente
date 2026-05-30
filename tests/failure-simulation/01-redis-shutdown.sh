#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 1: Redis shutdown during runtime ==="
log "Stopping Redis container..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" stop redis

log "Waiting 15s with Redis down..."
sleep 15

log "Checking backend still responds (degraded mode)..."
if docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "require('http').get('http://localhost:4000/health', r => { process.exit(r.statusCode === 200 ? 0 : 1) })" 2>/dev/null; then
  pass "Backend responds without Redis (degraded mode works)"
else
  fail "Backend failed without Redis"
fi

log "Restarting Redis..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" start redis
measure_recovery "redis"

log "Verifying queue and cache recovery..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "require('http').get('http://localhost:4000/health/detailed', r => { process.exit(r.statusCode === 200 ? 0 : 1) })" 2>/dev/null \
  && pass "Backend recovered after Redis restart" \
  || fail "Backend did not recover"

log "Complete: 01-redis-shutdown"
