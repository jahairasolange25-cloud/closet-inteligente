# Backup Strategy

## Overview
The backup strategy ensures data durability and rapid recovery for all components of the Closet Inteligente Digital platform. It covers PostgreSQL databases, media files, Redis state, configuration, and infrastructure-as-code. The strategy is designed to meet an RPO of 1 hour and RTO of 4 hours.

---

## Recovery Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| **RPO (Recovery Point Objective)** | 1 hour | Maximum acceptable data loss in case of disaster |
| **RTO (Recovery Time Objective)** | 4 hours | Maximum acceptable time to restore full service |
| **RTO (Critical Path)** | 1 hour | Time to restore read-only access to user data |
| **RTO (AI Pipeline)** | 6 hours | Time to restore AI inference capabilities |
| **RTO (Media)** | 8 hours | Time to restore all media files from backup |

---

## 1. PostgreSQL Backup Strategy

### Backup Schedule

| Backup Type | Frequency | Retention | Storage | Method |
|-------------|-----------|-----------|---------|--------|
| Full database dump | Daily at 03:00 UTC | 30 days | S3-compatible (Backblaze B2) | `pg_dump --format=custom` |
| WAL archiving | Continuous | 7 days | S3-compatible | `archive_command` + `pg_receivewal` |
| Point-in-Time Recovery (PITR) | On-demand | Up to 7 days | From WAL + base backup | `pg_restore` with timeline |
| Logical replication slot | Continuous | N/A | PostgreSQL streaming | `pgoutput` plugin |
| Automated snapshot (managed DB) | Every 6 hours | 14 days | Provider-managed | Railway/Render automated snapshots |

### Full Database Backup Command

```bash
# Daily full backup
pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=closet_inteligente \
  --format=custom \
  --compress=9 \
  --file=/tmp/backups/closet_$(date +%Y%m%d_%H%M%S).dump \
  --verbose \
  --no-owner \
  --no-acl \
  --exclude-table=analytics_events \
  --exclude-table=audit_logs \
  --exclude-table=session_logs \
  2>&1

# Upload to S3-compatible storage
aws s3 cp /tmp/backups/closet_*.dump \
  s3://closet-backups/postgres/daily/ \
  --storage-class STANDARD_IA

# Encrypt before upload (if not using server-side encryption)
gpg --encrypt --recipient backup-key \
  /tmp/backups/closet_*.dump
aws s3 cp /tmp/backups/closet_*.dump.gpg \
  s3://closet-backups/postgres/encrypted/
```

### WAL Archiving Configuration

```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'pg_compresslog --compress=9 %p | aws s3 cp - s3://closet-backups/postgres/wal/%f.gz --expected-size 16777216'
archive_timeout = 60
max_wal_senders = 5
wal_keep_segments = 32
```

### Point-in-Time Recovery Procedure

```bash
# 1. Restore base backup
pg_restore --format=custom \
  s3://closet-backups/postgres/daily/closet_20260525_030000.dump \
  --dbname=closet_inteligente_restored

# 2. Create recovery.conf
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'aws s3 cp s3://closet-backups/postgres/wal/%f.gz - | gunzip > %p'
recovery_target_time = '2026-05-25 14:30:00 UTC'
recovery_target_timeline = 'latest'
EOF

# 3. Start PostgreSQL (will perform PITR automatically)
pg_ctl start -D /var/lib/postgresql/data

# 4. Verify recovery
SELECT * FROM pg_stat_activity WHERE state = 'in recovery';

# 5. Promote to primary when ready
pg_ctl promote -D /var/lib/postgresql/data
```

### Backup Verification (Weekly)

