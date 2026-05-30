#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 4: AI worker crash ==="
log "Killing AI worker process inside container..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T closet-ai \
  sh -c "kill -9 \$(pidof python) 2>/dev/null || kill -9 \$(pgrep -f uvicorn) 2>/dev/null" || true

log "Checking container restart policy..."
sleep 10

if check_service_healthy "closet-ai"; then
  pass "AI service auto-restarted and healthy"
else
  log "Waiting longer for restart..."
  measure_recovery "closet-ai"
fi

log "Verifying AI service processes new requests..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T closet-ai \
  python -c "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://localhost:5100/health').status == 200 else 1)" \
  && pass "AI service processes requests after crash" \
  || fail "AI service not processing requests"

log "Complete: 04-ai-worker-crash"
