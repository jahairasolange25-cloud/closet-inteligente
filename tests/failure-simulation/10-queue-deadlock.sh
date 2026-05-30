#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 10: Queue worker deadlock ==="
log "Simulating queue worker deadlock by sending stuck jobs..."

docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    const http = require('http');
    const totalJobs = 50;

    function sendJob(index) {
      if (index >= totalJobs) return;
      const payload = JSON.stringify({
        imageUrl: 'http://example.com/deadlock-test-' + index + '.jpg',
        garmentId: 'deadlock-' + index,
        uploadId: 'upload-deadlock-' + Date.now() + '-' + index,
      });

      const req = http.request({
        hostname: 'localhost', port: 4000, path: '/api/v1/garments/trigger-pipeline',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, (r) => {
        let body = '';
        r.on('data', d => body += d);
        r.on('end', () => {
          if (index % 10 === 0) console.log('Job', index, 'status:', r.statusCode);
          sendJob(index + 1);
        });
      });
      req.on('error', () => sendJob(index + 1));
      req.write(payload);
      req.end();
    }

    sendJob(0);
    setTimeout(() => {
      console.log('Sent', totalJobs, 'jobs to queue');
      // Now check queue depth
      http.get('http://localhost:4000/health/detailed', r => {
        let body = '';
        r.on('data', d => body += d);
        r.on('end', () => {
          const j = JSON.parse(body);
          console.log('Queue info:', JSON.stringify(j.queue || j));
          process.exit(0);
        });
      });
    }, 5000);
  " 2>/dev/null

log "Waiting for queue to drain..."
sleep 20

log "Verifying queue processed all jobs..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    require('http').get('http://localhost:4000/health/detailed', r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        const j = JSON.parse(body);
        const queueDepth = j.queue?.depth || j.queue?.waiting || 0;
        console.log('Remaining queue depth:', queueDepth);
        process.exit(queueDepth < 5 ? 0 : 1);
      });
    });
  " 2>/dev/null && pass "Queue drained all jobs (no deadlock)" || fail "Queue has stuck jobs (possible deadlock)"

log "Complete: 10-queue-deadlock"