```bash
# Weekly restore test (every Sunday at 05:00 UTC)
# Run on isolated test database

# 1. Create test database
createdb closet_backup_test

# 2. Restore latest full backup
pg_restore --format=custom \
  --dbname=closet_backup_test \
  --jobs=4 \
  s3://closet-backups/postgres/daily/latest.dump

# 3. Run consistency checks
psql -d closet_backup_test -c "SELECT count(*) FROM users"
psql -d closet_backup_test -c "SELECT count(*) FROM garments"
psql -d closet_backup_test -c "SELECT count(*) FROM outfits"

# 4. Run integrity checks
psql -d closet_backup_test -c "
  SELECT schemaname, tablename, n_live_tup, n_dead_tup
  FROM pg_stat_user_tables
  WHERE n_dead_tup > n_live_tup * 0.5
"

# 5. Check for corruption
psql -d closet_backup_test -c "
  SELECT count(*) FROM pg_stat_all_tables
  WHERE relid IN (
    SELECT relid FROM pg_stat_all_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  )
  AND (SELECT count(*) FROM ONLY tablename) >= 0
"

# 6. Verify specific critical data
psql -d closet_backup_test -c "
  -- Verify no orphaned records
  SELECT count(*) FROM garments g
  LEFT JOIN users u ON g.user_id = u.id
  WHERE u.id IS NULL
"

# 7. Report results
echo "Backup verification completed: $(date)"
echo "Backup file: latest.dump"
echo "Database size: $(psql -d closet_backup_test -c 'SELECT pg_size_pretty(pg_database_size(current_database()))' -tA)"
echo "Table count: $(psql -d closet_backup_test -c 'SELECT count(*) FROM information_schema.tables WHERE table_schema='\''public'\''' -tA)"

# 8. Clean up
dropdb closet_backup_test
```

### Database-Specific Backup Considerations

| Schema | Backup Priority | Estimated Size | Backup Strategy |
|--------|----------------|----------------|-----------------|
| `public.users` | Critical | 500 MB | Full daily, WAL continuous |
| `public.garments` | Critical | 2 GB | Full daily, WAL continuous |
| `public.garment_images` | Critical (metadata only) | 200 MB | Full daily |
| `public.outfits` | Critical | 500 MB | Full daily, WAL continuous |
| `public.outfit_items` | Critical | 300 MB | Full daily |
| `public.avatars` | High | 50 MB | Full daily |
| `public.body_measurements` | High | 100 MB | Full daily |
| `public.size_predictions` | Medium | 200 MB | Full daily |
| `public.color_analyses` | Medium | 150 MB | Full daily |
| `public.outfit_recommendations` | Medium | 300 MB | Full daily |
| `public.sessions` | Medium | 1 GB | Full daily, truncated at 30 days |
| `public.activity_logs` | Low | 5 GB | Weekly full, daily incremental |
| `public.analytics_events` | Low | 10 GB | Excluded from critical backup, stored separately |
| `public.audit_logs` | Critical (retention) | 2 GB | Full daily, 7-year retention |

---

## 2. Media Files Backup Strategy

### Media Storage Architecture

```
User Uploads
    |
    +---> Cloudinary (Primary Storage)
    |       - Original images
    |       - Transformed/resized versions
    |       - Videos (3D garment rotations, try-on recordings)
    |
    +---> Google Drive (Backup Sync)
    |       - Full copy of Cloudinary assets
    |       - Synced daily
    |
    +---> Local / Server Cache (Ephemeral)
            - Processed images (short-term cache)
            - Not backed up (regenerable from Cloudinary)
```

### Cloudinary Backup Strategy

| Component | Backup Method | Frequency | Retention |
|-----------|--------------|-----------|-----------|
| Original images | Cloudinary backup folder (automatic) | Real-time | Forever |
| Transformed images | Regenerable on-demand | N/A | N/A |
| Metadata (tags, context) | Cloudinary API export | Daily | 90 days |
| Cloudinary account config | Manual export | Monthly | 1 year |

### Cloudinary to Google Drive Sync

```bash
# Daily sync script (runs at 04:00 UTC)

# 1. List all assets from Cloudinary
cloudinary_url="https://api.cloudinary.com/v1_1/$CLOUD_NAME/resources/image"
curl -s -u "$API_KEY:$API_SECRET" "$cloudinary_url?max_results=500" \
  | jq -r '.resources[] | "\(.public_id) \(.secure_url)"' \
  > /tmp/cloudinary_assets.txt

# 2. Download new/changed assets
while IFS=' ' read -r public_id url; do
  if ! gdrive files list --query "name contains '$public_id'" | grep -q "$public_id"; then
    curl -s -o "/tmp/cloudinary_sync/$public_id" "$url"
  fi
done < /tmp/cloudinary_assets.txt

# 3. Upload to Google Drive
gdrive upload \
  --parent "$GDRIVE_BACKUP_FOLDER_ID" \
  --recursive \
  /tmp/cloudinary_sync/

# 4. Clean up local temp files
rm -rf /tmp/cloudinary_sync/
rm /tmp/cloudinary_assets.txt

# 5. Log results
echo "Cloudinary sync completed: $(date)" >> /var/log/backup/cloudinary-sync.log
echo "Assets synced: $(ls /tmp/cloudinary_sync/ | wc -l)" >> /var/log/backup/cloudinary-sync.log
```

