# CodeGraph Audit — Closet Inteligente Digital

> Generated: 2026-05-27 | Phase: Repository Intelligence / CodeGraph-First AI Workspace
> Index: 207 files, 1920 nodes, 3316 edges, 3.56 MB

---

## 1. File Size Analysis

No file exceeds 700 LOC. **A-002 mandatory refactoring has zero hard targets.**

| File | LOC | Notes |
|---|---|---|
| `backend/src/outfits/outfits.service.ts` | 491 | Largest. `recommendOutfits` heuristic is ~130 LOC — isolatable when ML lands |
| `frontend/src/features/avatar/avatar-page.tsx` | 370 | Mixed: form + upload + 3D canvas. Acceptable until real rendering exists |
| `backend/src/garments/garments.service.ts` | 341 | Well-scoped CRUD + search |
| `frontend/src/features/garments/garment-detail-page.tsx` | 302 | Image upload + inline edit mixed — manageable |
| `backend/src/websocket/websocket.gateway.ts` | 276 | Single-responsibility Socket.IO gateway — OK |
| `backend/src/analytics/analytics.service.ts` | 248 | Analytics aggregation — OK |

**Finding:** Codebase is well-sized. No structural bloat. Focus on quality, not reduction.

---

## 2. Module Boundary Quality

### Backend (NestJS)

| Module | Boundary Quality | Issues |
|---|---|---|
| `auth` | GOOD | Clean: JWT, guards, DTO validation all scoped |
| `garments` | GOOD | CRUD + search in service, clear DTO separation |
| `outfits` | GOOD | `UPPER_BODY_TYPES`/`LOWER_BODY_TYPES` constants co-located — OK |
| `pipeline` | WEAK | `SimulatedAIPipelineAdapter` instantiated with `new` at line 37 — bypasses DI, untestable |
| `queue` | GOOD | BullMQ wrapping clean; `connection()` creates new object per call (minor) |
| `analytics` | MODERATE | AI precision metric is mocked inline — should be a stub constant, not inline logic |
| `common` | GOOD | Guards/filters/interceptors/pipes all properly scoped |
| `users` | THIN | Only `findById` — acceptable for current scope |

### Frontend (Next.js)

| Area | Boundary Quality | Issues |
|---|---|---|
| `stores/` | WEAK | `garment-store.ts` duplicates server state that React Query in `use-garments.ts` also manages — dual-cache anti-pattern |
| `hooks/` | GOOD | React Query with optimistic updates properly implemented |
| `services/` | GOOD | Clean API abstraction layer |
| `features/` | GOOD | Feature-colocated pages/components, no cross-feature imports observed |
| `lib/r3f/` | PARTIAL | `canvas-wrapper.tsx` has no ErrorBoundary — WebGL crash propagates up |
| `providers/` | GOOD | Clean provider composition |

---

## 3. Circular Import Analysis

CodeGraph edge scan found **no circular import cycles** in either frontend or backend source code.

---

## 4. Naming Quality

| Issue | Location | Severity |
|---|---|---|
| `garment-store.ts` named identically to React Query key pattern — confusing when both used | `stores/garment-store.ts` + `hooks/use-garments.ts` | MEDIUM |
| `toGarmentResponse` is a module-level function, not a class method — inconsistent with rest of service | `garments.service.ts:72` | LOW |
| `EGarmentType`/`EGarmentState` — `E` prefix removed (good fix already applied) | garment enums | RESOLVED |
| `SimulatedAIPipelineAdapter` — good name; clearly marked as stub | `ai-pipeline.adapter.ts` | OK |

---

## 5. Duplicated Hooks / Services / State

| Duplication | Location | Severity |
|---|---|---|
| **Server state in Zustand AND React Query** | `garment-store.ts` + `use-garments.ts` | HIGH — dual-cache; garment pages must choose one source of truth |
| Outfit server state also in Zustand AND React Query | `outfit-store.ts` + `use-outfits.ts` | HIGH — same problem |
| `extractError` + `normalizeApiError` — two error-normalisation paths | `lib/api.ts` | MEDIUM — `extractError` is backward-compat wrapper, acceptable short-term |
| `fetchMe` in `auth-store` + `restoreSession` — both call `authService.getMe()` | `auth-store.ts` | LOW — different lifecycle points, not truly duplicated |

---

## 6. React Query Issues

| Issue | Location | Fix Required |
|---|---|---|
| `useOutfit(id)` has no `staleTime` — refetches on every focus | `use-outfits.ts:19` | Add `staleTime: 2 * 60 * 1000` |
| List queries and detail queries share same key prefix `'outfits'` without scoping — `invalidateQueries` is broad | `use-outfits.ts:33` | Acceptable; known pattern |
| `garment-store.ts` re-fetches data already in React Query cache | `garment-store.ts` | Document: pages should use React Query hooks, not Zustand store for server data |
| No `onSuccess` invalidation after delete in `useDeleteGarment` | `use-garments.ts` | Verify; optimistic path handles it |

---

## 7. Zustand Store Issues

