# Deployment Prompt — Closet Inteligente Digital

> **Purpose:** Standard operating procedure for deploying the CID platform across all environments. Use this prompt whenever performing a deployment operation.

---

## 1. Environment Overview

| Environment | Frontend (Vercel) | Backend (Railway/Render) | AI Service (Railway/Render) | Database (Supabase) |
|---|---|---|---|---|
| **Production** | `closetinteligente.com` | `api.closetinteligente.com` | `ai.closetinteligente.com` | `db.closetinteligente.com` |
| **Staging** | `staging.closetinteligente.com` | `api-staging.closetinteligente.com` | `ai-staging.closetinteligente.com` | `db-staging.supabase.co` |
| **Development** | `dev.closetinteligente.com` | `api-dev.closetinteligente.com` | `ai-dev.closetinteligente.com` | `db-dev.supabase.co` |
| **Local** | `localhost:3000` | `localhost:4000` | `localhost:5000` | `localhost:5432` (Docker) |

### Infrastructure Providers
- **Vercel:** Frontend hosting (Next.js) — connected to GitHub `main` branch
- **Railway / Render:** Backend (NestJS) and AI (Python) services
- **Supabase:** PostgreSQL database, authentication, storage
- **Redis:** Upstash or Redis Cloud (caching, sessions, queues)
- **Cloudinary:** Image CDN and transformations
- **Firebase Cloud Messaging:** Push notifications
- **GitHub Actions:** CI/CD pipelines
- **Docker Hub / GHCR:** Container registry
- **Sentry:** Error tracking (production only)
- **Logtail / Papertrail:** Log aggregation

---

## 2. Pre-Deployment Checklist

### 2.1 Code Readiness
- [ ] All PRs approved and merged to `main` (or release branch)
- [ ] All CI checks passing on the target commit
- [ ] No failing tests on `main`
- [ ] Build succeeds for all services (`npm run build` / `nest build` / Docker build)
- [ ] Lint and type checks pass for all services
- [ ] No `console.log` / `debugger` statements in production code
- [ ] No `TODO` / `FIXME` / `HACK` without linked issues
- [ ] Migration files reviewed and tested (rollback tested as well)
- [ ] Environment variables added to all environments (Vercel, Railway, GitHub Secrets)
- [ ] Secrets rotated if applicable (API keys, JWT secrets)

### 2.2 Documentation Check
- [ ] CHANGELOG.md updated with all changes since last deployment
- [ ] API documentation (Swagger/OpenAPI) regenerated if endpoints changed
- [ ] Environment variable changes documented in `.env.example`
- [ ] Database migration plan documented (if applicable)
- [ ] Rollback plan documented

### 2.3 Environment-Specific Checks

**Production Deployment:**
- [ ] Staging deployment completed and verified first
- [ ] Database backup completed
- [ ] Feature flags verified (new features behind flags)
- [ ] Monitoring tools verified (Sentry, Logtail, uptime monitors)
- [ ] Load tested (if significant traffic changes expected)
- [ ] Rollback plan reviewed and tested
- [ ] Deployment window confirmed with team
- [ ] Communication prepared (internal + external if user-facing change)
- [ ] Approval from Tech Lead obtained

**Staging Deployment:**
- [ ] Staging database has representative data (anonymized production copy)
- [ ] External service integrations configured for staging (test API keys)
- [ ] No production credentials in staging configuration

**Development Deployment:**
- [ ] Feature branch deployed for testing
- [ ] Preview deployment accessible to reviewers

### 2.4 Database Migration Checklist
- [ ] Migration files exist in `apps/api/src/database/migrations/`
- [ ] Migration `up()` and `down()` methods both implemented
- [ ] Migration tested locally (apply + rollback)
- [ ] Migration does not lock large tables for extended periods
- [ ] Data backfill scripts written (if applicable)
- [ ] Migration is reversible (rollback possible without data loss)
- [ ] Migration order is correct (no circular dependencies)

---

## 3. Deployment Steps

### 3.1 Standard Deployment (Automated CI/CD)

