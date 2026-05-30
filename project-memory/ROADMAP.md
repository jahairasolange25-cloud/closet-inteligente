# Roadmap — Closet Inteligente Digital

> **Last Updated:** 2026-05-25
> **Built from:** Current implementation reality (see `PROJECT_REALITY_MATRIX.md`)
> **Previous roadmap:** Archived at `project-memory/archived-specs/roadmap-v1-planned.md`

---

## Phase 1: Backend Stabilization (Current)

**Goal:** Fix stubs, add missing migrations, achieve CI green with real tests.

| Task | Priority | Status | Notes |
|---|---|---|---|
| Write missing 23 DB migrations | HIGH | `NOT_STARTED` | Verify which tables are absent |
| Write unit tests for all 17 backend modules | HIGH | `NOT_STARTED` | Zero tests currently |
| Write E2E tests for auth, garment, outfit flows | HIGH | `NOT_STARTED` | CI test job is empty |
| Replace `simulateStep()` stub with AI service HTTP call | HIGH | `BLOCKED` | Needs AI service (Phase 3) |
| Replace in-memory QueueService with Bull/BullMQ | MEDIUM | `NOT_STARTED` | Redis already available |
| Add Swagger/OpenAPI decorators | LOW | `NOT_STARTED` | `BE-16` |
| Add health check endpoints | LOW | `NOT_STARTED` | `BE-17` |
| Add ADR-015 for raw pg / no ORM decision | LOW | `NOT_STARTED` | Document what was actually built |

**Exit criteria:** CI pipeline fully green (lint + typecheck + tests pass), all migrations present, stubs documented.

---

## Phase 2: Security Hardening — DONE 2026-05-26

**Goal:** Harden backend before frontend is built against it.

| Task | Priority | Status | Notes |
|---|---|---|---|
| Security audit (CORS, JWT config, SQL injection, XSS surface) | HIGH | `DONE` | SQL: parameterized queries throughout. JWT: HS256 + env-validated secrets. CORS: multi-origin support added. |
| Input sanitization review across all DTOs | HIGH | `DONE` | Fixed: UploadFileDto (crop/format allowlist, dimension bounds), SignedUrlDto (presets replacing free-form transforms), DeleteFileDto/ConsentDto (MaxLength), AvatarDto (HTTPS-only URLs) |
| Dependency vulnerability scan | MEDIUM | `DONE` | 12 prod vulns identified (4 high: multer DoS + @nestjs/core injection). All require NestJS v10→v11 upgrade — documented as known risk. No safe auto-fix available. |
| Rate limit tuning (per-route overrides, DDoS mitigation) | MEDIUM | `DONE` | Multer limits hardened: added fieldNameSize, fields, parts to both file upload interceptors. Existing Redis rate limit guard unchanged. |
| Secrets rotation strategy (.env.example audit) | MEDIUM | `DONE` | .env.example updated: added JWT_REFRESH_SECRET, PORT, NODE_ENV, openssl generation instructions, CORS multi-origin docs |

**Known risk (deferred):** NestJS v10→v11 upgrade required to fix multer DoS (GHSA-xf7r-hgr6-v32p, GHSA-v52c-386h-88mc) and @nestjs/core injection (GHSA-36xv-jgw5-4q75). Blocked pending E2E test suite for regression safety.

**Exit criteria:** ✅ OWASP top-10 reviewed. Remaining production vulns are NestJS framework-level (deferred).

---

## Phase 3: Frontend Foundation

**Goal:** Build the minimal working frontend against the existing backend.

| Task | Priority | Status | Notes |
|---|---|---|---|
| `FE-01` Scaffold Next.js app (TypeScript, Tailwind, App Router) | HIGH | `NOT_STARTED` | Create `frontend/` directory |
| `FE-02` Auth pages (login, register, password reset) | HIGH | `NOT_STARTED` | Supabase Auth UI |
| `FE-03` Responsive layout (header, sidebar, footer) | HIGH | `NOT_STARTED` | — |
| `FE-04` Zustand stores (auth, ui, notification slices) | HIGH | `NOT_STARTED` | — |
| `FE-05` TanStack Query setup (queryClient, auth token injection) | HIGH | `NOT_STARTED` | — |
| `FE-07` Wardrobe grid/list views | HIGH | `NOT_STARTED` | — |
| `FE-09` Garment detail page | MEDIUM | `NOT_STARTED` | — |
| `FE-10` Garment upload wizard | HIGH | `NOT_STARTED` | — |
| `FE-11` Outfit builder | HIGH | `NOT_STARTED` | — |
| `FE-13` Calendar/planner view | MEDIUM | `NOT_STARTED` | — |
| `FE-22` Error boundary, loading skeletons, toasts | MEDIUM | `NOT_STARTED` | — |
| `INF-02` Dockerfile for Next.js | LOW | `NOT_STARTED` | — |
| Add frontend service to `docker-compose.yml` | LOW | `NOT_STARTED` | — |
| Add frontend lint/typecheck to CI | MEDIUM | `NOT_STARTED` | — |

**Exit criteria:** User can register, log in, view wardrobe, upload garment, build outfit.

