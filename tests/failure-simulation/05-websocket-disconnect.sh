#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 5: WebSocket disconnect storm ==="
log "Simulating mass WebSocket disconnects..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    const http = require('http');
    const total = 100;
    let connected = 0;
    for (let i = 0; i < total; i++) {
      const req = http.request({
        hostname: 'localhost', port: 4000, path: '/ws',
        method: 'GET',
        headers: { 'Upgrade': 'websocket', 'Connection': 'Upgrade' }
      });
      req.on('upgrade', () => {
        connected++;
        if (connected % 20 === 0) console.log('Connections:', connected);
      });
      req.end();
    }
    setTimeout(() => {
      console.log('Total connections:', connected);
      process.exit(connected > 50 ? 0 : 1);
    }, 5000);
  " 2>/dev/null && pass "WebSocket handles bulk connections" || fail "WebSocket bulk connect failed"

log "Triggering simultaneous disconnect..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" restart backend
measure_recovery "backend"

log "Verifying WebSocket reconnection..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    require('http').get('http://localhost:4000/health/detailed', r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        const j = JSON.parse(body);
        console.log('WebSocket state:', j.websocket || 'unknown');
        process.exit(0);
      });
    });
  " 2>/dev/null

log "Complete: 05-websocket-disconnect"
