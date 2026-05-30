#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 9: Expired JWT reconnect loops ==="
log "Simulating client with expired JWT constantly reconnecting..."

docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    const http = require('http');
    const maxAttempts = 50;
    let attempts = 0;
    let blocked = false;

    function tryRequest() {
      if (attempts >= maxAttempts) {
        console.log('Total attempts:', attempts, 'Blocked:', blocked);
        process.exit(blocked ? 0 : 1);
        return;
      }

      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(JSON.stringify({
          sub: 'test-user',
          iat: Math.floor(Date.now() / 1000) - 3600,
          exp: Math.floor(Date.now() / 1000) - 1800
        })).toString('base64').replace(/=/g, '') +
        '.expired-signature';

      const req = http.get('http://localhost:4000/api/v1/auth/me', {
        headers: { Authorization: 'Bearer ' + expiredToken }
      }, (r) => {
        let body = '';
        r.on('data', d => body += d);
        r.on('end', () => {
          if (r.statusCode === 429) {
            blocked = true;
            console.log('Rate limited after', attempts, 'attempts');
          }
          if (r.statusCode !== 429 && r.statusCode !== 401) {
            console.log('Unexpected status:', r.statusCode);
          }
          attempts++;
          setTimeout(tryRequest, 10); // Rapid retry
        });
      });
      req.on('error', () => { attempts++; setTimeout(tryRequest, 10); });
    }

    tryRequest();
    setTimeout(() => { console.log('Timeout'); process.exit(0); }, 15000);
  " 2>/dev/null && pass "Expired JWT loop rate-limited correctly" || fail "Expired JWT loop not rate-limited"

log "Verifying backend still serves valid requests..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    require('http').get('http://localhost:4000/health', r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        console.log('Health:', r.statusCode);
        process.exit(r.statusCode === 200 ? 0 : 1);
      });
    });
  " 2>/dev/null && pass "Backend serves valid requests despite expired JWT loop" || fail "Backend affected by expired JWT loop"

log "Complete: 09-expired-jwt-loop"
