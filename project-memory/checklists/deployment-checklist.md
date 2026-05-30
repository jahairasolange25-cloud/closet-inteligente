# Deployment Checklist

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All feature branches merged to main/staging branch
- [ ] Code has been reviewed and approved (minimum 1 approval)
- [ ] All CI/CD pipelines pass (lint, typecheck, test, build)
- [ ] No unresolved merge conflicts
- [ ] No `console.log`, `debugger`, or `TODO` comments remain
- [ ] Feature flags are configured correctly (if using)
- [ ] Database migration scripts are ready and tested
- [ ] Migration rollback scripts are verified
- [ ] Changelog is updated with new changes
- [ ] Version numbers are bumped (package.json, config files)

### Environment Configuration
- [ ] All environment variables are documented in .env.example
- [ ] Required secrets are added to deployment platform (Vercel/Railway/Render)
- [ ] No hardcoded credentials or API keys in code
- [ ] Environment-specific configs are correct (dev/staging/prod)
- [ ] CORS origins are configured for production domain
- [ ] Rate limiting thresholds are set for production load
- [ ] Logging levels are set appropriately (info/warn/error for prod)
- [ ] Error tracking service (Sentry) is configured with correct DSN
- [ ] Monitoring service (DataDog/New Relic) is configured

### Dependency Check
- [ ] All npm/pip packages are up-to-date (no known vulnerabilities)
- [ ] `npm audit` or `pip audit` passes with no high/critical issues
- [ ] Lock files are committed (package-lock.json, yarn.lock, poetry.lock)
- [ ] No deprecated packages in use
- [ ] All licenses are compatible with project

### Build Verification
- [ ] Frontend build succeeds (`npm run build`)
- [ ] Backend build succeeds (`npm run build` or equivalent)
- [ ] AI service build succeeds
- [ ] Build output is within expected size limits
- [ ] Source maps are disabled for production (or secured)
- [ ] Tree-shaking is working (no dead code in bundle)
- [ ] Docker images build successfully (if using Docker)

---

## Development Environment Deployment

### Infrastructure
- [ ] Local PostgreSQL is running with dev database created
- [ ] Local Redis is running
- [ ] Local MinIO or mock storage is configured
- [ ] Development Supabase project is active
- [ ] Environment variables point to dev services
- [ ] Docker containers are running (if using Docker Compose)

### Deployment Steps
- [ ] Run database migrations (`npm run migration:run`)
- [ ] Run database seeds (`npm run seed`)
- [ ] Start backend server (`npm run start:dev`)
- [ ] Start frontend dev server (`npm run dev`)
- [ ] Start AI service (`uvicorn main:app --reload`)
- [ ] Verify health endpoints return 200
- [ ] Run smoke tests against local deployment
- [ ] Verify hot-reload is working for all services

### Verification
- [ ] Can register a new user
- [ ] Can log in and receive JWT tokens
- [ ] Can create, read, update, delete garments
- [ ] Can create, read, update, delete outfits
- [ ] Can upload images
- [ ] AI detection works on uploaded images
- [ ] Calendar CRUD operations work
- [ ] WebSocket connection establishes and events flow
- [ ] Notifications appear in real-time
- [ ] All tests pass against local deployment

---

## Staging Environment Deployment