---

## Phase 4: AI Foundation

**Goal:** Build the Python AI service and connect the real CV pipeline.

| Task | Priority | Status | Notes |
|---|---|---|---|
| `AI-01` Scaffold FastAPI service | HIGH | `NOT_STARTED` | Create `ai/` directory |
| `AI-02` Garment segmentation endpoint (Detectron2 or ONNX) | HIGH | `NOT_STARTED` | Replaces STUB-001 |
| `AI-03` Attribute extraction (color, type, pattern) | HIGH | `NOT_STARTED` | — |
| Replace `simulateStep()` with real HTTP calls to AI service | HIGH | `BLOCKED` | Needs AI-01 + AI-02 |
| Replace thumbnail URL stub with Sharp/Cloudinary transform | MEDIUM | `NOT_STARTED` | — |
| `AI-04` Measurement estimation (OpenCV contour) | MEDIUM | `NOT_STARTED` | — |
| `AI-08` Color palette analyzer (k-means) | MEDIUM | `NOT_STARTED` | — |
| `INF-04` Dockerfile for Python AI service | LOW | `NOT_STARTED` | — |
| Add AI service to `docker-compose.yml` | LOW | `NOT_STARTED` | — |

**Exit criteria:** Garment upload triggers real background removal and attribute extraction.

---

## Phase 5: Rendering Foundation

**Goal:** Integrate Ready Player Me avatars and basic 3D try-on.

| Task | Priority | Status | Notes |
|---|---|---|---|
| `3D-01` Ready Player Me GLTF loader | HIGH | `NOT_STARTED` | — |
| `3D-05` Three.js scene (HDR, PBR lighting) | HIGH | `NOT_STARTED` | — |
| `FE-15` React Three Fiber avatar viewer | HIGH | `NOT_STARTED` | — |
| `FE-17` Avatar customization panel | MEDIUM | `NOT_STARTED` | — |
| `3D-02` Garment mesh generation (Blender Python) | HIGH | `NOT_STARTED` | — |
| `3D-03` UV texture mapping | MEDIUM | `NOT_STARTED` | — |
| `FE-18` Combined try-on view | HIGH | `NOT_STARTED` | — |

**Exit criteria:** User can view avatar wearing an uploaded garment in 3D.

---

## Phase 6: AI Recommendations

**Goal:** Replace heuristic recommendations with ML-powered engine.

| Task | Priority | Status | Notes |
|---|---|---|---|
| `AI-05` CLIP-based style embeddings | HIGH | `NOT_STARTED` | Replaces STUB-003 |
| pgvector extension + garment embedding index | HIGH | `NOT_STARTED` | — |
| `AI-06` Outfit compatibility scorer (cosine similarity) | HIGH | `NOT_STARTED` | — |
| `AI-07` Weather-based suggestions (OpenWeatherMap) | MEDIUM | `NOT_STARTED` | — |
| `FE-12` AI recommendations panel | HIGH | `NOT_STARTED` | — |
| `AI-09` Wear frequency predictor | LOW | `NOT_STARTED` | — |

**Exit criteria:** Recommendations come from ML model, not color heuristics.

---

## Phase 7: Integration + Testing

**Goal:** Full integration, coverage targets, and production preparation.

| Task | Priority | Status | Notes |
|---|---|---|---|
| Integration tests for all critical user journeys | HIGH | `NOT_STARTED` | — |
| Load test backend with 100 concurrent users | MEDIUM | `NOT_STARTED` | — |
| Lighthouse ≥90 desktop, ≥75 mobile | MEDIUM | `NOT_STARTED` | — |
| Sentry error tracking | MEDIUM | `NOT_STARTED` | — |
| Log aggregation (Logtail/Papertrail) | LOW | `NOT_STARTED` | — |
| Database backup strategy | HIGH | `NOT_STARTED` | — |
| `INF-06` CD pipeline (deploy on merge to main) | MEDIUM | `NOT_STARTED` | — |

---

## Phase 8: Production Hardening + Beta Launch

**Goal:** Beta-ready platform.

| Task | Priority | Status | Notes |
|---|---|---|---|
| Onboarding wizard (welcome, first upload, avatar setup) | HIGH | `NOT_STARTED` | — |
| Terms of Service + Privacy Policy pages | HIGH | `NOT_STARTED` | — |
| Final E2E test pass on all critical flows | HIGH | `NOT_STARTED` | — |
| SEO (metadata, sitemap, Open Graph) | LOW | `NOT_STARTED` | — |
| Beta launch materials | LOW | `NOT_STARTED` | — |

---

## Dependency Graph

```
Phase 1 (Stabilization)
  └─► Phase 2 (Security)
        └─► Phase 3 (Frontend)
              └─► Phase 4 (AI Service)
                    ├─► Phase 5 (3D Rendering)  [depends on AI segmentation]
                    └─► Phase 6 (ML Recommendations)  [depends on AI embeddings]
                          └─► Phase 7 (Integration + Testing)
                                └─► Phase 8 (Beta Launch)
```

Critical path: Phase 1 → Phase 3 → Phase 4 → Phase 7 → Phase 8
