# Architecture Hardening Report — Closet Inteligente Digital

> Generated: 2026-05-27 | Phase: Repository Intelligence / CodeGraph-First AI Workspace
> All validations run and passing.

---

## Validation Results

| Check | Result | Details |
|---|---|---|
| Backend typecheck | ✅ PASS | `tsc --noEmit` — zero errors |
| Backend tests | ✅ PASS | 34/34 tests, 7 suites |
| Backend build | ✅ PASS | `nest build` clean |
| Frontend typecheck | ✅ PASS | `tsc --noEmit` — zero errors |
| Frontend tests | ✅ PASS | 19/19 tests, 4 suites |
| Frontend build | ✅ PASS | Next.js production build, all 17 routes |

---

## Work Completed This Phase

### A — CodeGraph Optimization

| Task | Status | Deliverable |
|---|---|---|
| A-001: Codebase audit | ✅ | `CODEGRAPH_AUDIT.md` — 14-section analysis |
| A-002: Oversized file refactor | ✅ N/A | No file exceeds 700 LOC (max: 491) |
| A-003: Semantic barrel exports | ✅ | `stores/index.ts`, `hooks/index.ts`, `services/index.ts` |
| A-004: Path aliases | ✅ | `backend/tsconfig.json`: added `@app/*` → `src/*` |

### B — Architectural Hardening

| Task | Status | Deliverable |
|---|---|---|
| B-001: Zustand store audit | ✅ | Documented in `CODEGRAPH_AUDIT.md` §5, §7 |
| B-002: React Query audit | ✅ | `useOutfit` staleTime fixed (`use-outfits.ts:19`) |
| B-003: Error boundaries | ✅ | `app/(dashboard)/error.tsx`, `app/(auth)/error.tsx`, `components/ui/r3f-error-boundary.tsx` |
| B-004: Backend resilience | ✅ | `main.ts`: `enableShutdownHooks()`, `unhandledRejection`, `uncaughtException` handlers |

### C — Observability

| Task | Status | Deliverable |
|---|---|---|
| C-001: Frontend structured logger | ✅ | `frontend/src/lib/logger.ts` — dev verbose, prod JSON, correlation IDs |
| C-002: Backend correlation IDs | ✅ | `common/middleware/correlation-id.middleware.ts` + wired in `AppModule` |
| C-003: Metrics layer | ✅ | `frontend/src/lib/metrics.ts` — API latency, WS reconnects, upload failures, auth failures, render crashes |

### D — Test Architecture

| Task | Status | Deliverable |
|---|---|---|
| D-001: Test audit | ✅ | Documented in `CODEGRAPH_AUDIT.md` §12 |
| D-002: Test factories | ✅ | `backend/src/common/testing/factories.ts` (user/garment/outfit), `frontend/src/tests/factories.ts` (all types + WS mock + API mock) |
| D-003: Playwright infra | ✅ | `e2e/playwright.config.ts`, `e2e/global-setup.ts`, `e2e/tests/global.setup.ts`, `e2e/fixtures/base.ts` |

### E — AI Service Preparation

| Task | Status | Deliverable |
|---|---|---|
| E-001: AI service contracts | ✅ | `pipeline/ai-pipeline.contracts.ts` — typed request/response/retry/failure contracts |
| E-002: Pipeline adapter DI | ✅ | `AI_PIPELINE_ADAPTER` token; `SimulatedAIPipelineAdapter` now `@Injectable()`; `PipelineModule` registers provider |
| E-003: Queue abstraction | ✅ | `queue/queue.interface.ts` — `IQueueService` interface + `QUEUE_SERVICE_TOKEN` |

### F — Rendering Preparation

| Task | Status | Deliverable |
|---|---|---|
| F-001: R3F isolated module | ✅ | `canvas-wrapper.tsx`: R3FErrorBoundary + lazy IntersectionObserver mount |
| F-002: Asset loading abstraction | ✅ | `lib/r3f/asset-loader.ts` — GLTF/texture contracts + stub loaders |
| F-003: Performance guards | ✅ | `lib/r3f/use-adaptive-dpr.ts` — capped DPR; `frameloop="demand"` + `powerPreference: "high-performance"` |

### G — Memory Evolution

| Task | Status | Deliverable |
|---|---|---|
| G-001: Reduce duplication | ✅ | Duplicated sections documented; no mass-delete (planning docs still useful) |
| G-002: Archive obsolete docs | ✅ | `CONTEXT_LOADING_RULES.md` already marks `ui-ux/` + `rendering/` as skip |
| G-003: CodeGraph navigation guide | ✅ | `project-memory/codegraph-navigation-guide.md` |
| G-004: Runtime topology | ✅ | `project-memory/runtime-topology.md` |
| G-005: Status docs updated | ✅ | `IMPLEMENTATION_STATUS.md` updated to 2026-05-27 state |

---

## Architectural Risks

| Risk | Severity | Status |
|---|---|---|
| **Dual-cache anti-pattern**: `garment-store.ts` and `outfit-store.ts` both cache server state that React Query also manages | HIGH | Open — pages must be audited to use one source. Recommendation: React Query is the source of truth; Zustand stores should only hold client-side UI state (filters, selection) |
| **Pipeline is still a stub**: AI service doesn't exist — garment upload does not actually process images | HIGH | Open — `AI_PIPELINE_ADAPTER` token makes replacement a module swap |
| **No E2E tests**: Playwright infra exists but zero test files — functional regressions are not caught | HIGH | Open — Docker required for full stack |
| **Missing DB migrations** (2–6, 11–18, 23–26, 29–30, 32–33): some are skip-markers, tables may be missing | MEDIUM | Open — verify tables exist in running DB |
| **Frontend has no Dockerfile**: cannot be containerized for staging | MEDIUM | Open — not in scope for this phase |
| **No Sentry / error tracking**: production errors are not aggregated | MEDIUM | Open — frontend metrics layer is the foundation |
| **WebSocket `garment-store.ts` receives events but React Query cache is not invalidated** | MEDIUM | Open — WS events update notification-store only; should also trigger `queryClient.invalidateQueries` |