### Infrastructure
- [ ] Staging database is provisioned and accessible
- [ ] Staging Redis instance is running
- [ ] Staging Supabase project is configured
- [ ] Staging Cloudinary account/media library is set up
- [ ] Staging Firebase project is configured for FCM
- [ ] Subdomain/URL for staging is configured (staging.example.com)
- [ ] SSL certificates are valid (Let's Encrypt or provider-managed)
- [ ] Staging environment monitoring is active

### Deployment Steps
- [ ] Trigger CI/CD pipeline for staging deployment
- [ ] Or manually deploy via git push to staging branch
- [ ] Run database migrations (review first, then execute)
- [ ] Verify migration ran successfully (check schema, data integrity)
- [ ] Seed staging data (if needed)
- [ ] Verify all services are running (frontend, backend, AI)
- [ ] Check service logs for errors during startup

### Verification
- [ ] All smoke tests pass against staging
- [ ] Run full test suite against staging (if CI allows)
- [ ] Verify CORS is working (frontend can reach backend)
- [ ] Verify WebSocket connection from staging frontend to staging backend
- [ ] Verify file upload works (Cloudinary integration)
- [ ] Verify AI pipeline processes images correctly
- [ ] Verify email sending works (password reset, verification)
- [ ] Verify push notifications are delivered
- [ ] Check that 3D models load correctly
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Run Lighthouse audit (target: 90+ performance, accessibility, best practices)
- [ ] Verify all external integrations are using staging API keys/credentials
- [ ] Check error tracking (Sentry) for any unexpected errors
- [ ] Review performance metrics (response times, error rates)

---

## Production Environment Deployment

### Pre-Flight Checks (24h before)
- [ ] Announce maintenance window (if any) to users
- [ ] Notify stakeholders of planned deployment
- [ ] Verify production credentials/secrets are rotated (if needed)
- [ ] Check production database backup exists (test restore if possible)
- [ ] Verify production Redis backup exists
- [ ] Scale up infrastructure if expecting increased load
- [ ] Check CDN purging capabilities
- [ ] Verify rollback plan is documented and tested
- [ ] Ensure on-call engineer is available

### Infrastructure Verification
- [ ] Production database is provisioned and healthy
  - [ ] Connection pool size is adequate
  - [ ] Auto-scaling is configured (if cloud-hosted)
  - [ ] Backup schedule is active (daily minimum)
  - [ ] Point-in-time recovery is enabled
- [ ] Production Redis is provisioned and healthy
  - [ ] Memory limit is sufficient
  - [ ] Persistence is configured (RDB/AOF)
  - [ ] Eviction policy is set (allkeys-lru for cache)
- [ ] Production Supabase project is configured
  - [ ] Row Level Security policies are enabled
  - [ ] Backups are active
- [ ] Production Cloudinary account is configured
  - [ ] Upload presets are set
  - [ ] Delivery URLs are using production CDN
- [ ] Production Firebase project is active
- [ ] Domain DNS is configured:
  - [ ] A/AAAA records for main domain
  - [ ] CNAME for www subdomain
  - [ ] CNAME/Vercel domain for frontend
  - [ ] CNAME for API subdomain (api.example.com)
- [ ] SSL/TLS certificates are valid
- [ ] CDN is configured and caching rules set
- [ ] DDoS protection is enabled (Cloudflare or equivalent)
- [ ] Web Application Firewall (WAF) rules are configured
- [ ] Load balancer is configured (if multiple instances)
- [ ] Auto-scaling policies are set (min/max instances, CPU/memory triggers)

### Deployment Steps

#### Phase 1: Database (if migrations)
- [ ] Take database snapshot / backup
- [ ] Run migrations in read-only mode or maintenance window
- [ ] Verify migration success
- [ ] Check for data integrity issues
- [ ] Keep read-only mode until app is ready

#### Phase 2: Backend
- [ ] Deploy backend to production (Railway/Render/Docker)
- [ ] Verify health endpoint returns 200
- [ ] Check startup logs for errors
- [ ] Verify database connection is successful
- [ ] Verify Redis connection is successful
- [ ] Verify storage service connections (Cloudinary, Google Drive)
- [ ] Check CPU/memory usage after startup (stable, no leaks)
- [ ] Monitor error rates (should be 0 after warmup)

#### Phase 3: AI Service
- [ ] Deploy AI service to production
- [ ] Verify health endpoint returns 200
- [ ] Verify model loading is successful
- [ ] Check GPU memory utilization
- [ ] Run a test inference request
- [ ] Monitor inference latency

#### Phase 4: Frontend
- [ ] Deploy frontend to production (Vercel)
- [ ] Verify build succeeds with production env vars
- [ ] Check deployment logs for build errors
- [ ] Verify all pages load without errors
- [ ] Verify API calls reach the backend
- [ ] Verify WebSocket connection
- [ ] Verify 3D viewer loads (check console for WebGL errors)
- [ ] Check that images load from CDN/Cloudinary

#### Phase 5: Infrastructure Updates
- [ ] Update DNS if needed (wait for propagation)
- [ ] Purge CDN cache for updated assets
- [ ] Update monitoring dashboards for new deployment
- [ ] Configure alerting thresholds for new services

### Smoke Tests (Production)
- [ ] Visit homepage - loads correctly
- [ ] Register new user - success
- [ ] Login - success, receives tokens
- [ ] Create garment with image upload - success
- [ ] AI processes garment image - detection, classification, color, bg removal
- [ ] Update garment - changes persist
- [ ] Delete garment - removed from list
- [ ] Create outfit with 2+ garments - success
- [ ] Add/remove garments from outfit - changes persist
- [ ] View outfit detail - all garments shown
- [ ] Create calendar event - appears on calendar
- [ ] Link outfit to event - shows in event detail
- [ ] Receive notification (test) - delivered
- [ ] View analytics - charts render with data
- [ ] View 3D avatar - model loads and responds to controls
- [ ] Try on garment on avatar - preview renders
- [ ] Change settings - preferences persist after page reload
- [ ] Logout - redirected to login, cannot access protected pages
- [ ] Test 404 page for nonexistent routes
- [ ] Test error boundary (navigate to broken page)
- [ ] Verify all pages are responsive on mobile viewport

### Verification
- [ ] Run full E2E test suite against production (if safe)
- [ ] Check all third-party integrations:
  - [ ] Cloudinary image upload and delivery
  - [ ] Firebase Cloud Messaging
  - [ ] Email service (SendGrid/Mailgun)
  - [ ] Supabase connections
  - [ ] Redis cache operations
- [ ] Verify monitoring dashboards show green status
- [ ] Check error tracking for any new issues
- [ ] Verify logging is working (logs appearing in logging service)
- [ ] Test rate limiting (exceed limits, confirm cooldown)
- [ ] Verify HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] Check security headers (CSP, HSTS, X-Frame-Options)
- [ ] Verify CORS is working for production domain only
- [ ] Run performance test (Lighthouse, Web Vitals)
- [ ] Check mobile responsiveness on actual devices

