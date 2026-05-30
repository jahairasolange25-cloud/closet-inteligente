# Incident Response Runbook — Closet Inteligente Digital
> Last Updated: 2026-05-27

---

## Severity Levels

| Level | Description | Response Time | Examples |
|---|---|---|---|
| P0 | Full service outage | Immediate | All requests failing, DB down |
| P1 | Critical feature broken | < 15 min | Auth broken, uploads failing |
| P2 | Degraded performance | < 1 hour | Slow queries, queue backlog |
| P3 | Minor issue | < 4 hours | One endpoint slow, minor bug |

---

## P0: Full Service Outage

### Symptoms
- Health endpoint returns non-200: `curl http://host/health`
- All API requests return 500 or connection refused

### Triage
```bash
# 1. Check all services
docker compose ps
docker compose logs --tail=50 backend
docker compose logs --tail=50 postgres
docker compose logs --tail=50 redis

# 2. Check disk space
df -h

# 3. Check memory
free -m

# 4. Check DB connection
docker compose exec postgres pg_isready

# 5. Check Redis connection
docker compose exec redis redis-cli ping
```

### Resolution
```bash
# Restart all services
docker compose -f docker-compose.staging.yml restart

# If that fails — full restart
docker compose -f docker-compose.staging.yml down
docker compose -f docker-compose.staging.yml up -d

# If DB is down
docker compose -f docker-compose.staging.yml start postgres
# Wait 10 seconds
docker compose -f docker-compose.staging.yml restart backend

# If Redis is down — backend has graceful degradation
# Rate limiting and token blacklist will not work during Redis outage
docker compose -f docker-compose.staging.yml start redis
```

---

## P1: Auth System Failure

### Symptoms
- Login returns 401/500 for valid credentials
- "TOKEN_REVOKED" errors for valid sessions

### Triage
```bash
# Check Redis blacklist
docker compose exec redis redis-cli keys "blacklisted:*" | head -20

# Check JWT secret is set
docker compose exec backend printenv JWT_SECRET | wc -c
# Should be > 64

# Test auth directly
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test"}'
```

### Resolution
```bash
# If Redis is down — all tokens appear invalid due to missing blacklist data
# Restart Redis first
docker compose restart redis
docker compose restart backend

# If JWT secret rotated accidentally — ALL active sessions are invalidated
# Users must log in again (expected behavior after secret rotation)
# DO NOT rotate JWT_SECRET in production unless absolutely necessary

# If token flood from compromised account
docker compose exec redis redis-cli eval "
  local keys = redis.call('keys', 'user:tokens:*')
  for _,k in ipairs(keys) do redis.call('del', k) end
  return #keys" 0
```

---

## P1: Storage / Upload Failure

### Symptoms
- Garment uploads return 503
- "STORAGE_NOT_CONFIGURED" or "CLOUDINARY_UPLOAD_FAILED"

### Triage
```bash
# Check Cloudinary credentials
docker compose exec backend printenv CLOUDINARY_CLOUD_NAME
docker compose exec backend printenv CLOUDINARY_API_KEY

# Test Cloudinary connectivity
curl -u "api_key:api_secret" https://api.cloudinary.com/v1_1/cloud_name/resources/image
```

### Resolution
```bash
# If credentials missing
docker compose down
# Edit .env file — add Cloudinary credentials
docker compose up -d

# If Cloudinary is having an outage
# uploadTemp will still work (local disk) — pipeline will fail
# Monitor https://status.cloudinary.com/
# No code change needed — service recovers automatically when Cloudinary is back
```

---

## P1: AI Pipeline Queue Backlog

### Symptoms
- Pipeline status stuck at "pending" or "processing" for > 5 minutes
- BullMQ queue depth growing (check metrics)

### Triage
```bash
# Check queue depth via Redis
docker compose exec redis redis-cli llen pipeline
docker compose exec redis redis-cli keys "bull:pipeline:*" | wc -l

# Check AI service
curl http://localhost:5100/health
docker compose logs --tail=50 closet-ai

# Check pipeline worker logs
docker compose logs --tail=100 backend | grep "\[Queue\]"
```

### Resolution
```bash
# If AI service is down — jobs will accumulate in queue with retries
docker compose restart closet-ai
# Worker will automatically pick up queued jobs when AI service recovers

# If circuit breaker is open (5 failures in 30 seconds)
# Wait 30 seconds — circuit will reset automatically
# Check: curl http://localhost:5100/health

# If jobs are stuck (stalled)
# BullMQ auto-handles stalled jobs on worker restart
docker compose restart backend

# Clear DLQ (dead letter queue) — inspect before clearing
docker compose exec redis redis-cli keys "bull:pipeline:dead:*"
# Review failed jobs before clearing
```

---

## P2: High Error Rate / Slow Queries

### Symptoms
- p95 response time > 2s
- Database CPU > 80%

### Triage
```bash
# Check slow queries in PostgreSQL
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "SELECT pid, now()-query_start AS duration, query FROM pg_stat_activity WHERE state='active' ORDER BY duration DESC LIMIT 10;"

# Kill long-running query
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='active' AND now()-query_start > interval '30 seconds';"

# Check connection pool
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "SELECT count(*) FROM pg_stat_activity GROUP BY state;"
```

### Resolution
```bash
# Add index if missing (identify slow query first)
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "EXPLAIN ANALYZE <slow_query>;"

# Restart backend to reset connection pool
docker compose restart backend
```

---

## P2: Redis Memory High

### Symptoms
- Redis used_memory > 80% of maxmemory
- Cache evictions increasing

### Resolution
```bash
# Check memory
docker compose exec redis redis-cli info memory | grep used_memory_human

# Clear old audit logs (keep last 1000 entries)
docker compose exec redis redis-cli ltrim audit:log -1000 -1

# Clear expired pipeline status keys
docker compose exec redis redis-cli eval "
  local keys = redis.call('keys', 'pipeline:*')
  local deleted = 0
  for _,k in ipairs(keys) do
    if redis.call('ttl', k) == -1 then
      redis.call('del', k)
      deleted = deleted + 1
    end
  end
  return deleted" 0
```

---

## Security Incident: Token Compromise

### Symptoms
- Unauthorized API requests from known-bad IP
- Multiple login failures followed by success from different location

### Immediate Response
```bash
# 1. Revoke ALL tokens for the affected user
# Get userId from audit logs first
docker compose exec redis redis-cli eval "
  local keys = redis.call('keys', 'user:tokens:<USER_ID>:*')
  for _,k in ipairs(keys) do redis.call('del', k) end
  return #keys" 0

# 2. Force password reset (manual DB update)
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "UPDATE users SET password_hash='RESET_REQUIRED', updated_at=NOW() WHERE id='<USER_ID>';"

# 3. Review audit log for affected user
grep '"userId":"<USER_ID>"' /logs/audit-$(date +%Y-%m-%d).jsonl | tail -50

# 4. If systemic breach — rotate JWT_SECRET (invalidates ALL sessions)
# Update JWT_SECRET in .env
# docker compose down && docker compose up -d
# WARN: ALL users will be logged out
```

---

## Contact Escalation

| Level | Contact | Method |
|---|---|---|
| On-call engineer | Check PagerDuty | PagerDuty alert |
| Database issues | DBA on-call | Slack #incidents |
| Cloudinary outage | status.cloudinary.com | Email alert |
| Security incident | Security team | Direct message + Slack |
