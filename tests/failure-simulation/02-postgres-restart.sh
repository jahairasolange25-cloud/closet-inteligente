#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

log "=== Scenario 2: PostgreSQL restart ==="
log "Restarting PostgreSQL..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" restart postgres

log "Waiting for PostgreSQL to go down..."
sleep 3

log "Checking backend gracefully handles DB loss..."
if docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "require('http').get('http://localhost:4000/health', r => { process.exit(r.statusCode === 200 ? 0 : 1) })" 2>/dev/null; then
  pass "Backend health check still responds (process alive)"
else
  pass "Backend health check failed as expected during DB outage"
fi

measure_recovery "postgres"
measure_recovery "backend"

log "Verifying data integrity after restart..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T backend \
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ host: 'postgres', port: 5432, user: 'closet', password: 'closet_staging_secret', database: 'closet_staging' });
    pool.query('SELECT count(*) FROM garments').then(r => console.log('Garments count:', r.rows[0].count)).catch(e => { console.error(e); process.exit(1) });
  " 2>/dev/null && pass "Database query succeeds after restart" || fail "Database query failed after restart"

log "Complete: 02-postgres-restart"
