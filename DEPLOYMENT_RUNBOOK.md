# Deployment Runbook — Closet Inteligente Digital
> Last Updated: 2026-05-27  
> Environment: Staging / Production (Docker Compose)

---

## Pre-Deployment Checklist

### Required Secrets (DO NOT DEPLOY WITHOUT THESE)
```
CLOUDINARY_CLOUD_NAME   — Cloudinary account name
CLOUDINARY_API_KEY      — Cloudinary API key
CLOUDINARY_API_SECRET   — Cloudinary API secret
JWT_SECRET              — Min 64 chars random string (openssl rand -hex 64)
REFRESH_JWT_SECRET      — Min 64 chars random string, DIFFERENT from JWT_SECRET
DATABASE_URL            — postgres://user:pass@host:5432/dbname
REDIS_URL               — redis://:password@host:6379
CORS_ORIGIN             — https://yourdomain.com (no trailing slash)
```

### Optional Secrets
```
REDIS_PASSWORD          — Required if Redis has auth
CSP_REPORT_URI          — CSP violation reporting endpoint
SENTRY_DSN              — Error monitoring (optional)
AI_SERVICE_URL          — http://closet-ai:5100 (internal Docker network)
```

### Pre-Deployment Validation
```bash
# 1. Verify all required env vars are set
docker compose -f docker-compose.staging.yml config

# 2. Check Docker images build cleanly
docker compose -f docker-compose.staging.yml build --no-cache

# 3. Run backend build
cd backend && npm run build

# 4. Run frontend build
cd frontend && pnpm build

# 5. Run Python tests
cd python && python -m pytest tests/ -v

# 6. Run backend tests
cd backend && npm test
```

---

## Deployment Steps

### Step 1: Database Migration
```bash
# Always run migrations BEFORE deploying new code
docker compose -f docker-compose.staging.yml run --rm backend \
  node -e "require('./src/database/run-migrations')"

# Verify migration count
docker compose -f docker-compose.staging.yml exec postgres \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT COUNT(*) FROM schema_migrations;"
# Expected: 39 rows
```

### Step 2: Start Infrastructure
```bash
docker compose -f docker-compose.staging.yml up -d postgres redis
# Wait for healthy
docker compose -f docker-compose.staging.yml ps
```

### Step 3: Start Services
```bash
docker compose -f docker-compose.staging.yml up -d closet-ai backend frontend nginx
```

### Step 4: Health Check
```bash
# Backend health
curl -f http://localhost:4000/health || echo "BACKEND UNHEALTHY"

# AI service health
curl -f http://localhost:5100/health || echo "AI UNHEALTHY"

# Frontend
curl -f http://localhost:3000 || echo "FRONTEND UNHEALTHY"

# All services via nginx
curl -f http://localhost/health || echo "NGINX UNHEALTHY"
```

### Step 5: Verify Critical Flows
```bash
# Register test user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"deploy-test@test.com","password":"TestPass!123","name":"Deploy Test"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"deploy-test@test.com","password":"TestPass!123"}' \
  | jq -r '.tokens.accessToken')
echo "Token: $TOKEN"

# Create garment
curl -X POST http://localhost:4000/api/v1/garments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Deploy Test Garment","type":"shirt","color":"blue"}'
```

### Step 6: Start Observability
```bash
docker compose -f docker-compose.staging.yml up -d prometheus grafana otel-collector
# Grafana: http://localhost:3002 (admin/admin — CHANGE ON FIRST LOGIN)
# Prometheus: http://localhost:9090
```

---

## Rollback Procedure

```bash
# Stop all services
docker compose -f docker-compose.staging.yml down

# Restore previous image tag
# Edit docker-compose.staging.yml → change image tags to previous version

# Restore database if needed (see BACKUP_RECOVERY_RUNBOOK.md)
pg_restore -U $POSTGRES_USER -d $POSTGRES_DB /backups/latest.dump

# Restart with previous version
docker compose -f docker-compose.staging.yml up -d
```

---

## SSL/TLS Configuration (REQUIRED FOR PRODUCTION)

**STOP: Do not serve real user data without SSL.**

```bash
# Install certbot (Let's Encrypt)
apt install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Update infrastructure/nginx/nginx.conf
# Uncomment the HTTPS server block
# Set ssl_certificate and ssl_certificate_key paths

# Restart nginx
docker compose -f docker-compose.staging.yml restart nginx
```

---

## Zero-Downtime Deployment (When Multiple Instances Available)

1. Deploy new version to a second instance
2. Health check new instance
3. Swap load balancer target to new instance
4. Keep old instance running for 5 minutes
5. Shut down old instance

---

## Post-Deployment Monitoring

Watch these for the first 30 minutes after deployment:
- Error rate: `http_req_failed` in Grafana
- Auth failures: Security logs in `/logs/audit-YYYY-MM-DD.jsonl`
- Pipeline queue depth: BullMQ dashboard (if configured)
- Memory usage: Docker stats

```bash
docker stats --no-stream
docker compose -f docker-compose.staging.yml logs --tail=100 backend
```
