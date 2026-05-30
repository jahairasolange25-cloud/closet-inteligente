# Project Status — Closet Inteligente Digital

> **Last Updated:** 2026-05-26
> **Current Phase:** Backend Runtime Validated — APIs working end-to-end
> **Overall Progress:** ~30%
> **CRITICAL:** See `PROJECT_REALITY_MATRIX.md` before acting on any status claim here.

---

## Reality Check

**What is done:** NestJS backend modules runtime-validated via live Docker testing. Auth, Garments, Outfits, Calendar, Notifications, Analytics, Consent, Export, WebSocket all confirmed working against real DB and Redis. 9 DTO bugs fixed (field name mismatches blocking API calls). JWT auth, token blacklist, rate limiting, soft delete, full-text search all confirmed.

**What is NOT done:** Frontend, AI service, 3D rendering, full E2E test suite, 18 of 35 migrations, Swagger docs, `GET /analytics/dashboard`, `POST /calendar`, `GET /calendar/range`.

**What is stubbed:** AI pipeline (`simulateStep`), job queue (in-memory EventEmitter), outfit recommendations (heuristic, not ML).

---

## Component Status Table

### Backend — NestJS Application

| # | Component | Status | Progress | Blockers |
|---|---|---|---|---|
| BE-01 | NestJS scaffolding + common | `DONE` | 95% | No tests |
| BE-02 | Auth module (Supabase JWT) | `DONE` | 95% | No tests |
| BE-03 | Garments CRUD | `DONE` | 90% | Missing migrations 10–18; no tests |
| BE-04 | Outfits CRUD | `DONE` | 85% | Recommendation is heuristic stub; no tests |
| BE-05 | PostgreSQL migrations | `IN_PROGRESS` | 34% | 12 of 35 claimed files exist |
| BE-06 | Analytics module | `IN_PROGRESS` | 70% | AI precision metric is mocked |
| BE-07 | Calendar module | `DONE` | 90% | No tests |
| BE-08 | Notifications module | `DONE` | 90% | No tests |
| BE-09 | Storage (Cloudinary) | `DONE` | 95% | No tests |
| BE-10 | Pipeline service | `IN_PROGRESS` | 30% | STUB-001: simulateStep() — no real CV |
| BE-11 | Redis cache service | `DONE` | 95% | No tests |
| BE-12 | WebSocket gateway | `DONE` | 90% | No tests |
| BE-13 | Webhook receiver | `NOT_STARTED` | 0% | Post-MVP |
| BE-14 | Rate limiting | `DONE` | 95% | No tests |
| BE-15 | Validation pipe | `DONE` | 95% | No tests |
| BE-16 | Swagger/OpenAPI | `NOT_STARTED` | 0% | Easy to add |
| BE-17 | Health check endpoints | `NOT_STARTED` | 0% | Easy to add |
| BE-18 | Queue service | `IN_PROGRESS` | 20% | STUB-002: in-memory EventEmitter |

### Frontend — Next.js Application

| # | Component | Status | Progress | Notes |
|---|---|---|---|---|
| FE-01–FE-22 | All frontend components | `NOT_STARTED` | 0% | No `frontend/` directory exists |

### AI / Computer Vision — Python Services

| # | Component | Status | Progress | Notes |
|---|---|---|---|---|
| AI-01–AI-11 | All AI components | `NOT_STARTED` | 0% | No Python directory exists |

### 3D Rendering — Three.js / Blender Pipeline

| # | Component | Status | Progress | Notes |
|---|---|---|---|---|
| 3D-01–3D-08 | All 3D components | `NOT_STARTED` | 0% | No Three.js or Blender code exists |

### Infrastructure & DevOps

| # | Component | Status | Progress | Notes |
|---|---|---|---|---|
| INF-01 | Docker Compose | `DONE` | 90% | EXISTS: postgres + redis + backend only |
| INF-02 | Dockerfile (Next.js) | `NOT_STARTED` | 0% | Frontend does not exist |
| INF-03 | Dockerfile (NestJS) | `DONE` | 95% | EXISTS: `backend/Dockerfile` |
| INF-04 | Dockerfile (Python AI) | `NOT_STARTED` | 0% | AI service does not exist |
| INF-05 | GitHub Actions CI | `DONE` | 85% | EXISTS: 5 jobs; test job has 0 test files |
| INF-06–INF-15 | Remaining infra | `NOT_STARTED` | 0% | Post-frontend/AI phases |

