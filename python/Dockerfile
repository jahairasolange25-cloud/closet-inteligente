FROM python:3.11-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0t64 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir ".[ml]"

FROM base

ENV PYTHONUNBUFFERED=1 \
    NUMBA_CACHE_DIR=/tmp/numba_cache \
    U2NET_HOME=/tmp/u2net \
    XDG_CACHE_HOME=/tmp/cache

# Create non-root runtime user with a valid shell for su(1)
RUN groupadd -r closet && useradd -r -g closet -d /app -s /bin/bash closet

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

# Pre-create directories at build time for the non-volume case;
# the docker-entrypoint.sh handles the volume case at runtime.
RUN mkdir -p /app/models /app/uploads/temp /app/uploads/processed /tmp/numba_cache /tmp/u2net /tmp/cache && \
    chown -R closet:closet /app /app/models /app/uploads /tmp/numba_cache /tmp/u2net /tmp/cache

# Download PIFuHD model and code at build time (if internet available)
RUN python scripts/setup_pifuhd.py || echo "PIFuHD setup skipped (build-time)"

EXPOSE 5100

# Production entrypoint: creates dirs, fixes ownership, drops privileges
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
# Single worker — containers scale horizontally; multiple workers
# within a single container cause model-loading contention and
# crash loops with rembg ONNX sessions.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--workers", "1"]