**Step 1: Merge to Main**
```bash
# Ensure feature branch is up to date
git checkout main
git pull origin main

# Merge the feature branch
git merge --no-ff feature/<scope>/<description>

# Push to trigger CI/CD
git push origin main
```

**Step 2: Monitor CI Pipeline**
```bash
# Check CI status
gh run list --branch main --limit 5

# Watch specific run
gh run watch <run-id>

# Common CI stages:
# 1. Lint (ESLint + Prettier + Ruff)
# 2. Type check (tsc --noEmit + mypy)
# 3. Unit tests (jest + pytest)
# 4. Build (next build + nest build + Docker build)
# 5. Integration tests
# 6. Security scan (npm audit + safety check)
# 7. Bundle analysis (frontend)
```

**Step 3: Automated Deployment**
```yaml
# .github/workflows/deploy.yml (conceptual)
# Vercel: Automatic deployment on main branch push
# Railway: Automatic deployment on main branch push
# AI Service: Automatic deployment on main branch push
```

**Step 4: Manual Triggers (if needed)**
```bash
# Force Vercel deployment
npx vercel --prod

# Force Railway deployment
railway up --environment production

# Force Docker deployment
docker build -t cid-api:latest -f docker/Dockerfile.api .
docker push ghcr.io/cid/api:latest
```

### 3.2 Manual Deployment Steps

**Frontend (Vercel):**
```bash
# 1. Ensure you're on the correct branch
git checkout main
git pull

# 2. Build locally and verify
cd apps/web
npm run build

# 3. Deploy to Vercel (production)
npx vercel --prod

# 4. Verify deployment
npx vercel list
npx vercel inspect <deployment-url>
```

**Backend (Railway):**
```bash
# 1. Using Railway CLI
railway login
railway link <project-id>

# 2. Deploy
railway up --environment production

# 3. Check deployment status
railway status
railway logs --tail
```

**Backend (Docker):**
```bash
# 1. Build the Docker image
docker build -t cid-api:${VERSION} \
  --build-arg NODE_ENV=production \
  -f docker/Dockerfile.api .

# 2. Tag and push
docker tag cid-api:${VERSION} ghcr.io/cid/api:${VERSION}
docker tag cid-api:${VERSION} ghcr.io/cid/api:latest
docker push ghcr.io/cid/api:${VERSION}
docker push ghcr.io/cid/api:latest

# 3. Deploy to target environment
# (Railway auto-deploys from registry, or use SSH + docker-compose)
```

**AI Service (Python/Docker):**
```bash
# 1. Build with CUDA support
docker build -t cid-ai:${VERSION} \
  --build-arg CUDA_ENABLED=true \
  -f docker/Dockerfile.ai .

# 2. Tag and push
docker tag cid-ai:${VERSION} ghcr.io/cid/ai:${VERSION}
docker tag cid-ai:${VERSION} ghcr.io/cid/ai:latest
docker push ghcr.io/cid/ai:${VERSION}
docker push ghcr.io/cid/ai:latest

# 3. Deploy
railway up --environment production
```

**Database Migrations:**
```bash
# Run migrations (production)
cd apps/api
NODE_ENV=production npx typeorm migration:run -d dist/database/data-source.js

# Verify migration status
NODE_ENV=production npx typeorm migration:show -d dist/database/data-source.js

# Rollback if needed
NODE_ENV=production npx typeorm migration:revert -d dist/database/data-source.js
```

