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

PORT="${PORT:-5100}"
echo "docker-entrypoint: binding to port ${PORT}"
echo "docker-entrypoint: python=$(which python) uvicorn=$(which uvicorn 2>&1 || echo NOT_FOUND)"
echo "docker-entrypoint: testing app import..."
python -c "
import sys
print('  sys.path:', sys.path[:3])
try:
    import app.main
    print('  app.main imported OK, router count:', len(app.main.app.routes))
except Exception as e:
    print('  IMPORT ERROR:', e)
    sys.exit(1)
"

echo "docker-entrypoint: starting uvicorn on port ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --workers 1 --port "${PORT}"