# Docker Compose Example — Local Development Environment

> **Purpose:** Reference implementation for Docker Compose configuration in the Closet Inteligente Digital project.
> **Pattern:** Multi-service orchestration → Development & Production profiles → Health checks → Resource limits
> **Stack:** Docker Compose, Next.js, NestJS, Python, PostgreSQL, Redis

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                            │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Frontend │    │ Backend  │    │ AI       │    │ Redis    │  │
│  │ :3000    │◄──►│ :4000    │◄──►│ :8000    │    │ :6379    │  │
│  │ Next.js  │    │ NestJS   │    │ FastAPI  │    │          │  │
│  └──────────┘    └────┬─────┘    └──────────┘    └──────────┘  │
│                       │                                         │
│                       ▼                                         │
│                 ┌──────────┐                                    │
│                 │PostgreSQL│                                    │
│                 │ :5432    │                                    │
│                 └──────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## File: docker-compose.yml

```yaml
# docker/docker-compose.yml
# Development and production profiles for Closet Inteligente Digital

version: '3.9'

name: closet-inteligente

x-logging: &default-logging
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '3'

x-healthcheck: &healthcheck-base
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s

services:
  # ─── Frontend (Next.js) ───────────────────────────────────────
  frontend:
    container_name: closet-frontend
    build:
      context: ../frontend
      dockerfile: ../docker/frontend.Dockerfile
      target: ${NODE_ENV:-development}
      args:
        - NODE_ENV=${NODE_ENV:-development}
    ports:
      - '${FRONTEND_PORT:-3000}:3000'
    volumes:
      - ../frontend:/app
      - /app/node_modules
      - /app/.next
    env_file:
      - ../frontend/.env.local
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - NEXT_PUBLIC_API_URL=http://backend:4000/api/v1
      - NEXT_PUBLIC_WS_URL=http://backend:4000
      - WATCHPACK_POLLING=true
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - closet-network
    restart: unless-stopped
    logging: *default-logging
    labels:
      - 'com.closet-inteligente.service=frontend'
      - 'com.closet-inteligente.environment=${NODE_ENV:-development}'
    profiles:
      - development
      - production

  # ─── Backend (NestJS) ─────────────────────────────────────────
  backend:
    container_name: closet-backend
    build:
      context: ../backend
      dockerfile: ../docker/backend.Dockerfile
      target: ${NODE_ENV:-development}
      args:
        - NODE_ENV=${NODE_ENV:-development}
    ports:
      - '${BACKEND_PORT:-4000}:4000'
    volumes:
      - ../backend:/app
      - /app/node_modules
      - /app/dist
    env_file:
      - ../backend/.env
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - PORT=4000
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - AI_SERVICE_URL=http://ai-service:8000
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'node', '-e', "require('http').get('http://localhost:4000/api/v1/health', (r) => {process.exit(r.statusCode !== 200)})"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - closet-network
    restart: unless-stopped
    logging: *default-logging
    labels:
      - 'com.closet-inteligente.service=backend'
      - 'com.closet-inteligente.environment=${NODE_ENV:-development}'
    profiles:
      - development
      - production

  # ─── AI Service (Python/FastAPI) ──────────────────────────────
  ai-service:
    container_name: closet-ai
    build:
      context: ../services/ai
      dockerfile: ../../docker/python.Dockerfile
      target: ${NODE_ENV:-development}
      args:
        - PYTHON_VERSION=3.11
    ports:
      - '${AI_PORT:-8000}:8000'
    volumes:
      - ../services/ai:/app
      - ai-models:/app/models
      - ai-cache:/app/.cache
    env_file:
      - ../services/ai/.env
    environment:
      - PYTHONUNBUFFERED=1
      - CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES:-}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - LOG_LEVEL=${LOG_LEVEL:-DEBUG}
      - MODEL_CACHE_DIR=/app/models
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s
    networks:
      - closet-network
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: ${GPU_COUNT:-0}
              capabilities: [gpu]
    restart: unless-stopped
    logging: *default-logging
    labels:
      - 'com.closet-inteligente.service=ai'
      - 'com.closet-inteligente.environment=${NODE_ENV:-development}'
    profiles:
      - development
      - production

  # ─── PostgreSQL ───────────────────────────────────────────────
  postgres:
    container_name: closet-postgres
    image: postgres:16-alpine
    ports:
      - '${POSTGRES_PORT:-5432}:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ../backend/prisma/migrations:/docker-entrypoint-initdb.d
    env_file:
      - ../backend/.env
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-closet_user}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-closet_password}
      - POSTGRES_DB=${POSTGRES_DB:-closet_dev}
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --locale=en_US.UTF-8
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-closet_user} -d ${POSTGRES_DB:-closet_dev}']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    networks:
      - closet-network
    restart: unless-stopped
    logging: *default-logging
    labels:
      - 'com.closet-inteligente.service=postgres'
    profiles:
      - development
      - production

  # ─── Redis ────────────────────────────────────────────────────
  redis:
    container_name: closet-redis
    image: redis:7-alpine
    ports:
      - '${REDIS_PORT:-6379}:6379'
    volumes:
      - redis-data:/data
      - ../docker/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: ['redis-server', '/usr/local/etc/redis/redis.conf', '--appendonly', 'yes']
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - closet-network
    restart: unless-stopped
    logging: *default-logging
    labels:
      - 'com.closet-inteligente.service=redis'
    profiles:
      - development
      - production

  # ─── Prisma Studio (Development only) ─────────────────────────
  prisma-studio:
    container_name: closet-prisma-studio
    image: node:20-alpine
    working_dir: /app
    command: sh -c "npx prisma generate && npx prisma studio --port 5555 --host 0.0.0.0"
    volumes:
      - ../backend:/app
    ports:
      - '5555:5555'
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - closet-network
    profiles:
      - development
    logging: *default-logging

  # ─── Mailhog (Development only) ───────────────────────────────
  mailhog:
    container_name: closet-mailhog
    image: mailhog/mailhog:latest
    ports:
      - '8025:8025'
      - '1025:1025'
    networks:
      - closet-network
    profiles:
      - development

  # ─── Minio (Development S3 storage) ───────────────────────────
  minio:
    container_name: closet-minio
    image: minio/minio:latest
    ports:
      - '${MINIO_PORT:-9000}:9000'
      - '${MINIO_CONSOLE_PORT:-9001}:9001'
    volumes:
      - minio-data:/data
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER:-closet_minio}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-closet_minio_secret}
    command: server /data --console-address ':9001'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s
    networks:
      - closet-network
    profiles:
      - development

networks:
  closet-network:
    name: closet-inteligente-network
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1

volumes:
  postgres-data:
    name: closet-postgres-data
    driver: local
  redis-data:
    name: closet-redis-data
    driver: local
  ai-models:
    name: closet-ai-models
    driver: local
  ai-cache:
    name: closet-ai-cache
    driver: local
  minio-data:
    name: closet-minio-data
    driver: local
```

