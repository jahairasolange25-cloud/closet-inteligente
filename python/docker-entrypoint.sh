#!/bin/bash
set -e

mkdir -p /app/models \
         /app/uploads/temp \
         /app/uploads/processed \
         /app/pifuhd/checkpoints \
         /app/pifuhd/results \
         /app/pifuhd/data \
         /tmp/numba_cache \
         /tmp/u2net \
         /tmp/cache

chown -R closet:closet /app/models /app/uploads /app/pifuhd /tmp/numba_cache /tmp/u2net /tmp/cache

echo "docker-entrypoint: startup directories ready"
PORT="${PORT:-5100}"
echo "docker-entrypoint: binding to port ${PORT}"

exec python -u /app/test_minimal_app.py