### Direct Upload Backup (Via Storage Service)

```bash
# For uploads that bypass Cloudinary (e.g., from mobile app)
# Storage service creates a backup copy during upload

# Upload handler pseudocode
async function uploadAndBackup(file: Buffer, metadata: UploadMetadata): Promise<UploadResult> {
  // 1. Upload to Cloudinary (primary)
  const cloudinaryResult = await cloudinary.uploader.upload(file, {
    folder: `users/${metadata.userId}`,
    public_id: metadata.fileId,
    ...transformationOptions
  });

  // 2. Upload to Google Drive (backup) - async, non-blocking
  backupQueue.add(async () => {
    await gdrive.files.create({
      requestBody: {
        name: `${metadata.fileId}_${metadata.originalName}`,
        parents: [gdriveBackupFolderId],
        description: `Backup of Cloudinary upload for user ${hashUserId(metadata.userId)}`
      },
      media: { body: file }
    });
  });

  return { url: cloudinaryResult.secure_url, publicId: cloudinaryResult.public_id };
}
```

### Media Backup Retention

| Asset Type | Retention | Notes |
|------------|-----------|-------|
| Original user uploads | Forever (Cloudinary) | Never deleted from primary |
| Transformed/resized images | Regenerable | Deleted after 90 days if no reference |
| 3D model files (avatars) | Forever | Critical for user experience |
| Try-on session recordings | 90 days | Large files, limited retention |
| Deleted user media | 30 days (grace period) | Then permanently deleted |
| Google Drive backup | 90 days | Rotated, only most recent 90 days |

---

## 3. Redis Persistence Strategy

### Redis Persistence Configuration

```redis
# redis.conf - Persistence settings

# RDB (Snapshot) - Point-in-time recovery
save 300 100           # Save if at least 100 keys changed in 300 seconds (5 min)
save 60 1000           # Save if at least 1000 keys changed in 60 seconds (1 min)
save 900 10            # Save if at least 10 keys changed in 900 seconds (15 min)
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# AOF (Append-Only File) - Crash recovery
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec   # fsync every second (good balance of performance and safety)
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes  # Hybrid RDB+AOF format (Redis 5+)
```

### Redis Backup Schedule

| Backup Type | Frequency | Retention | Storage | Method |
|-------------|-----------|-----------|---------|--------|
| RDB snapshot | Every 5 minutes (automatic) | N/A (on disk) | Local disk | Redis `SAVE`/`BGSAVE` |
| AOF rewrite | As needed (auto) | N/A (on disk) | Local disk | Redis `BGREWRITEAOF` |
| Remote RDB backup | Every 6 hours | 14 days | S3-compatible | Copy dump.rdb |
| Remote AOF backup | Every hour | 7 days | S3-compatible | Copy appendonly.aof |

### Redis Backup Script

```bash
#!/bin/bash
# Redis backup to S3 - runs every 6 hours via cron

BACKUP_DIR="/tmp/redis-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="s3://closet-backups/redis/"

# Create backup directory
mkdir -p $BACKUP_DIR

# Trigger RDB save
redis-cli BGSAVE

# Wait for save to complete
while [ "$(redis-cli info persistence | grep rdb_bgsave_in_progress | cut -d: -f2)" = "1" ]; do
  sleep 1
done

# Copy RDB file
cp /data/dump.rdb $BACKUP_DIR/redis_$TIMESTAMP.rdb

# Compress
gzip $BACKUP_DIR/redis_$TIMESTAMP.rdb

# Upload to S3
aws s3 cp $BACKUP_DIR/redis_$TIMESTAMP.rdb.gz $S3_BUCKET

# Cleanup old backups (keep last 14 days)
aws s3 ls $S3_BUCKET | while read -r line; do
  createDate=$(echo $line | awk '{print $1" "$2}')
  createDate=$(date -d"$createDate" +%s)
  olderThan=$(date -d"14 days ago" +%s)
  if [ $createDate -lt $olderThan ]; then
    fileName=$(echo $line | awk '{print $4}')
    aws s3 rm "$S3_BUCKET$fileName"
  fi
done

# Cleanup local
rm -rf $BACKUP_DIR
```

### Redis Restore Procedure

