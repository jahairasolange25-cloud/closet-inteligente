# Project Reality Matrix — Closet Inteligente Digital

> **Last Updated:** 2026-05-27 — Release Candidate Hardening Phase
> **Purpose:** Single source of truth for what is actually implemented vs. documented.
> **Rule:** If this file contradicts any other project-memory file, this file wins.

---

## Implementation Summary

| Layer | Status | Evidence |
|---|---|---|
| **Backend (NestJS)** | DONE — all modules real | `backend/src/` |
| **Database Migrations** | DONE — 39 of 39 claimed | `backend/src/database/migrations/` |
| **Tests (Backend)** | PASSING | 9 spec files, 41/41 tests pass |
| **Tests (Python)** | PASSING | 5 test files, 19/19 tests pass |
| **AI Service (Python/FastAPI)** | DONE (Foundation V1 + Embeddings) | `python/app/` — real CV pipeline + ResNet50 |
| **Recommendation Engine** | V2 — ML-assisted ranking | `backend/src/outfits/recommendation.service.ts` |
| **Vector Search** | DONE — pgvector + IVFFlat | `VectorSearchService` + migrations |
| **Semantic Search** | DONE — cosine similarity | API endpoints + Python embedding service |
| **Frontend (Next.js)** | EXISTS | `frontend/` directory |
| **3D Rendering Pipeline** | DESIGNED — no code yet | `garment-fit.contracts.ts` + avatar-fitting-pipeline.md |
| **Wardrobe Intelligence** | DONE | `IntelligenceService` — insights, trends, funnels |
| **Cloud Scale Docs** | DONE | `cloud-architecture-v2.md`, `scaling-strategy.md`, `storage-abstraction.md` |
| **Mobile Strategy** | DOCUMENTED | `mobile.md` — audit + implementation plan |
| **Docker Compose** | EXISTS (backend + AI + DB + Redis) | `docker-compose.yml` |
| **Docker Compose (Staging)** | CREATED (9 services) | `docker-compose.staging.yml` |
| **Nginx Reverse Proxy** | CREATED | `infrastructure/nginx/` |
| **Frontend Dockerfile** | CREATED | `frontend/Dockerfile` |
| **Prometheus + Grafana** | CREATED | `infrastructure/prometheus/`, `infrastructure/grafana/` |
| **OpenTelemetry** | CREATED | `infrastructure/otel/` |
| **Backend Dockerfile** | EXISTS | `backend/Dockerfile` + `Dockerfile.dev` |
| **Python Dockerfile** | EXISTS | `python/Dockerfile` |
| **GitHub Actions CI** | EXISTS | `.github/workflows/ci.yml` |

---

## Implemented Systems

| Module | Path | Status | Notes |
|---|---|---|---|
| Auth | `backend/src/auth/` | REAL | Register, login, refresh, profile, JWT guard |
| Garments CRUD | `backend/src/garments/` | REAL | Create, list, get, update, delete, search, upload, pipeline trigger |
| Outfits CRUD | `backend/src/outfits/` | REAL | CRUD + V2 ML-assisted recommendations |
| Recommendations | `backend/src/outfits/recommendation.service.ts` | REAL (V2) | Contextual, color, rotation, diversity scoring + explanations |
| Vector Search | `backend/src/outfits/vector-search.service.ts` | REAL | pgvector similarity, semantic search, duplicate detection |
| Avatars | `backend/src/avatars/` | REAL | CRUD for avatar records + versions |
| Calendar | `backend/src/calendar/` | REAL | Events CRUD, grouped by date |
| Notifications | `backend/src/notifications/` | REAL | List, mark read, preferences |
| Analytics | `backend/src/analytics/` | REAL | Garment stats, usage analytics, intelligence |
| Wardrobe Intelligence | `backend/src/analytics/intelligence.service.ts` | REAL | Insights, trends, funnels, retention |
| Storage | `backend/src/storage/` | REAL | Cloudinary upload, signed URL, delete, temp upload |
| Export | `backend/src/export/` | REAL | Async export with Redis metadata |
| Consent | `backend/src/consent/` | REAL | Redis-backed, GET/PATCH, 365d TTL |
| WebSocket | `backend/src/websocket/` | REAL | Socket.IO `/ws`, JWT auth |
| Redis | `backend/src/redis/` | REAL | Cache-aside, rate limiting, consent, audit |
| Database | `backend/src/database/` | REAL | pg Pool with 39 migrations |
| Common | `backend/src/common/` | REAL | Guards, filters, pipes, interceptors, decorators |
| Pipeline Service | `backend/src/pipeline/` | REAL | BullMQ worker, Redis status, full pipeline orchestration |
| AI Service (Python) | `python/app/` | REAL | FastAPI, background removal, colors, classification, thumbnails, embeddings |
| Embedding Service | `python/app/services/embedding_service.py` | REAL | ResNet50 512-dim embeddings |
| HttpAIPipelineAdapter | `backend/src/pipeline/http-ai-pipeline.adapter.ts` | REAL | HTTP client to Python service, retries, circuit breaker |
| Pipeline Results Migration | `backend/src/database/migrations/20260527_000037_add_pipeline_results.sql` | REAL | Adds dominant_colors, ai_classification, etc. |
| pgvector Support | `backend/src/database/migrations/20260527_000038_enable_pgvector.sql` | REAL | Enables pgvector extension |
| Recommendation Engine DB | `backend/src/database/migrations/20260527_000039_add_recommendation_engine.sql` | REAL | Embeddings, feedback, wear history, metrics tables |
| Garment Fit Contracts | `backend/src/avatars/garment-fit.contracts.ts` | REAL | Types, skeleton mapping, conflict rules |