---

## File: frontend.Dockerfile

```dockerfile
# docker/frontend.Dockerfile
# Multi-stage build for Next.js frontend

ARG NODE_VERSION=20

# ─── Base stage ────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ─── Dependencies stage ────────────────────────────────────────
FROM base AS deps
COPY ../frontend/package.json ../frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Development stage ─────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY ../frontend .
EXPOSE 3000
CMD ["pnpm", "dev"]

# ─── Build stage ───────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY ../frontend .
RUN pnpm build

# ─── Production stage ──────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

---

## File: backend.Dockerfile

```dockerfile
# docker/backend.Dockerfile
# Multi-stage build for NestJS backend

ARG NODE_VERSION=20

# ─── Base stage ────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ─── Dependencies stage ────────────────────────────────────────
FROM base AS deps
COPY ../backend/package.json ../backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Development stage ─────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY ../backend .
RUN npx prisma generate
EXPOSE 4000
CMD ["pnpm", "start:dev"]

# ─── Build stage ───────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY ../backend .
RUN npx prisma generate
RUN pnpm build

# ─── Production stage ──────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
USER nodejs
EXPOSE 4000
CMD ["node", "dist/main"]
```

---

## File: python.Dockerfile

```dockerfile
# docker/python.Dockerfile
# Multi-stage build for AI Python service

ARG PYTHON_VERSION=3.11

