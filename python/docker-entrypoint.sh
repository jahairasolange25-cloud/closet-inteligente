#!/bin/bash
set -e

# ============================================================
# docker-entrypoint.sh — closet-ai production entrypoint
#
# Runs as root to ensure all runtime directories exist with
# correct ownership, then drops privileges to the 'closet'
# user for the application process.
#
# This is the standard Docker pattern for handling named
# volumes that are empty/root-owned on first mount.
# ============================================================

# Create all required runtime directories.
# Named volumes like shared-uploads:/app/uploads are empty and
# root-owned when first created — this ensures the 'closet'
# user can write to them.
mkdir -p /app/models \
         /app/uploads/temp \
         /app/uploads/processed \
         /tmp/numba_cache \
         /tmp/u2net \
         /tmp/cache

# Assign ownership to the runtime user.
# The RUN instruction in the Dockerfile only covers image-
# build-time directories; this handles runtime volumes.
chown -R closet:closet /app/models /app/uploads /tmp/numba_cache /tmp/u2net /tmp/cache

echo "docker-entrypoint: startup directories ready, dropping privileges to closet"

# Drop privileges and execute the CMD as the 'closet' user.
# This is safer than running the ASGI server as root.
exec su -s /bin/bash closet -c "exec $*"
