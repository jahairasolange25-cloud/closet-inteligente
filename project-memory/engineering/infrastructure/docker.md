# Docker Infrastructure

## Overview

Multi-container Docker Compose setup for local development and production-like environments.

---

## Docker Compose Configuration

**File:** `docker-compose.yml`

```yaml
version: '3.9'

networks:
  closet-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  model-data:
    driver: local
  upload-data:
    driver: local

services:
  # ========== Frontend ==========
  frontend:
    container_name: closet-frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: ${NODE_ENV:-development}
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:4000/v1}
      - NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL:-ws://localhost:4000/ws}
      - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=${CLOUDINARY_UPLOAD_PRESET}
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - closet-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ========== Backend (NestJS) ==========
  backend:
    container_name: closet-backend
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: ${NODE_ENV:-development}
    ports:
      - "${BACKEND_PORT:-4000}:4000"
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - PORT=4000
      - DATABASE_URL=postgresql://${DB_USER:-closet}:${DB_PASSWORD:-closet_pass}@postgres:5432/${DB_NAME:-closet_db}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:3000}
      - AI_SERVICE_URL=http://ai-service:5100
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - RPM_API_KEY=${RPM_API_KEY}
      - FCM_SERVER_KEY=${FCM_SERVER_KEY}
      - GOOGLE_DRIVE_CREDENTIALS=${GOOGLE_DRIVE_CREDENTIALS}
    volumes:
      - ./backend/src:/app/src
      - upload-data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ai-service:
        condition: service_healthy
    networks:
      - closet-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # ========== AI Service (Python/FastAPI) ==========
  ai-service:
    container_name: closet-ai
    build:
      context: ./services/ai
      dockerfile: Dockerfile
    ports:
      - "${AI_PORT:-5100}:5100"
    environment:
      - CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES:-}
      - MODEL_PATH=/models
      - BATCH_SIZE=4
      - WORKERS=2
      - MAX_IMAGE_SIZE=4096
      - LOG_LEVEL=INFO
    volumes:
      - model-data:/models
      - upload-data:/uploads
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    networks:
      - closet-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5100/health"]
      interval: 30s
      timeout: 15s
      retries: 5
      start_period: 120s

  # ========== Redis ==========
  redis:
    container_name: closet-redis
    image: redis:7.2-alpine
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis-data:/data
      - ./infrastructure/redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-}
    networks:
      - closet-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # ========== PostgreSQL ==========
  postgres:
    container_name: closet-postgres
    image: postgres:16-alpine
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_USER=${DB_USER:-closet}
      - POSTGRES_PASSWORD=${DB_PASSWORD:-closet_pass}
      - POSTGRES_DB=${DB_NAME:-closet_db}
      - PGDATA=/var/lib/postgresql/data/pgdata
    command:
      - "postgres"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "effective_cache_size=768MB"
      - "-c"
      - "work_mem=16MB"
      - "-c"
      - "maintenance_work_mem=64MB"
      - "-c"
      - "random_page_cost=1.1"
      - "-c"
      - "effective_io_concurrency=200"
      - "-c"
      - "wal_buffers=16MB"
      - "-c"
      - "min_wal_size=1GB"
      - "-c"
      - "max_wal_size=4GB"
    networks:
      - closet-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-closet}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # ========== Bull Board (Queue Monitoring) ==========
  bull-board:
    container_name: closet-bullboard
    image: ghcr.io/bull-board/redis:v0.1.0
    ports:
      - "${BULL_BOARD_PORT:-4080}:4080"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - closet-network
    restart: unless-stopped
    profiles:
      - monitoring

  # ========== pgAdmin (Database Admin) ==========
  pgadmin:
    container_name: closet-pgadmin
    image: dpage/pgadmin4:latest
    ports:
      - "${PGADMIN_PORT:-5050}:80"
    environment:
      - PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL:-admin@closet.com}
      - PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD:-admin}
    volumes:
      - pgadmin-data:/var/lib/pgadmin
    depends_on:
      - postgres
    networks:
      - closet-network
    restart: unless-stopped
    profiles:
      - dev
      - monitoring
```

---

## Dockerfile Configurations

### Frontend (Next.js)