---

## Stubbed / Partially Implemented Systems

| System | Location | What Is Stubbed | What Needs Real Implementation |
|---|---|---|---|
| Analytics "AI Precision" | `backend/src/analytics/` | Returns placeholder/mocked accuracy metrics | Real ML model evaluation data |
| 3D Avatar Try-On | `backend/src/avatars/garment-fit.contracts.ts` | Contracts exist, no render implementation | Three.js scene, mesh loading |
| CLIP model | `python/app/services/embedding_service.py` | Uses ResNet50, not CLIP | Replace with actual CLIP model |
| Online learning | `backend/src/outfits/recommendation.service.ts` | Feedback stored, not used for weight adjustment | Real-time weight update from feedback |
| Storage.uploadTemp | `backend/src/storage/storage.service.ts` | Writes to local disk instead of Cloudinary | Signed upload or temp bucket strategy |

### CORRECTED — Previously listed as stubs (they are NOT stubs):

| System | Actual Status | Evidence |
|---|---|---|
| Queue System | REAL BullMQ — DLQ, exponential backoff, retry, metrics, concurrency | `backend/src/queue/queue.service.ts` |
| Pipeline AI Adapter | REAL — HTTP circuit breaker, per-step timeout, global timeout, retries | `backend/src/pipeline/http-ai-pipeline.adapter.ts` |
| CSRF Guard | REAL — double-submit cookie pattern | `backend/src/common/guards/csrf.guard.ts` |
| Helmet CSP | REAL but weak — `'unsafe-inline'` + `'unsafe-eval'` present | `backend/src/main.ts` |

---

## Missing Systems (Not Started)

| System | Required By | Blocker |
|---|---|---|
| Cloth physics simulation | Avatar realism | Requires Three.js scene first |
| Full CLIP model | Search quality | Model weight size (400MB+) |
| E2E testing | CI pipeline confidence | Requires Docker environment |
| Swagger/OpenAPI docs | Developer onboarding | Trivial to add — deferred |
| PWA service worker | Offline mode | Requires HTTPS production deployment |

---

## Active Blockers

| Blocker | Severity | Affects | Status |
|---|---|---|---|
| No Cloudinary keys in CI | MEDIUM | Storage tests, E2E upload flow | OPEN — requires manual secret setup |
| No E2E tests | MEDIUM | CI pipeline | IMPLEMENTING — Phase A |
| SSL/TLS not configured in staging | MEDIUM | Production readiness | OPEN — requires cert provisioning |
| CSRF guard not registered globally | MEDIUM | Security | OPEN — registered per-controller only |
| CSP has `'unsafe-inline'` / `'unsafe-eval'` | MEDIUM | Security | OPEN — Next.js dev requirement; prod CSP hardening needs nonce strategy |
| No k6 performance tests | LOW | Performance validation | IMPLEMENTING — Phase G |
| CLIP model not fine-tuned | LOW | Search quality | OPEN |
| 3D scene not implemented | LOW | Avatar try-on | OPEN |
| uploadTemp writes to local disk | LOW | Storage consistency | IMPLEMENTING — Phase B |