```bash
# Full Redis restore from backup

# 1. Stop Redis
systemctl stop redis

# 2. Download latest backup
aws s3 cp s3://closet-backups/redis/redis_latest.rdb.gz /tmp/redis_restore.rdb.gz
gunzip /tmp/redis_restore.rdb.gz

# 3. Replace RDB file
cp /tmp/redis_restore.rdb /data/dump.rdb

# 4. Start Redis (will load RDB automatically)
systemctl start redis

# 5. Verify data integrity
redis-cli DBSIZE
redis-cli INFO keyspace

# 6. Force AOF rewrite to sync with loaded data
redis-cli BGREWRITEAOF
```

### Redis Data Classification

| Data Type | Redis Data Structure | Persistence Required | Can Regenerate? | Restore Priority |
|-----------|---------------------|----------------------|-----------------|------------------|
| Session tokens | String (with TTL) | Yes | No | High |
| User auth tokens | String (with TTL) | Yes | No | High |
| Cache: garment data | Hash | No | Yes (from DB) | Low |
| Cache: outfit recs | String (JSON) | No | Yes (from DB) | Low |
| Cache: search results | String (JSON) | No | Yes (from DB) | Low |
| Rate limit counters | String (with TTL) | No | No | None |
| WebSocket rooms | Set | No | Yes (reconnect) | Low |
| Job queues | List | Yes | No | High |
| Rate limit config | String | Yes | Yes | Medium |
| Feature flags | String | Yes | Yes | Medium |

---

## 4. Backup Verification Procedure

### Weekly Restore Test (Every Sunday)

```bash
# Full system restore test schedule
# 05:00 UTC - Start restore
# 06:00 UTC - Verify database
# 06:30 UTC - Verify media files
# 07:00 UTC - Verify Redis
# 07:30 UTC - Run integration tests
# 08:00 UTC - Send report

# See full script in: infrastructure/scripts/backup-verify.sh
```

### Verification Steps

| Step | What to Verify | Criteria | Frequency |
|------|---------------|----------|-----------|
| 1. Backup file integrity | Archive checksums match | SHA256 match | Daily (automated) |
| 2. Database restore | Full pg_restore to test DB | No errors | Weekly |
| 3. Data consistency | Row counts, foreign keys | Match production | Weekly |
| 4. Latest data check | Most recent user/garment timestamp | Within 24h of backup time | Weekly |
| 5. Media file access | Cloudinary URL accessibility | 100% accessible | Monthly |
| 6. Redis restore | RDB load, key count similar | Key count > 90% of prod | Monthly |
| 7. PITR test | Restore to specific timestamp | Data matches | Monthly |
| 8. Full DR test | Complete environment rebuild | Within RTO | Quarterly |

### Verification Reporting

```json
{
  "test_id": "bkv_20260525",
  "timestamp": "2026-05-25T05:00:00Z",
  "components": {
    "postgresql": {
      "status": "passed",
      "backup_file": "closet_20260524_030000.dump",
      "backup_size_mb": 12450,
      "restore_duration_seconds": 843,
      "table_count": 47,
      "row_count": 12500000,
      "integrity_errors": 0
    },
    "media": {
      "status": "passed",
      "backup_source": "cloudinary",
      "total_assets": 245000,
      "synced_assets": 245000,
      "sync_duration_seconds": 1200
    },
    "redis": {
      "status": "passed",
      "restore_duration_seconds": 12,
      "key_count": 234000,
      "expected_key_count": 240000,
      "key_count_ratio": 0.975
    }
  },
  "overall_status": "passed",
  "rto_met": true,
  "rpo_met": true
}
```

---

## 5. Disaster Recovery Plan

### Disaster Scenarios

| Scenario | Impact | Recovery Strategy | Expected RTO |
|----------|--------|-------------------|--------------|
| Single database corruption | Partial data loss | PITR to pre-corruption timestamp | 1 hour |
| Full database loss | Complete data loss | Restore latest backup + WAL replay | 2 hours |
| Redis data loss | Session/queue data loss | Restore RDB, regenerate cache | 30 minutes |
| Cloudinary outage | Media unavailable | Serve from Google Drive backup | 1 hour |
| Cloudinary data loss | Media permanently lost | Restore from Google Drive | 4 hours |
| Full region outage | Complete platform down | Cross-region deployment | 4 hours |
| Accidental data deletion | User data deleted | PITR to pre-deletion timestamp | 1 hour |
| Ransomware attack | All data encrypted | Restore clean backup | 4 hours |
| Hardware failure | Single service down | Auto-scale replacement | 30 minutes |
| Provider failure (Railway/Render) | All services down | Deploy to backup provider | 8 hours |