# ─── Base stage ────────────────────────────────────────────────
FROM python:${PYTHON_VERSION}-slim AS base
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ─── Development stage ─────────────────────────────────────────
FROM base AS development
ENV PYTHONDONTWRITEBYTECODE=1
COPY ../services/ai/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY ../services/ai .
EXPOSE 8000
CMD ["uvicorn", "services.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ─── Build stage ───────────────────────────────────────────────
FROM base AS builder
COPY ../services/ai/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY ../services/ai .
RUN python -c "import torch; print(f'PyTorch {torch.__version__}, CUDA {torch.cuda.is_available()}')"

# ─── Production stage ──────────────────────────────────────────
FROM builder AS production
ENV PYTHONDONTWRITEBYTECODE=1
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["uvicorn", "services.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## File: .env.example

```bash
# docker/.env.example
# Environment variables for Docker Compose

# ─── General ───────────────────────────────────────────────────
NODE_ENV=development
COMPOSE_PROJECT_NAME=closet-inteligente
LOG_LEVEL=DEBUG

# ─── Frontend ──────────────────────────────────────────────────
FRONTEND_PORT=3000

# ─── Backend ───────────────────────────────────────────────────
BACKEND_PORT=4000
JWT_SECRET=change-me-in-production-use-at-least-32-chars
DATABASE_URL=postgresql://closet_user:closet_password@postgres:5432/closet_dev

# ─── PostgreSQL ────────────────────────────────────────────────
POSTGRES_PORT=5432
POSTGRES_USER=closet_user
POSTGRES_PASSWORD=closet_password
POSTGRES_DB=closet_dev

# ─── Redis ─────────────────────────────────────────────────────
REDIS_PORT=6379
REDIS_PASSWORD=

# ─── AI Service ────────────────────────────────────────────────
AI_PORT=8000
CUDA_VISIBLE_DEVICES=
GPU_COUNT=0

# ─── Minio (S3-compatible storage) ─────────────────────────────
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ROOT_USER=closet_minio
MINIO_ROOT_PASSWORD=closet_minio_secret
```

---

## File: redis.conf

```conf
# docker/redis.conf
# Redis configuration for Closet Inteligente Digital

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Security
requirepass ${REDIS_PASSWORD:-}

# Network
bind 0.0.0.0
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Performance
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
replica-lazy-flush yes
```

---

## Usage Commands

```bash
# ─── Development ───────────────────────────────────────────────

# Start all services
docker compose --profile development up -d

# Start specific services
docker compose --profile development up -d backend postgres redis

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Run database migrations
docker compose exec backend npx prisma migrate deploy

# Open Prisma Studio
docker compose --profile development up prisma-studio -d

# Run tests inside container
docker compose exec backend pnpm test
docker compose exec frontend pnpm test
docker compose exec ai-service pytest

# Rebuild a service
docker compose build --no-cache backend
docker compose up -d backend

# ─── Production ────────────────────────────────────────────────

# Start production stack
NODE_ENV=production docker compose --profile production up -d

# Scale AI workers
docker compose up -d --scale ai-service=3

# Check health
docker compose ps
docker compose exec backend curl http://localhost:4000/api/v1/health

# ─── Cleanup ───────────────────────────────────────────────────

# Stop all services
docker compose down

# Stop and remove volumes (destructive)
docker compose down -v

# Clean unused resources
docker system prune -af --volumes
```

---

## Key Patterns Demonstrated

| Pattern | Implementation |
|---------|---------------|
| **Multi-stage Builds** | `base` → `deps` → `development` → `builder` → `production` stages |
| **Development Profiles** | `--profile development` for local dev with hot reload |
| **Production Profiles** | `--profile production` for optimized builds |
| **Health Checks** | Every service has `healthcheck` with proper intervals and start periods |
| **Resource Limits** | `deploy.resources` for GPU reservation, `maxmemory` for Redis |
| **Persistent Volumes** | Named volumes for DB, Redis, AI models, Minio data |
| **Network Isolation** | Custom bridge network with explicit subnet |
| **Environment Variables** | Centralized `.env` file with `env_file` and `environment` sections |
| **GPU Support** | `NVIDIA` device reservation with configurable count |
| **Logging Configuration** | JSON-file driver with rotation limits via YAML anchors |
| **Service Labels** | Docker labels for service discovery and organization |
| **Startup Dependencies** | `depends_on` with `condition: service_healthy` for ordered startup |