| Issue | Location | Severity |
|---|---|---|
| `garment-store` and `outfit-store` cache server data without revalidation strategy | Both stores | HIGH — creates stale state bugs |
| No `useShallow` selectors used anywhere | All stores | MEDIUM — unnecessary component rerenders |
| `auth-store` uses `sessionStorage` for persist (correct) but tokens stored in `localStorage` | `auth-store.ts:125` | ACCEPTABLE — tokens need cross-tab persistence; sessionStorage is for user object only |
| `avatar-store` has `GenerationStatus` enum-like state with no persistence | `avatar-store.ts` | OK — ephemeral state is correct |
| `notification-store` fetches AND stores notifications without React Query | `notification-store.ts` | MEDIUM — consistent with pattern but manual |

---

## 8. Import Alias Quality

### Frontend: GOOD
- `@/` alias maps to `./src/*` and is consistently used in all source files.
- No deep `../../` imports found in `frontend/src/`.
- All 9 path aliases defined and used: `@/components/*`, `@/features/*`, `@/stores/*`, `@/hooks/*`, `@/services/*`, `@/providers/*`, `@/types/*`, `@/lib/*`.

### Backend: PARTIAL
- `baseUrl: "./"` is set but no `paths` defined.
- `common/interceptors/audit-log.interceptor.ts` uses `../../database/database.module` and `../../redis/redis.service` — 2-level relative paths.
- `common/guards/rate-limit.guard.ts` and `jwt-auth.guard.ts` use `../../redis/redis.service`.
- **Fix:** Add `@app/*` → `src/*` path alias in `backend/tsconfig.json`.

---

## 9. Error Boundary Coverage

| Boundary | Exists | Applied | Gap |
|---|---|---|---|
| Generic `ErrorBoundary` component | YES | Partially (garments list, outfits list) | Not wrapping R3F canvas, not at route level |
| Route-level fallback | NO | — | Need `error.tsx` files in Next.js app routes |
| WebSocket crash isolation | NO | — | WS errors go to console only |
| R3F canvas crash isolation | NO | — | `canvas-wrapper.tsx` has no ErrorBoundary |
| Global React error boundary | NO | — | Need in root `layout.tsx` |

---

## 10. Backend Resilience Gaps

| Gap | Location | Severity |
|---|---|---|
| No `process.on('unhandledRejection')` handler | `main.ts` | HIGH |
| No `process.on('uncaughtException')` handler | `main.ts` | HIGH |
| No graceful shutdown (`enableShutdownHooks`) | `main.ts` | HIGH |
| No request correlation IDs | All routes | MEDIUM |
| No Redis reconnection logging | `redis.service.ts` | MEDIUM |
| `pipeline.service.ts` instantiates `SimulatedAIPipelineAdapter` with `new` (not injected) | `pipeline.service.ts:37` | HIGH — blocks testability |
| `QueueService.connection()` creates new options object per call (not cached) | `queue.service.ts:23` | LOW |
| No structured JSON log format | All modules | MEDIUM |

---

## 11. Observability Gaps

| Gap | Severity |
|---|---|
| Frontend: `console.error` only — no structured logger with correlation IDs | HIGH |
| Frontend: no performance marks for API latency | MEDIUM |
| Frontend: no WebSocket reconnect counter | MEDIUM |
| Backend: NestJS logger outputs plain text — no JSON for log aggregation | MEDIUM |
| Backend: no X-Request-ID header propagation | MEDIUM |
| Backend: no `/metrics` endpoint | LOW (not needed yet) |

---

## 12. Test Maturity

| Layer | Tests | Quality |
|---|---|---|
| Backend unit | 34/34 passing (4 spec files) | Low coverage — smoke tests only |
| Frontend unit | 19/19 passing (4 test files) | Low coverage — UI component tests |
| Integration | 0 | Requires Docker |
| E2E | 0 | Not started |
| Test factories | 0 | No reusable factories — every test bootstraps manually |

---

## 13. CodeGraph Traversal Quality

| Metric | Value | Notes |
|---|---|---|
| Indexed files | 207 | All source files indexed |
| Nodes (symbols) | 1920 | Good density |
| Edges (relationships) | 3316 | 1.7 edges/node — healthy |
| Circular imports | 0 | Clean dependency graph |
| Orphan files | ~5 | `health.controller.ts` not wired to module |
| Route nodes | 47 | All 17 frontend routes + 30 backend routes indexed |

**Recommendation:** CodeGraph is in good shape. Main improvements are semantic barrel exports to improve graph traversal and moving AI adapter to DI.

---

## 14. Priority Fix List

| Priority | Item | Task |
|---|---|---|
| P0 | Add `process.on('unhandledRejection'/'uncaughtException')` + graceful shutdown | B-004 |
| P0 | Inject `AIPipelineAdapter` via DI instead of `new` | E-002 |
| P1 | Route-level error boundaries + R3F ErrorBoundary | B-003 |
| P1 | Structured frontend logger | C-001 |
| P1 | Backend correlation ID middleware | C-002 |
| P1 | `useOutfit` missing `staleTime` | B-002 |
| P2 | Backend path aliases (`@app/*`) | A-004 |
| P2 | Barrel exports for CodeGraph traversal | A-003 |
| P2 | AI service typed contracts | E-001 |
| P2 | Queue abstraction interface | E-003 |
| P2 | Test factories | D-002 |
| P3 | Playwright infra | D-003 |
| P3 | R3F performance guards | F-003 |
| P3 | Memory deduplication | G-001 |