### Disaster Recovery Runbook

#### DR-001: Database Corruption or Data Loss

```
1. DETECT
   - Alert: db_error_rate spike, data integrity check failure
   - Symptom: Application errors on data queries, inconsistent data

2. ASSESS
   - Determine scope of corruption (single table vs full database)
   - Identify timestamp of last known good state
   - Check backup availability

3. ISOLATE
   - Set database to read-only mode to prevent further writes
   - Notify users of degraded service

4. RESTORE
   a) If single table corruption:
      - Restore table from latest backup into staging
      - Export affected table
      - Import into production
   
   b) If full database loss:
      - Provision new database instance
      - Restore latest full backup
      - Replay WAL to last known good timestamp
      - Verify data consistency

5. VERIFY
   - Run data integrity checks
   - Confirm user data present
   - Confirm no orphaned records

6. RESUME
   - Set database to read-write mode
   - Verify application functionality
   - Monitor for errors
```

#### DR-002: Cloudinary Outage or Data Loss

```
1. DETECT
   - Alert: Cloudinary API errors, upload failures
   - Symptom: Images not loading, upload errors

2. ASSESS
   - Check Cloudinary status page
   - Verify if outage is regional or account-specific

3. MITIGATE
   a) If temporary outage:
      - Serve images from Google Drive with signed URLs
      - Queue uploads for retry when Cloudinary recovers
   
   b) If permanent data loss:
      - Restore all assets from Google Drive backup
      - Re-upload to Cloudinary
      - Regenerate transformed versions

4. VERIFY
   - Confirm all media accessible
   - Verify image transformations working

5. RESUME
   - Switch back to Cloudinary CDN
   - Clear any cached error states
```

#### DR-003: Full Platform Outage

```
1. DETECT
   - Alert: All health checks failing, complete platform down
   - Symptom: Users cannot access the application

2. ASSESS
   - Verify provider status (Railway/Render)
   - Check DNS resolution
   - Verify database connectivity

3. ACTIVATE DR
   - Decision point: If provider outage > 15 minutes, activate DR
   - Provision infrastructure on backup provider
   - Restore database from latest backup
   - Deploy application from latest stable container image
   - Update DNS to point to backup provider

4. VERIFY
   - Run full health check suite
   - Verify user authentication works
   - Verify core features (wardrobe, outfits, try-on)

5. MONITOR
   - Monitor performance and error rates
   - Scale up as needed to handle traffic
   - Document all actions for postmortem

6. FAIL BACK
   - When primary provider is restored
   - Sync data from DR environment
   - Switch DNS back to primary
   - Decommission DR environment
```

#### DR-004: Redis Data Loss

```
1. DETECT
   - Alert: Redis error, session failures
   - Symptom: Users logged out, queues not processing

2. RESTORE
   - Restart Redis with latest RDB snapshot
   - If RDB is corrupted, restore from S3 backup
   - Regenerate cache from database (cache warming)

3. VERIFY
   - Confirm sessions restored
   - Verify queues populated
   - Check cache hit rates

4. RESUME
   - Monitor Redis metrics
   - AOF will sync for crash recovery going forward
```

### Disaster Recovery Testing

| Test Type | Frequency | Scope | Success Criteria |
|-----------|-----------|-------|-----------------|
| Table restore test | Weekly | Restore single table from backup | < 30 minutes, data integrity verified |
| Full database restore | Monthly | Complete restore to test environment | < 2 hours, all checks pass |
| Media restore test | Quarterly | Restore all media from backup | < 4 hours, 100% assets accessible |
| Cross-region DR | Quarterly | Deploy to backup region | < 4 hours, full functionality |
| Ransomware simulation | Annually | Simulate data encryption scenario | < 4 hours restore, no data loss |

---

## 6. Backup Encryption

### Encryption Standards

| Aspect | Standard | Implementation |
|--------|----------|----------------|
| Algorithm | AES-256-GCM | Symmetric encryption for backup files |
| Key management | AWS KMS / Azure Key Vault | Key rotation every 90 days |
| At-rest encryption | Server-side (S3/Backblaze) | SSE-S3 or SSE-KMS |
| In-transit encryption | TLS 1.3 | HTTPS for all backup transfers |
| Client-side encryption | GPG (pre-upload) | For sensitive backups |

