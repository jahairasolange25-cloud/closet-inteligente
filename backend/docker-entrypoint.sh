#!/bin/sh
set -e

echo "[entrypoint] Waiting for PostgreSQL..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-closet}" 2>/dev/null; do
  sleep 1
done
echo "[entrypoint] PostgreSQL is ready."

echo "[entrypoint] Running database migrations..."
node scripts/run-migrations.js
echo "[entrypoint] Migrations complete."

echo "[entrypoint] Starting application..."
exec "$@"
