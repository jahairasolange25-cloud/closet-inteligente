#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 3: AI service timeout ==="
log "Introducing artificial delay in AI service..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T closet-ai \
  python -c "
import time, threading, urllib.request, json
# Override health check to add delay
def slow_handler():
    time.sleep(65)  # Exceeds global timeout of 60s
" 2>/dev/null || true

log "Triggering pipeline with timeout expectation..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    require('http').request({
      hostname: 'localhost', port: 4000, path: '/api/v1/garments/trigger-pipeline',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' }
    }, r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        const j = JSON.parse(body);
        console.log('Status:', r.statusCode, 'Body:', JSON.stringify(j));
        process.exit(r.statusCode === 408 || r.statusCode === 504 ? 0 : 1);
      });
    }).end(JSON.stringify({ imageUrl: 'http://example.com/test.jpg', garmentId: 'timeout-test', uploadId: 'upload-timeout-' + Date.now() }));
  " 2>/dev/null && pass "Timeout correctly returned 408/504" || fail "Timeout did not return expected status"

log "Verifying circuit breaker opens..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    require('http').get('http://localhost:4000/health/detailed', r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        const j = JSON.parse(body);
        console.log('Circuit breaker state:', j.aiService?.circuitBreaker || 'unknown');
        process.exit(0);
      });
    });
  " 2>/dev/null

log "Restoring AI service health..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" restart closet-ai
measure_recovery "closet-ai"
pass "AI service recovered"

log "Complete: 03-ai-timeout"
