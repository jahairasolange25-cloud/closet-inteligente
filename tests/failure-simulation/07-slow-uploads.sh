#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 7: Slow uploads ==="
log "Simulating large upload with slow connection..."

{
  timeout 60 node -e "
    const http = require('http');
    const chunk = Buffer.alloc(65536, 'A');
    const totalSize = 50 * 1024 * 1024; // 50MB
    let sent = 0;

    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/storage/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----test',
        'Content-Length': totalSize.toString()
      }
    }, (r) => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        console.log('Status:', r.statusCode, 'Body:', body.substring(0, 200));
        // Expect 413 (too large) or timeout handling
        process.exit(r.statusCode === 413 || r.statusCode === 408 || r.statusCode === 400 ? 0 : 1);
      });
    });

    req.on('error', (e) => {
      console.log('Request error (expected):', e.message);
      process.exit(0); // Connection reset is acceptable
    });

    // Slow upload: send at ~1MB/s
    const interval = setInterval(() => {
      if (sent >= totalSize) {
        clearInterval(interval);
        req.end();
        return;
      }
      const toSend = Math.min(chunk.length, totalSize - sent);
      req.write(chunk.subarray(0, toSend));
      sent += toSend;
    }, 65); // ~1MB/s
  " 2>&1
} && pass "Slow upload handled (timeout or rejection)" || fail "Slow upload caused unexpected behavior"

log "Checking backend still healthy after slow upload..."
check_service_healthy "backend" && pass "Backend healthy after slow upload" || fail "Backend not healthy"

log "Complete: 07-slow-uploads"