### Testing

| # | Component | Status | Progress | Notes |
|---|---|---|---|---|
| All tests | Unit, integration, E2E | `NOT_STARTED` | 0% | Zero `.spec.ts` or `.test.ts` files exist |

---

## Known Issues

| ID | Issue | Severity | Status |
|---|---|---|---|
| KI-01 | Zero E2E test files — unit smoke tests exist but no integration tests | HIGH | Open |
| KI-02 | Pipeline uses `simulateStep()` — no real CV processing | HIGH | Open |
| KI-03 | QueueService is in-memory EventEmitter — jobs lost on restart | MEDIUM | Open |
| KI-04 | 18 of 35 claimed migrations are missing | HIGH | Open |
| KI-09 | `GET /analytics/dashboard` route missing from controller | MEDIUM | Open |
| KI-10 | `POST /calendar` (create entry) not implemented | MEDIUM | Open |
| KI-11 | API contract uses camelCase; DTOs use snake_case — doc mismatch | LOW | Open |
| KI-05 | Recommendation engine is heuristic, not ML | MEDIUM | Acceptable for MVP |
| KI-06 | Thumbnail generation is URL string manipulation, not real image processing | MEDIUM | Open |
| KI-07 | Analytics "AI precision" metric is a placeholder | LOW | Open |
| KI-08 | Frontend does not exist — product is not usable by end users | CRITICAL | Open |

---

## Next Milestones

| Milestone | Status | Priority |
|---|---|---|
| M1: Backend stabilization (tests, missing migrations, stub replacement) | `IN_PROGRESS` | HIGH |
| M2: Frontend foundation (Next.js scaffold, auth pages, layout) | `NOT_STARTED` | HIGH |
| M3: AI service foundation (FastAPI scaffold, garment segmentation) | `NOT_STARTED` | HIGH |
| M4: Replace pipeline stub with real CV calls | `NOT_STARTED` | HIGH |
| M5: Replace queue stub with Bull/BullMQ | `NOT_STARTED` | MEDIUM |
| M6: 3D rendering foundation | `NOT_STARTED` | LOW |
| M7: Beta launch | `NOT_STARTED` | — |

---

## Active Phases

| Phase | Focus | Status |
|---|---|---|
| Phase 1: Backend Stabilization | Tests, missing migrations, stub docs | `IN_PROGRESS` |
| Phase 2: Frontend Foundation | Next.js, auth pages, layout, wardrobe views | `NOT_STARTED` |
| Phase 3: AI Foundation | FastAPI, CV pipeline, real pipeline integration | `NOT_STARTED` |
| Phase 4: Rendering Foundation | Three.js, avatar, try-on | `NOT_STARTED` |
| Phase 5: Integration + Testing | Connect all layers, test coverage | `NOT_STARTED` |
| Phase 6: Production Hardening | Security, performance, monitoring, beta launch | `NOT_STARTED` |

---

## Decision Log

| ADR # | Title | Status |
|---|---|---|
| ADR-001 | Use Next.js for frontend | `ACCEPTED` — not yet implemented |
| ADR-002 | Use NestJS for backend | `ACCEPTED` — implemented |
| ADR-003 | Use Supabase / PostgreSQL | `ACCEPTED` — implemented |
| ADR-004 | Use Redis for caching | `ACCEPTED` — implemented |
| ADR-005 | Use Socket.IO for realtime | `ACCEPTED` — implemented |
| ADR-006 | Use Detectron2 for segmentation | `ACCEPTED` — not yet implemented |
| ADR-007 | Use React Three Fiber for 3D | `ACCEPTED` — not yet implemented |
| ADR-008 | Use Zustand for state management | `ACCEPTED` — not yet implemented |
| ADR-009 | Use Tailwind CSS for styling | `ACCEPTED` — not yet implemented |
| ADR-010 | Use Supabase JWT for auth | `ACCEPTED` — implemented |
| ADR-011 | Use Cloudinary for file storage | `ACCEPTED` — implemented |
| ADR-012 | Use FCM for push notifications | `ACCEPTED` — not yet implemented |
| ADR-013 | Deployment targets | `ACCEPTED` — not yet implemented |
| ADR-014 | Docker containerization | `ACCEPTED` — partially implemented |
| ADR-015 | Use raw pg (no ORM) | `ACCEPTED` — implemented (overrides original TypeORM decision) |
