# Known Limitations — Closet Inteligente Digital
> Last Updated: 2026-05-27 — Release Candidate Hardening Phase  
> Purpose: Honest documentation of every known gap for operators and developers.

---

## Critical (Must Fix Before Production User Traffic)

### 1. No SSL/TLS in Staging
- **What:** Nginx reverse proxy is configured but SSL certificates are not provisioned.
- **Impact:** All traffic including auth tokens transmitted in plaintext.
- **Fix:** Run `certbot --nginx -d yourdomain.com` and update Nginx config.
- **Effort:** 2-4 hours.

### 2. Cloudinary Keys Not in CI
- **What:** Storage integration tests and E2E upload flows are skipped when `CLOUDINARY_CLOUD_NAME` is not set.
- **Impact:** Upload functionality is untested in automated pipelines.
- **Fix:** Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` as GitHub Actions secrets.
- **Effort:** 30 minutes.

### 3. `uploadTemp` Writes to Local Disk
- **What:** `StorageService.uploadTemp()` writes to `uploads/temp/` on the local filesystem.
- **Impact:** In multi-container or multi-host deployments, temp files are not shared. The temp upload path is also not accessible from other services.
- **Fix:** Migrate `uploadTemp` to use a Cloudinary unsigned upload preset or an S3 temp bucket.
- **Effort:** 4-6 hours.

---

## High (Should Fix Within 30 Days)

### 4. E2E Tests Created But Not Run
- **What:** Playwright E2E suite was created in the hardening phase but has not been executed against a live Docker stack.
- **Impact:** E2E coverage is theoretical; real integration issues may exist.
- **Fix:** Run `pnpm e2e:install && pnpm e2e` with Docker stack running.
- **Effort:** 2 hours.

### 5. pgcrypto Not Enabled for Sensitive Fields
- **What:** Email addresses and other PII fields are stored in plaintext in PostgreSQL.
- **Impact:** If the database is compromised, PII is exposed.
- **Fix:** Enable `pgcrypto` extension, add an encryption migration, update application code to encrypt/decrypt.
- **Effort:** 1-2 days.

### 6. k6 Performance Baselines Not Established
- **What:** k6 scenarios were written in the hardening phase but have not been run; no p95/p99 baselines exist.
- **Impact:** No quantitative performance regression protection.
- **Fix:** Run `./performance/k6/run-all.sh`, capture baseline, add CI threshold check.
- **Effort:** 2-4 hours.

### 7. Consent Records Only in Redis (No DB Backup)
- **What:** User consent records use `ConsentService` with Redis 365-day TTL. If Redis data is lost, consent records must be re-acquired.
- **Impact:** Compliance risk — consent is hard to audit without persistent storage.
- **Fix:** Add consent records to PostgreSQL as a durable source of truth; use Redis only as cache.
- **Effort:** 4 hours.

---

## Medium (Should Fix Within 90 Days)

### 8. CSP `'unsafe-inline'` for Styles
- **What:** Content-Security-Policy allows `style-src 'unsafe-inline'` to support Tailwind CSS inline styles.
- **Impact:** Reduces effectiveness of CSP against XSS attacks that inject inline styles.
- **Fix:** Implement CSP nonce propagation from Next.js to all inline styles; or switch to CSS modules/hashed classes.
- **Effort:** 1-2 days.

### 9. Analytics AI Precision Metrics Are Mocked
- **What:** `GET /api/v1/analytics/ai-precision` returns hardcoded placeholder accuracy data.
- **Impact:** Dashboard shows misleading data if presented to users.
- **Fix:** Implement real model evaluation pipeline; store evaluation results in DB.
- **Effort:** 2-3 weeks (requires ML pipeline work).

### 10. Mobile Camera Capture Not Implemented
- **What:** The mobile audit documented camera capture as a key use case. No camera API integration exists.
- **Impact:** Users on mobile cannot take photos directly; must upload from gallery.
- **Fix:** Implement `getUserMedia`-based capture or React Native camera module.
- **Effort:** 1 week.

### 11. Online Learning Not Implemented
- **What:** The recommendation engine stores user feedback but does not use it to update model weights.
- **Impact:** Recommendations do not improve over time based on user behavior.
- **Fix:** Implement feedback loop: batch process feedback → update scoring weights.
- **Effort:** 2-3 weeks.

### 12. No Prometheus Alerting Rules
- **What:** Prometheus is deployed and scraping metrics, but no alerting rules (Alertmanager) are configured.
- **Impact:** No automatic notification when error rates spike, memory is high, or queue backs up.
- **Fix:** Add `alert.rules.yml` to Prometheus config; configure Alertmanager with PagerDuty/Slack.
- **Effort:** 4-8 hours.

### 13. Export Service Has No Confirmed File Generation
- **What:** The export service creates async export requests with Redis metadata but the actual file generation (CSV/ZIP) has not been confirmed to work end-to-end.
- **Impact:** Users may request exports that silently fail.
- **Fix:** Add an E2E export test that validates the generated file is downloadable.
- **Effort:** 4-8 hours.

---

## Low (Nice to Have / Future Phases)

### 14. No Swagger/OpenAPI Documentation
- **What:** API is not documented with Swagger UI or OpenAPI spec.
- **Impact:** Developer onboarding friction; no machine-readable API contract.
- **Fix:** Add `@nestjs/swagger` decorators and `/api/docs` endpoint.
- **Effort:** 4-8 hours.

### 15. CLIP Model Not Implemented (ResNet50 Used)
- **What:** Embedding service uses ResNet50 512-dim embeddings instead of CLIP.
- **Impact:** Semantic search quality is lower than it could be; multi-modal (text+image) search not possible.
- **Fix:** Replace ResNet50 with CLIP (ViT-B/32 or larger); update embedding pipeline.
- **Effort:** 1-2 weeks (model size: 400MB+).

### 16. 3D Avatar Try-On Not Implemented
- **What:** Avatar contracts and skeleton mapping are designed; Three.js scene is not implemented.
- **Impact:** Avatar feature is not functional; garment-fit contracts exist with no renderer.
- **Fix:** Implement Three.js scene, GLTF loader, garment layer system.
- **Effort:** 3-6 weeks.

### 17. No Auto-Scaling Configuration
- **What:** Scaling rules are documented but not applied to any orchestration system.
- **Impact:** System will not automatically scale under load.
- **Fix:** Deploy to Kubernetes or ECS; apply horizontal pod autoscaler rules from `scaling-strategy.md`.
- **Effort:** 1-2 weeks (infrastructure work).

### 18. PWA Not Implemented
- **What:** PWA strategy is documented; no service worker, no `manifest.json`.
- **Impact:** No offline support, no install-to-home-screen, no push notifications.
- **Fix:** Add Next.js PWA plugin; implement service worker with background sync.
- **Effort:** 3-5 days.

### 19. Offline Sync Not Implemented
- **What:** `useOnlineStatus` hook and `OfflineBanner` component exist. Background sync (queuing mutations while offline) is not implemented.
- **Impact:** Users cannot create/update garments while offline; changes are lost.
- **Fix:** Implement IndexedDB mutation queue with sync-on-reconnect.
- **Effort:** 1-2 weeks.

### 20. Storage Provider Abstraction Not Implemented
- **What:** `storage-abstraction.md` documents a `StorageProvider` interface for switching between Cloudinary/S3/GCS. Only Cloudinary is implemented.
- **Impact:** Changing storage providers requires code changes.
- **Fix:** Implement abstract `IStorageProvider` interface with pluggable providers.
- **Effort:** 3-5 days.

---

## Won't Fix (Out of Scope)

| Item | Reason |
|---|---|
| Cloth physics simulation | Requires Three.js scene first; long-term future phase |
| GDPR "right to be forgotten" automated pipeline | Manual process sufficient at current scale |
| Multi-region deployment | Single-region sufficient for current user volume |
