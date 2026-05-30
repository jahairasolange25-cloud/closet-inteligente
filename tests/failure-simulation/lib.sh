#!/bin/bash
set -euo pipefail

COMPOSE_PROJECT="${COMPOSE_PROJECT:-closet-inteligente}"
COMPOSE_FILE="${COMPOSE_FILE:-../../docker-compose.staging.yml}"
SIMULATION_LOG="simulation-$(date +%Y%m%d-%H%M%S).log"

log() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "$SIMULATION_LOG"
}

pass() {
  log "PASS: $*"
}

fail() {
  log "FAIL: $*"
}

check_service_healthy() {
  local service="$1"
  local container
  container=$(docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null)
  if [ -z "$container" ]; then
    return 1
  fi
  local status
  status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null)
  [ "$status" = "healthy" ]
}

wait_for_service() {
  local service="$1"
  local timeout="${2:-60}"
  log "Waiting for $service to be healthy (timeout: ${timeout}s)..."
  for i in $(seq 1 "$timeout"); do
    if check_service_healthy "$service"; then
      pass "$service is healthy after ${i}s"
      return 0
    fi
    sleep 1
  done
  fail "$service did not become healthy within ${timeout}s"
  return 1
}

measure_recovery() {
  local service="$1"
  local start
  start=$(date +%s)
  wait_for_service "$service" 120
  local end
  end=$(date +%s)
  log "Recovery time for $service: $((end - start))s"
}
