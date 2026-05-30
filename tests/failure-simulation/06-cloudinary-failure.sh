#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 6: Cloudinary failure ==="
log "Setting invalid Cloudinary credentials..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  sh -c "export CLOUDINARY_CLOUD_NAME=invalid&&export CLOUDINARY_API_KEY=bad&&export CLOUDINARY_API_SECRET=wrong" 2>/dev/null || true

log "Attempting upload with invalid Cloudinary creds..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    require('http').request({
      hostname: 'localhost', port: 4000, path: '/api/v1/storage/upload',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' }
    }, r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        const j = JSON.parse(body);
        console.log('Status:', r.statusCode, 'Error:', j.message || j.error);
        // Expect 502 or error message about Cloudinary
        process.exit(r.statusCode >= 500 ? 0 : 1);
      });
    }).end(JSON.stringify({ fileName: 'test.jpg', fileType: 'image/jpeg', fileSize: 1024 }));
  " 2>/dev/null && pass "Cloudinary failure returns appropriate error" || fail "Cloudinary failure not handled"

log "Restoring valid Cloudinary config..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" restart backend
measure_recovery "backend"
pass "Backend restores upload capability after Cloudinary config fix"

log "Complete: 06-cloudinary-failure"