**File:** `frontend/Dockerfile`

```dockerfile
# Base stage
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production stage
FROM base AS production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "start"]
```

### Backend (NestJS)

**File:** `backend/Dockerfile`

```dockerfile
# Base stage
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 4000
CMD ["pnpm", "start:dev"]

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production stage
FROM base AS production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app
USER nestjs
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "dist/main"]
```

### AI Service (Python/FastAPI)

**File:** `services/ai/Dockerfile`

```dockerfile
# Base stage
FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM base AS development
COPY . .
EXPOSE 5100
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5100", "--reload"]

# Production stage
FROM base AS production
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .
RUN useradd -m -u 1001 ai-user && chown -R ai-user:ai-user /app
USER ai-user
EXPOSE 5100
ENV PYTHONUNBUFFERED=1
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:5100"]
```

---

## Redis Configuration

**File:** `infrastructure/redis/redis.conf`

```conf
# Redis configuration for Closet Inteligente
bind 0.0.0.0
port 6379
daemonize no
loglevel notice
logfile ""

# Persistence
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Memory management
maxmemory 1gb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Security
# requirepass ${REDIS_PASSWORD} # Set via environment
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command CONFIG ""
rename-command SHUTDOWN ""
```

---

## PostgreSQL Initialization

**File:** `infrastructure/postgres/init.sql`

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS closet;
SET search_path TO closet, public;

-- Apply full schema (see database-schema.md)
\i /docker-entrypoint-initdb.d/schema.sql
```

---

## Environment Variables Reference

| Variable | Default | Service | Description |
|----------|---------|---------|-------------|
| `NODE_ENV` | `development` | All | Environment mode |
| `FRONTEND_PORT` | `3000` | Frontend | Host port |
| `BACKEND_PORT` | `4000` | Backend | Host port |
| `AI_PORT` | `5100` | AI Service | Host port |
| `REDIS_PORT` | `6379` | Redis | Host port |
| `DB_PORT` | `5432` | PostgreSQL | Host port |
| `DB_USER` | `closet` | PostgreSQL | Database user |
| `DB_PASSWORD` | `closet_pass` | PostgreSQL | Database password |
| `DB_NAME` | `closet_db` | PostgreSQL | Database name |
| `DATABASE_URL` | — | Backend | Full connection string |
| `REDIS_HOST` | `redis` | Backend, AI | Redis hostname |
| `JWT_ACCESS_SECRET` | — | Backend | JWT signing secret |
| `JWT_REFRESH_SECRET` | — | Backend | Refresh token secret |
| `CORS_ORIGIN` | `http://localhost:3000` | Backend | Allowed origins |
| `CLOUDINARY_*` | — | Backend | Cloudinary credentials |
| `RPM_API_KEY` | — | Backend | Ready Player Me key |
| `FCM_SERVER_KEY` | — | Backend | Firebase key |

---

## Resource Limits

| Service | CPU Limit | Memory Limit | Memory Reservation |
|---------|-----------|--------------|-------------------|
| Frontend | 1.0 | 1 GB | 512 MB |
| Backend | 2.0 | 2 GB | 1 GB |
| AI Service | 4.0 | 8 GB | 4 GB |
| Redis | 0.5 | 1 GB | 512 MB |
| PostgreSQL | 2.0 | 2 GB | 1 GB |

```yaml
# Example resource limits in docker-compose
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

---

## Docker Compose Profiles

```bash
# Development (default)
docker compose up -d

# Development with monitoring
docker compose --profile monitoring up -d

# Full stack with all tools
docker compose --profile dev --profile monitoring up -d

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Health Check Summary

| Service | Endpoint/Command | Interval | Timeout | Retries | Start Period |
|---------|-----------------|----------|---------|---------|--------------|
| Frontend | `curl localhost:3000/api/health` | 30s | 10s | 3 | 40s |
| Backend | `curl localhost:4000/health` | 30s | 10s | 3 | 60s |
| AI Service | `curl localhost:5100/health` | 30s | 15s | 5 | 120s |
| Redis | `redis-cli ping` | 10s | 5s | 3 | 0s |
| PostgreSQL | `pg_isready` | 10s | 5s | 5 | 30s |