### Backup Encryption Process

```bash
# 1. Generate encryption key (if not using KMS)
openssl rand -base64 32 > /etc/backup-key.key
chmod 400 /etc/backup-key.key

# 2. Encrypt backup before upload
gpg --symmetric \
  --cipher-algo AES256 \
  --passphrase-file /etc/backup-key.key \
  --batch \
  --output $BACKUP_FILE.gpg \
  $BACKUP_FILE

# 3. Upload encrypted backup
aws s3 cp $BACKUP_FILE.gpg s3://closet-backups/encrypted/

# 4. Decrypt for restore
gpg --decrypt \
  --passphrase-file /etc/backup-key.key \
  --batch \
  --output $RESTORE_FILE \
  $BACKUP_FILE.gpg
```

### Key Management

| Key | Purpose | Storage | Rotation |
|-----|---------|---------|----------|
| Backup encryption key | Encrypt/decrypt backup files | AWS Secrets Manager + offline cold storage | 90 days |
| Database encryption key | PostgreSQL TDE (if enabled) | Azure Key Vault / AWS KMS | 90 days |
| Cloudinary API key | Access Cloudinary backups | Environment variables (encrypted) | 180 days |
| Google Drive API key | Access Drive backup storage | Environment variables (encrypted) | 180 days |
| GPG signing key | Verify backup integrity | Hardware security module (HSM) | 1 year |

---

## 7. Offsite Backup Storage

### Storage Locations

| Location | Provider | Purpose | Region |
|----------|----------|---------|--------|
| Primary | Backblaze B2 / AWS S3 | Main backup storage | us-east-1 |
| Secondary | Google Cloud Storage | Cross-region replica | eu-west-1 |
| Cold archive | AWS S3 Glacier | Long-term retention (audit logs, 7-year) | us-west-2 |

### Storage Configuration

| Storage Tier | Provider | Class | Replication | Retrieval Time |
|-------------|----------|-------|-------------|----------------|
| Hot backups (0-30 days) | Backblaze B2 | Standard | Cross-region replication | Immediate |
| Warm backups (31-90 days) | Backblaze B2 | Standard (lifecycle) | Single region | Immediate |
| Cold backups (91-365 days) | AWS S3 | Glacier Deep Archive | Single region | 12-48 hours |
| Permanent (audit, 7 years) | AWS S3 | Glacier Deep Archive | Cross-region | 12-48 hours |

### Backup Storage Requirements

| Backup Component | Total Size (est.) | Monthly Cost (est.) | Annual Growth |
|-----------------|-------------------|---------------------|---------------|
| PostgreSQL (compressed) | 15 GB | $0.30 | ~20% |
| WAL archive (7 days) | 10 GB | $0.20 | ~20% |
| Redis RDB backups | 2 GB | $0.04 | ~30% |
| Media files (original) | 500 GB | $5.00 | ~50% |
| Media files (transformed) | 200 GB | $2.00 | ~50% |
| Configuration backups | 100 MB | $0.00 | ~10% |
| Audit logs (7 years) | 100 GB | $1.00 | ~30% |
| **Total** | **~827 GB** | **~$8.54** | |

### Offsite Backup Verification

```bash
# Weekly check: verify backup files exist in all locations
aws s3 ls s3://closet-backups/postgres/daily/ --summarize | tail -5
aws s3 ls s3://closet-backups/redis/ --summarize | tail -5
gsutil ls gs://closet-backups-replica/postgres/daily/ | tail -5

# Monthly: restore test from secondary location
export AWS_REGION=eu-west-1
aws s3 cp s3://closet-backups-replica/postgres/daily/latest.dump /tmp/test-restore/
pg_restore --dbname=closet_restore_test /tmp/test-restore/latest.dump
```

---

## 8. Backup Monitoring and Alerts

### Backup Health Metrics

| Metric | Description | Warning | Critical |
|--------|-------------|---------|----------|
| `backup.postgres.age_hours` | Hours since last successful DB backup | >25h | >28h |
| `backup.postgres.size_mb` | Backup file size | <50% avg | <25% avg |
| `backup.postgres.wal_lag_minutes` | Minutes since last WAL archive | >5min | >15min |
| `backup.redis.age_hours` | Hours since last Redis backup | >7h | >12h |
| `backup.media.age_hours` | Hours since last media sync | >26h | >30h |
| `backup.dr_test.age_days` | Days since last DR test | >35d | >45d |
| `backup.storage.usage_gb` | Total backup storage used | >80% quota | >90% quota |
| `backup.verify.status` | Last verification result | Warning | Failed |