---

## Post-Deployment Verification

### Immediate (First 30 Minutes)
- [ ] Monitor error rates - should be stable or decreasing
- [ ] Monitor response times - should be within normal range
- [ ] Monitor CPU/memory usage - no unexpected spikes
- [ ] Watch logs for any new error patterns
- [ ] Check Sentry for any unhandled errors
- [ ] Verify database query performance (slow queries log)
- [ ] Check cache hit rates (target >80%)
- [ ] Verify WebSocket connection stability
- [ ] Test file upload and AI processing end-to-end
- [ ] Check that background jobs are processing

### Short-term (First 24 Hours)
- [ ] Review error tracking daily summary
- [ ] Check for any user-reported issues
- [ ] Monitor database connection pool utilization
- [ ] Verify backup ran successfully
- [ ] Review performance metrics (p50, p95, p99 response times)
- [ ] Check disk space usage (logs, uploads, database)
- [ ] Verify email delivery rates
- [ ] Monitor notification delivery rates
- [ ] Check CDN cache hit rate
- [ ] Review cost/utilization metrics (if cloud-hosted)

### Long-term (First Week)
- [ ] Review weekly error report
- [ ] Analyze performance trends
- [ ] Check for memory leaks (monitor over 7 days)
- [ ] Review database growth rate
- [ ] Assess if auto-scaling thresholds need adjustment
- [ ] Collect user feedback on deployment
- [ ] Plan optimizations based on production data
- [ ] Schedule retrospective for deployment process

---

## Rollback Checklist

### Pre-Rollback Preparation
- [ ] Previous deployment artifacts are available (Docker images, build output)
- [ ] Database migration rollback scripts are ready
- [ ] Database backup is available and verified restorable
- [ ] Rollback runbook is documented and accessible
- [ ] Rollback decision criteria are defined (e.g., error rate >5%, p99 latency >5s)

### Rollback Triggers
- [ ] Error rate exceeds 5% of requests
- [ ] p99 response time exceeds 5 seconds
- [ ] Critical functionality is broken (auth, garment CRUD)
- [ ] Data integrity issues detected
- [ ] Security vulnerability discovered
- [ ] Database migration caused data loss
- [ ] User-reported issues affecting majority of users

### Rollback Execution
- [ ] Announce rollback to team and stakeholders
- [ ] Stop further deployment/rollout
- [ ] If database migration was applied:
  - [ ] Run rollback migration script
  - [ ] Verify schema returned to previous state
  - [ ] Verify data integrity (no orphaned records)
  - [ ] If rollback migration fails, restore from backup
- [ ] Revert frontend to previous version (Vercel rollback)
- [ ] Revert backend to previous version (redeploy previous Docker image)
- [ ] Revert AI service to previous version
- [ ] Purge CDN cache for rolled-back assets
- [ ] Verify all services are running previous version

### Post-Rollback Verification
- [ ] Run smoke tests (same as deployment smoke tests)
- [ ] Verify all critical flows work correctly
- [ ] Confirm error rates return to normal
- [ ] Check data consistency (no partial state from failed migration)
- [ ] Verify monitoring is green
- [ ] Notify stakeholders of successful rollback
- [ ] Create incident report with root cause analysis
- [ ] Schedule fix and re-deployment

---

## Database Migration Checklist

### Pre-Migration
- [ ] Migration script is reviewed and approved
- [ ] Migration has been tested on development database
- [ ] Migration has been tested on staging database
- [ ] Rollback script exists and is tested
- [ ] Migration is backward-compatible (old code works with new schema)
- [ ] No destructive operations on production data (prefer additive changes)
- [ ] If destructive: verify data backup exists and is tested restorable
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] Migration has timeout handling (long-running operations)
- [ ] Migration does not lock large tables for extended periods
- [ ] Use `CREATE INDEX CONCURRENTLY` for large table indexes
- [ ] Migration is wrapped in a transaction (unless unsupported)
- [ ] Performance impact is assessed (index rebuilds, full table scans)

### Migration Execution
- [ ] Run migration in dry-run mode (if supported)
- [ ] Execute migration
- [ ] Verify migration completed successfully (exit code 0)
- [ ] Check migrations table for correct tracking
- [ ] Verify new schema matches expected state
- [ ] Check for any constraint violations
- [ ] Verify data integrity with sample queries
- [ ] Check that indexes were created correctly
- [ ] Verify application can connect with new schema

### Post-Migration
- [ ] Run application smoke tests against migrated database
- [ ] Verify query performance with new schema (EXPLAIN ANALYZE)
- [ ] Monitor database for any lock contention
- [ ] Check for dead tuples (VACUUM if needed)
- [ ] Update database documentation/ERD
- [ ] Commit migration scripts to version control
- [ ] Tag migration version in codebase