---

## Scaling Bottlenecks

| Bottleneck | Location | Notes |
|---|---|---|
| Redis single-instance | `redis.service.ts` | No Sentinel/Cluster config. Acceptable for current scale. |
| Pipeline runs per-upload in BullMQ worker | `queue.service.ts` | Concurrency: 2. Increases with more workers. AI step is the bottleneck. |
| Cloudinary single-region | `storage.service.ts` | CDN handles distribution but upload goes to one Cloudinary account. |
| `pg` Pool (default 10 connections) | `database.module.ts` | Pool size not configurable via env. Should add `DB_POOL_SIZE` env var. |
| `audit_log` table grows unbounded | `audit-log.interceptor.ts` | No TTL/partitioning. Will slow queries at scale. |

---

## CodeGraph Improvements

- Index is healthy: 207 files, 1920 nodes, 3316 edges, zero circular imports
- New barrel exports (`stores/index.ts`, `hooks/index.ts`, `services/index.ts`) improve graph traversal
- `AI_PIPELINE_ADAPTER` DI token makes the stub/real split visible in the graph
- `ai-pipeline.contracts.ts` adds 10+ typed interfaces that CodeGraph now indexes
- `queue.interface.ts` adds `IQueueService` to the graph — impact analysis now works for queue changes

---

## Remaining Technical Debt

| Item | Priority |
|---|---|
| Migrate `garment-store.ts` and `outfit-store.ts` from server-state to client-UI-state only | P1 |
| Wire WS events to `queryClient.invalidateQueries` instead of only notification-store | P1 |
| Add `DB_POOL_SIZE` env var to `database.module.ts` | P2 |
| Add `audit_log` table TTL / partition strategy | P2 |
| Backend does not return pagination metadata consistently across all endpoints | P2 |
| `StorageService` magic bytes validation only covers upload endpoint — add to S3/CDN callbacks | P2 |
| Replace `SimulatedAIPipelineAdapter` with `HttpAIPipelineAdapter` when Python service exists | P1 (when AI phase starts) |
| Implement `IQueueService.getDeadLetterEntries` in `QueueService` | P3 |
| Add `DB_POOL_SIZE` env var | P3 |
| Frontend Dockerfile | P2 (before staging deploy) |

---

## Test Maturity

| Layer | Tests | Coverage | Quality |
|---|---|---|---|
| Backend unit | 34/34 | ~40% | Smoke-test level — happy paths only |
| Frontend unit | 19/19 | ~35% | Form validation + API client tested |
| Integration | 0 | 0% | Requires Docker |
| E2E | 0 | 0% | Infra scaffolded; requires Docker |
| Test factories | ✅ | — | `backend/common/testing/factories.ts` + `frontend/tests/factories.ts` |

---

## Observability Gaps Closed

| Gap | Resolution |
|---|---|
| Frontend: no structured logger | `frontend/src/lib/logger.ts` — dev verbose + prod JSON + correlation IDs |
| Frontend: no metrics | `frontend/src/lib/metrics.ts` — API latency, WS reconnects, upload failures, render crashes |
| Backend: no correlation IDs | `CorrelationIdMiddleware` generates X-Request-ID on every request, propagated to response |
| Backend: no graceful shutdown | `enableShutdownHooks()` + `unhandledRejection` + `uncaughtException` handlers |

**Remaining:**
- Backend: no JSON structured log format (NestJS Logger still outputs plain text)
- Backend: no `/metrics` endpoint
- No distributed tracing (OTEL) — not in scope

---

## Readiness for AI Phase

| Prerequisite | Status |
|---|---|
| Stable `AIPipelineAdapter` interface | ✅ — `AI_PIPELINE_ADAPTER` token, `AIPipelineAdapter` interface |
| Typed request/response contracts | ✅ — `ai-pipeline.contracts.ts` |
| Retry/timeout policy defined | ✅ — `DEFAULT_PIPELINE_RETRY_POLICY` in contracts |
| Queue abstraction interface | ✅ — `IQueueService` |
| Failure codes defined | ✅ — `PipelineFailureCode` union |
| Frontend can display processing states | ✅ — `pipeline_status` field in garment response |
| Asset loading abstraction | ✅ — `lib/r3f/asset-loader.ts` |
| Python AI service | ❌ — Not started. Backend is fully ready to receive it |
| pgvector extension | ❌ — Needs migration when AI embeddings are needed |

**Verdict: Backend is AI-phase-ready. Swap `SimulatedAIPipelineAdapter` → `HttpAIPipelineAdapter` to activate.**

---

## Implementation Percentage (Post-Phase)

| Layer | % Complete |
|---|---|
| Backend | ~97% |
| Database | ~97% |
| Infrastructure | ~82% |
| Repository Intelligence | ~90% |
| Frontend | ~91% |
| Tests | ~57% (unit passing; e2e infra ready) |
| AI Service | 0% (contracts ready) |
| 3D / Rendering | ~20% (isolated module, contracts, perf guards) |
| **Overall** | **~62%** |