### Backup Alert Rules

| Rule Name | Condition | Severity | Action |
|-----------|-----------|----------|--------|
| backup-postgres-missed | No DB backup in 28 hours | CRITICAL | Page on-call engineer |
| backup-postgres-small | Backup size < 25% of average | HIGH | Investigate possible data loss |
| backup-wal-lag | WAL archive lag > 15 minutes | HIGH | Investigate archive process |
| backup-redis-missed | No Redis backup in 12 hours | HIGH | Check Redis backup cron |
| backup-media-missed | No media sync in 30 hours | MEDIUM | Check sync script |
| backup-storage-full | Storage > 90% capacity | HIGH | Clean old backups or increase quota |
| backup-dr-test-overdue | DR test > 45 days overdue | MEDIUM | Schedule DR test |
| backup-verify-failure | Verification test failed | CRITICAL | Investigate and fix backup |
| backup-encryption-error | Encryption/decryption failure | CRITICAL | Check key validity |

### Backup Dashboard

Located in Grafana: `Dashboard > Infrastructure > Backup Status`

**Panels**:
1. **Backup Freshness**: Time since last successful backup per component (table)
2. **Backup Size Trends**: Size of backup files over time (time series)
3. **Storage Usage**: S3/B2 storage consumption (gauge + time series)
4. **Restore Test Results**: Pass/fail history of weekly restore tests
5. **WAL Archive Status**: Lag time for WAL archiving (time series)
6. **DR Readiness**: Days since last DR test, component readiness (status grid)

---

## 9. Backup Retention Policy Summary

| Data Type | Daily | Weekly | Monthly | Yearly | Permanent |
|-----------|-------|--------|---------|--------|-----------|
| PostgreSQL full dump | 30 days | 12 weeks | 12 months | 7 years | - |
| WAL archives | 7 days | - | - | - | - |
| Redis RDB | 14 days | - | - | - | - |
| Cloudinary media | - | - | - | - | Forever |
| Google Drive sync | 90 days | - | - | - | - |
| Configuration (infra-as-code) | - | - | - | - | Git (forever) |
| Audit logs | - | - | - | 7 years | - |
| DR test reports | - | - | 12 months | - | - |
| Container images | - | - | 3 months | - | - |

---

## 10. Backup Automation

### Cron Schedule

```cron
# PostgreSQL
0 3 * * *   /usr/local/bin/backup-postgres.sh          # Daily full backup
*/5 * * * * /usr/local/bin/backup-wal-archive.sh       # WAL archiving (continuous)

# Redis
0 */6 * * * /usr/local/bin/backup-redis.sh             # Every 6 hours

# Media
0 4 * * *   /usr/local/bin/backup-cloudinary-sync.sh   # Daily Cloudinary -> Drive sync

# Verification
0 5 * * 0   /usr/local/bin/backup-verify-postgres.sh   # Weekly PostgreSQL restore test
0 6 * * 0   /usr/local/bin/backup-verify-redis.sh      # Weekly Redis restore test
0 7 1 * *   /usr/local/bin/backup-verify-media.sh      # Monthly media accessibility test

# Cleanup
0 2 * * *   /usr/local/bin/backup-cleanup.sh           # Daily retention enforcement
```

### Backup Scripts Repository

All backup scripts are located in: `infrastructure/backups/`

| Script | Purpose |
|--------|---------|
| `backup-postgres.sh` | PostgreSQL full dump and upload |
| `backup-postgres-pitr.sh` | Point-in-time recovery setup |
| `backup-redis.sh` | Redis RDB backup and upload |
| `backup-cloudinary-sync.sh` | Cloudinary to Google Drive sync |
| `backup-config.sh` | Configuration and environment backup |
| `backup-verify-postgres.sh` | PostgreSQL restore verification |
| `backup-verify-redis.sh` | Redis restore verification |
| `backup-verify-media.sh` | Media accessibility verification |
| `backup-cleanup.sh` | Retention policy enforcement |
| `backup-dr-failover.sh` | Full disaster recovery failover |
| `backup-dr-failback.sh` | Disaster recovery failback to primary |
