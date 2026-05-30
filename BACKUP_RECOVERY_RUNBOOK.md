# Backup & Recovery Runbook — Closet Inteligente Digital
> Last Updated: 2026-05-27

---

## Backup Strategy

| Data | Frequency | Retention | Location |
|---|---|---|---|
| PostgreSQL full dump | Daily (03:00 UTC) | 30 days | `/backups/daily/` |
| PostgreSQL WAL | Continuous | 7 days | `/backups/wal/` |
| Redis RDB snapshot | Every 15 min | 24 hours | `/backups/redis/` |
| Cloudinary assets | Cloudinary manages | Indefinite | Cloudinary CDN |
| Application config | On change | Forever | Git repo |
| Audit logs | Daily rotation | 90 days | `/logs/` |

---

## Database Backup

### Automated Daily Backup Script
```bash
#!/bin/bash
# /etc/cron.d/closet-backup
# 0 3 * * * root /opt/closet/scripts/backup-db.sh

set -euo pipefail
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups/daily"
mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --format=custom \
  --no-owner \
  --no-acl \
  > "$BACKUP_DIR/closet-$DATE.dump"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.dump" -mtime +30 -delete

echo "Backup completed: closet-$DATE.dump"
```

### Manual Backup
```bash
docker compose exec postgres pg_dump \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  --format=custom \
  > /backups/manual-$(date +%Y%m%d-%H%M%S).dump
```

---

## Database Recovery

### Full Restore (Destroys All Current Data)
```bash
# STOP ALL SERVICES FIRST
docker compose stop backend closet-ai

# Drop and recreate database
docker compose exec postgres dropdb -U $POSTGRES_USER $POSTGRES_DB
docker compose exec postgres createdb -U $POSTGRES_USER $POSTGRES_DB

# Restore from backup
pg_restore \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  --no-owner \
  --role=$POSTGRES_USER \
  /backups/daily/closet-YYYYMMDD-HHMMSS.dump

# Restart services
docker compose start backend closet-ai

# Verify row counts
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"
```

### Point-in-Time Recovery (Requires WAL archiving)
```bash
# Restore base backup
pg_restore -d $POSTGRES_DB /backups/wal/base.dump

# Apply WAL segments up to target time
# Set in postgresql.conf:
# recovery_target_time = '2026-05-27 14:30:00'
# Then start postgres — it will replay WAL to that point
```

---

## Redis Recovery

### Redis Data Is Mostly Ephemeral
- Rate limit counters: let them expire naturally
- Auth blacklist: tokens in blacklist will be lost → users may briefly be able to use revoked tokens (TTL-bounded risk)
- Pipeline status: lost pipeline states will fall back to DB state
- Session cache: users will need to log in again

### Redis Restore Procedure
```bash
# Stop Redis
docker compose stop redis

# Copy backup RDB file
cp /backups/redis/dump-YYYYMMDD.rdb ./redis-data/dump.rdb

# Start Redis
docker compose start redis

# Verify
docker compose exec redis redis-cli dbsize
```

### Redis Recovery Without Backup
```bash
# Redis can start empty — it will rebuild from application usage
# Only impact: all sessions expire (users log out), rate limit counters reset
docker compose restart redis
# Application continues normally — Redis is graceful-degradation-safe
```

---

## Cloudinary Asset Recovery

Cloudinary manages its own redundancy. In case of accidental deletion:

```bash
# List recently deleted resources (Cloudinary 30-day trash)
curl -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET" \
  "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/resources/image/upload?deleted=true"

# Restore a specific asset (if within trash period)
curl -X POST -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET" \
  "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/resources/restore" \
  -d '{"public_ids":["uploads/garment-id"]}'
```

---

## Configuration Recovery

All configuration is in the Git repository:
- Docker Compose files: `docker-compose.yml`, `docker-compose.staging.yml`
- Nginx config: `infrastructure/nginx/`
- Prometheus config: `infrastructure/prometheus/`
- Grafana dashboards: `infrastructure/grafana/`
- Database migrations: `backend/src/database/migrations/`

Secrets are NOT in Git. Store them in:
- Development: `.env` file (gitignored)
- Production: Secret manager (AWS Secrets Manager, HashiCorp Vault, or equivalent)

### Recovering Secrets
If secrets are lost, they must be regenerated:
```bash
# New JWT secret (users will be logged out)
openssl rand -hex 64

# New refresh secret (users will lose refresh tokens)
openssl rand -hex 64

# New CLOUDINARY credentials — must be retrieved from Cloudinary dashboard
# https://console.cloudinary.com/settings/api-keys
```

---

## Disaster Recovery RTO/RPO Targets

| Scenario | RTO (Recovery Time) | RPO (Data Loss) |
|---|---|---|
| Single service crash | < 2 minutes | 0 |
| DB server failure | < 30 minutes | < 15 minutes (WAL) |
| Redis failure | < 5 minutes | Sessions lost (acceptable) |
| Full host failure | < 2 hours | < 24 hours (daily backup) |
| Data center failure | Manual — no HA configured | Up to 24 hours |

**Note:** These are aspirational targets for a single-server deployment. High availability across zones requires additional infrastructure work (not in current scope).