### 3.3 Deployment Order
1. **Database migrations** (run first, backward-compatible only)
2. **Backend API** (new code that handles both old and new frontend)
3. **AI Service** (if model or API changes)
4. **Frontend** (last, since it's the user-facing layer)
5. **Background jobs** (start new workers, drain old ones)

---

## 4. Post-Deployment Verification

### 4.1 Automated Verification
```bash
# Health check endpoints
curl -f https://api.closetinteligente.com/health
curl -f https://ai.closetinteligente.com/health

# API smoke test
curl -f https://api.closetinteligente.com/api/v1/garments \
  -H "Authorization: Bearer $TEST_TOKEN"

# Frontend accessibility
curl -f https://closetinteligente.com

# Swagger docs
curl -f https://api.closetinteligente.com/api/docs

# Database connection
curl -f https://api.closetinteligente.com/health/database

# Redis connection
curl -f https://api.closetinteligente.com/health/redis
```

### 4.2 Verification Checklist
- [ ] Health check endpoints return 200
- [ ] Database migrations applied correctly (check migration table)
- [ ] Swagger docs load and show new endpoints
- [ ] Critical API endpoints respond correctly
- [ ] Frontend loads and all pages render
- [ ] Authentication flow works (login, register, token refresh)
- [ ] No 5xx errors in logs (Sentry, Logtail)
- [ ] No WebSocket connection errors
- [ ] Background jobs processing correctly (BullMQ dashboard)
- [ ] Cache warming completed (if applicable)
- [ ] CDN cache purged (if static assets changed)
- [ ] Performance metrics within budget (check Sentry/Datadog)

### 4.3 Functional Smoke Tests
```markdown
## Smoke Test Results — Deployment YYYY-MM-DD

| Test | Result | Notes |
|---|---|---|
| Home page loads | ✅ Pass | LCP: 1.2s |
| User registration | ✅ Pass | Confirmation email sent |
| User login | ✅ Pass | JWT issued, redirect works |
| Garment creation | ✅ Pass | Upload + CV detection complete |
| Wardrobe view | ✅ Pass | Grid and list render correctly |
| Outfit creation | ✅ Pass | Drag-and-drop works |
| 3D avatar view | ✅ Pass | Loads in 2.1s |
| AI recommendation | ✅ Pass | 3 outfits returned (P95: 800ms) |
| Calendar view | ✅ Pass | Events display correctly |
| Push notification | ✅ Pass | FCM message delivered |
| Real-time sync | ✅ Pass | Changes propagate in <1s |
| Logout | ✅ Pass | Session cleared, redirect to login |
| Mobile responsive | ✅ Pass | No layout breaks at 375px |
```

### 4.4 Monitoring Checks
```bash
# Check Sentry for new errors
# Check Logtail for error logs
# Check Uptime Robot / Pingdom for availability
# Check Vercel Analytics for traffic and performance
# Check Railway metrics for CPU/memory usage
# Check BullMQ dashboard for queue health
# Check Cloudinary for upload errors
# Check Supabase for database connections and query performance
```

### 4.5 Database Verification
```sql
-- Verify migration was applied
SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;

-- Check for deadlocks or long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC
LIMIT 10;

-- Verify row counts are reasonable
SELECT 'garments', COUNT(*) FROM garments
UNION ALL
SELECT 'outfits', COUNT(*) FROM outfits
UNION ALL
SELECT 'users', COUNT(*) FROM users;
```

---

## 5. Rollback Procedure

### 5.1 When to Roll Back
Roll back immediately if any of the following occur:
- **Critical errors:** Error rate increases by >5% above baseline
- **Performance degradation:** API response time P95 exceeds 2x baseline
- **Data integrity:** Data corruption or unexpected data loss detected
- **Security breach:** Vulnerability discovered post-deployment
- **Feature failure:** Core feature (auth, garment upload, outfit creation) completely broken
- **Database issues:** Migration failure, deadlock spike, connection pool exhaustion

### 5.2 Rollback Steps

**Frontend Rollback (Vercel):**
```bash
# Vercel instant rollback to previous deployment
npx vercel rollback

# Or via Vercel Dashboard:
# 1. Go to Vercel Dashboard > Deployments
# 2. Find the last known-good deployment
# 3. Click "..." > "Promote to Production"
```

**Backend Rollback (Railway):**
```bash
# Railway rollback to previous deployment
railway rollback

# Or via Railway Dashboard:
# 1. Go to Railway Dashboard > Deployments
# 2. Find the last known-good deployment
# 3. Click "Rollback to this deployment"
```

**Docker Rollback:**
```bash
# Re-tag previous version and redeploy
docker pull ghcr.io/cid/api:${PREVIOUS_VERSION}
docker tag ghcr.io/cid/api:${PREVIOUS_VERSION} ghcr.io/cid/api:latest
docker push ghcr.io/cid/api:latest

# Trigger redeployment on Railway
railway deploy
```

**Database Rollback:**
```bash
# Revert the last migration
cd apps/api
NODE_ENV=production npx typeorm migration:revert -d dist/database/data-source.js

# If migration cannot be reverted:
# 1. Restore from backup
pg_restore -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME \
  --clean --if-exists backup_$(date +%Y%m%d_%H%M%S).dump
```

### 5.3 Rollback Verification
- [ ] Frontend loads and shows previous version
- [ ] API health check passes
- [ ] Database connections normal
- [ ] Error rate back to baseline
- [ ] All smoke tests pass on rolled-back version
- [ ] Rollback communicated to team

### 5.4 Rollback Communication
```markdown
## Rollback Notification — YYYY-MM-DD

**Deployment:** <version or commit>
**Rollback Time:** HH:MM UTC
**Duration:** <minutes> from deploy to rollback

**Reason:** <what triggered the rollback>

**Impact:** <users affected, features unavailable>

**Current Status:** ✅ All systems normal on previous version

**Next Steps:**
- <investigation plan>
- <fix timeline>
- <new deployment schedule>
```

---

## 6. Release Versioning

### 6.1 Version Scheme
```
v<MAJOR>.<MINOR>.<PATCH>[-<PRE_RELEASE>.<N>]

Examples:
v0.1.0          # Initial development release
v0.2.0-alpha.1  # Alpha release for testing
v1.0.0-beta.1   # Beta release
v1.0.0          # Production release
v1.0.1          # Patch release
```

### 6.2 Version Bump Rules
| Change Type | Version Bump | Example |
|---|---|---|
| Breaking API change | MAJOR | v1.0.0 → v2.0.0 |
| New feature (backward-compatible) | MINOR | v1.0.0 → v1.1.0 |
| Bug fix (backward-compatible) | PATCH | v1.0.0 → v1.0.1 |
| Pre-release | APPEND | v1.0.0 → v1.0.0-alpha.1 |

### 6.3 Tagging
```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release v1.0.0: Beta launch"
git push origin v1.0.0

# List all tags
git tag -l --sort=-v:refname

# Create GitHub Release
gh release create v1.0.0 \
  --title "v1.0.0 — Beta Launch" \
  --notes "$(cat << 'EOF'
## Changelog
### Added
- All features from Phase 1-5

### Fixed
- All known issues
EOF
)"
```

---

## 7. Deployment-Specific Prompts

### 7.1 Database Migration Deployment
```markdown
## Database Migration Plan

**Migration File:** <filename>
**Description:** <what the migration does>
**Author:** <agent-id>

### Pre-Migration
- [ ] Database backed up
- [ ] Migration tested on staging
- [ ] Rollback script tested
- [ ] Low-traffic period selected

### Migration Commands
```bash
# Apply migration
NODE_ENV=production npx typeorm migration:run -d dist/database/data-source.js

# Verify
NODE_ENV=production npx typeorm migration:show -d dist/database/data-source.js
```

### Rollback
```bash
NODE_ENV=production npx typeorm migration:revert -d dist/database/data-source.js
```

### Verification
```sql
-- Verify data integrity after migration
SELECT COUNT(*) FROM <affected_table>;
SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;
```

### Migration Type
- [ ] Additive (new table/column) — safe, no downtime
- [ ] Non-additive (rename, modify) — requires application-level backward compatibility
- [ ] Destructive (drop table/column) — requires data migration first
- [ ] Data migration (move/transform data) — requires backfill script
```

### 7.2 Feature Flag Deployment
```markdown
## Feature Flag Deployment

**Feature:** <feature name>
**Flag Name:** <environment variable or launch darkly flag>
**Deployment Strategy:** Gradual rollout | Immediate | A/B test

### Rollout Plan
1. Deploy behind flag (disabled) — verify stability
2. Enable for internal team — verify functionality
3. Enable for 10% of users — monitor metrics
4. Enable for 50% of users — monitor metrics
5. Enable for 100% of users
6. Remove feature flag code

### Metrics to Monitor
- <metric 1>
- <metric 2>
- <metric 3>

### Kill Switch
- <how to disable the feature quickly if issues arise>
```
