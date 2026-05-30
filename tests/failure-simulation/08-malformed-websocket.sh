#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 8: Malformed WebSocket payloads ==="
log "Sending malformed WebSocket payloads..."

docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    const WebSocket = require('ws');
    const malformedPayloads = [
      'not-json',
      '{"broken json"}',
      '<script>alert(1)</script>',
      null,
      'undefined',
      '{"event":"","data":null}',
      JSON.stringify({ event: 'sync:request', data: { malicious: true, injection: \"' OR 1=1 --\" } }),
      'A'.repeat(1048576), // 1MB payload
    ];

    let tested = 0;
    let errors = 0;

    async function testPayload(payload, index) {
      return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:4000/ws?token=test');
        ws.on('open', () => {
          try {
            ws.send(payload);
          } catch (e) {
            errors++;
          }
          setTimeout(() => {
            ws.close();
            tested++;
            resolve();
          }, 500);
        });
        ws.on('error', () => { errors++; resolve(); });
        setTimeout(() => resolve(), 2000);
      });
    }

    (async () => {
      for (let i = 0; i < malformedPayloads.length; i++) {
        await testPayload(malformedPayloads[i], i);
      }
      console.log('Tested:', tested, 'Errors:', errors);
      // Errors are expected - service should not crash
      process.exit(tested > 0 ? 0 : 1);
    })();
  " 2>/dev/null && pass "Malformed payloads handled without crash" || fail "Crash on malformed payload"

log "Verifying WebSocket gateway still functional after attack..."
check_service_healthy "backend" && pass "Backend healthy after malformed payloads" || fail "Backend not healthy"

log "Complete: 08-malformed-websocket"
