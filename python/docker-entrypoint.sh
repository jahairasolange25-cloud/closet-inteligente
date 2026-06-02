#!/bin/bash
set -e

mkdir -p /app/models \
         /app/uploads/temp \
         /app/uploads/processed \
         /tmp/numba_cache \
         /tmp/u2net \
         /tmp/cache

chown -R closet:closet /app/models /app/uploads /tmp/numba_cache /tmp/u2net /tmp/cache

echo "docker-entrypoint: startup directories ready"
echo "docker-entrypoint: binding to port ${PORT:-5100}"

MINIMAL_APP="${MINIMAL_APP:-0}" exec python -u /app/test_minimal_app.py