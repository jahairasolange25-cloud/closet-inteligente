# Changelog — Closet Inteligente Digital

> **Format:** [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
> **Versioning:** [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Fixed (2026-05-27 — Functional Gap Closure Phase 2)

**Critical API Contract Mismatches Resolved:**
- Auth response: `buildAuthResponse` now returns `{ user, tokens: { accessToken, refreshToken } }` (was `{ user, access_token, refresh_token }`)
- `SafeUser`: fields renamed to camelCase (`name`, `avatar`, `createdAt`) matching frontend contract
- `RefreshDto`: field renamed `refresh_token` → `refreshToken`
- Garment DB schema: migration 000036 adds `is_favorite`, `pipeline_status`, `notes`, `tags`, `material` columns
- `UpdateGarmentDto`: added `isFavorite`, `notes`, `tags`, `material` with class-validator decorators
- `GarmentsService`: added `GarmentResponse` interface + `toGarmentResponse()` mapper; all service methods return camelCase

**Frontend Auth UX:**
- `restoreSession()` action with `isRestoring` flag prevents flash of unauthenticated content
- `BroadcastChannel` cross-tab logout sync via `lib/auth-broadcast.ts`
- `useSessionExpiration` hook: warns user 2 min before JWT expiry via toast
- Auth route guard preserves `?next=` destination for post-login redirect

**Frontend Reliability:**
- `normalizeApiError()` produces typed `NormalizedApiError` (code, status, retryable, fields)
- React Query `retryDelay` exponential backoff: `min(1000 * 2^attempt, 30000)`
- WebSocket reconnect now calls `refreshAccessToken()` before reconnecting; `disconnectSocket()` prevents auto-reconnect after logout
- Optimistic updates with rollback in `use-garments.ts` and `use-outfits.ts`
- `types/api/` directory: typed error codes and pagination types

**Frontend UX:**
- Garment detail inline edit mode (name, brand, size, color, notes)
- Garment detail shows tags (badges) and material (badges)
- Route-level `loading.tsx` at garments, garments/[id], outfits, calendar, analytics, notifications

### Fixed (2026-05-26 — API Runtime Validation Phase)

**DTO Field Mismatches (5 DTOs corrected):**
- `RegisterDto`: renamed `full_name` → `name`; added optional `acceptTerms`, `consentAI` fields to whitelist
- `AuthService`: updated `dto.full_name` → `dto.name` (DB column `full_name` unchanged)
- `CreateGarmentDto`: renamed `type` → `category` (DB column `type` unchanged)
- `QueryGarmentsDto`: renamed `type` → `category`
- `SearchGarmentsDto`: renamed `type` → `category`
- `GarmentsService`: updated all `dto.type`/`query.type` → `dto.category`/`query.category`
- `RecommendOutfitDto`: added `count` (int, 1–10) and `season` (string) to whitelist
- `ExportRequestDto`: added `include` field as alias for `sections`; expanded allowed sections
- `ExportService`: added `dto.include` as fallback for `dto.sections`

### Validated (2026-05-26 — API Runtime Validation Phase)

All backend APIs confirmed working end-to-end against running Docker stack:

| Endpoint Group | Status |
|---|---|
| `GET /health` | PASS (200) |
| Auth: register, login, refresh, me, logout | PASS — JWT, blacklist, token rotation all working |
| Auth failures: wrong password, dup email, invalid JWT | PASS — correct 401/409 codes |
| Garments CRUD: create, list, get, search, soft-delete | PASS — DB persistence, full-text search confirmed |
| Garments validation: deleted 404, cross-user 404 | PASS |
| Outfits CRUD: create, list, get | PASS |
| Outfits validation: upper/lower check, washing state check | PASS |
| `POST /outfits/recommend` (heuristic) | PASS |
| `GET /calendar` with date ranges, 31-day limit | PASS |
| `GET /notifications`, `GET /notifications/settings` | PASS |
| `GET /analytics/garments`, `/usage`, `/ai-precision` | PASS |
| `GET /consent`, `PATCH /consent` | PASS |
| `POST /export/data`, `GET /export/status/:id` | PASS |
| WebSocket `/ws` JWT connection + auth rejection | PASS |

**Remaining gaps (not runtime crashes — implementation gaps):**
- `GET /analytics/dashboard` — route not in controller (404)
- `POST /calendar` — no create endpoint (only GET + PATCH)
- `GET /calendar/range` — not implemented
- API field naming: some DTOs use snake_case, contract docs use camelCase (consistent within implementation, inconsistent with contract docs)

### Added (2026-05-25 — Project Memory Reconciliation)

- `PROJECT_REALITY_MATRIX.md` — ground truth for implemented vs. missing vs. stubbed systems
- `IMPLEMENTATION_STATUS.md` — per-module completion percentages derived from source audit
- `STUB_REGISTRY.md` — catalogue of STUB-001 through STUB-005 with replacement plans
- `CONTEXT_LOADING_RULES.md` — token-efficient context loading rules for agents
- `ROADMAP.md` — rebuilt from current reality (Phase 1–8, replacing old 18-week plan)
- `decisions/ADR-015-raw-pg-no-orm.md` — documents actual ORM decision (raw pg, not TypeORM)
- `tasks/TASKS_STATUS_CORRECTION.md` — global correction: "All tests pass" is false for all 60 tasks
- `archived-specs/` — directory for obsolete specs
- `engineering/frontend/STATUS_NOTICE.md` — warns agents frontend does not exist
- `engineering/ai/STATUS_NOTICE.md` — warns agents AI service does not exist
- `engineering/rendering/STATUS_NOTICE.md` — warns agents 3D rendering does not exist
- `ui-ux/STATUS_NOTICE.md` — warns agents UI specs are planned, not implemented

### Changed (2026-05-25 — Project Memory Reconciliation)

- `README.md` — removed false architecture diagram; added reality check; updated agent quick-start
- `PROJECT_STATUS.md` — reflects actual status: ~25% complete, stubs identified, tests missing
- `CONTRIBUTING.md` — added CRITICAL reconciliation rules section (stub handling, ADR policy, context loading)
- `agent-control/context-loading.md` — added correction notice for wrong paths (Prisma, python/, frontend/)

### Contradictions Resolved (2026-05-25)

- "35 migrations" → **12 exist**
- "INF-01 NOT_STARTED" → **docker-compose.yml exists**
- "INF-03 NOT_STARTED" → **backend/Dockerfile exists**
- "All 60 tasks DONE" → **pipeline and queue are stubs; zero tests exist**
- "No known issues" → **KI-01 through KI-08 identified**
- "ADR-001 = TypeORM" → **actual implementation uses raw pg (ADR-015)**

---

### Added (prior — 2026-05-25 backend implementation)

- Project initialization with turborepo monorepo structure
- Memory system documentation (README, PROJECT_STATUS, ROADMAP, CONTRIBUTING)
- Architecture Decision Records (ADR-001 through ADR-014)
- Root configuration files (.gitignore, .editorconfig, .prettierrc, .eslintrc)
- Backend modules: auth, garments, outfits, avatars, calendar, notifications, analytics, storage, export, consent, websocket, pipeline (stubbed), queue (stubbed), redis, supabase, database
- 12 database migration files
- docker-compose.yml (postgres, redis, backend)
- backend/Dockerfile + Dockerfile.dev
- .github/workflows/ci.yml (5 jobs)

---

## [0.1.0] — 2026-05-25

### Added

- **Project Memory System:** Initial creation of project-memory directory with root documentation files:
  - `README.md` — Project overview, memory system description, directory structure, conventions, quick start guide
  - `PROJECT_STATUS.md` — Current status (INITIALIZATION), 0% progress, complete component inventory (42 components, all NOT_STARTED), risk register (10 risks), milestone definitions
  - `ROADMAP.md` — Complete 18-week, 5-phase roadmap with 699 total estimated hours, per-week task breakdown, success criteria, risk mitigation strategies, dependency graph
  - `CHANGELOG.md` — This file, initial v0.1.0 entry
  - `CONTRIBUTING.md` — AI agent contribution guidelines, memory system update rules, PR standards, code review process

- **Architecture Decision Records (6 initial ADRs):**
  - ADR-001: Use NestJS with TypeORM for backend architecture
  - ADR-002: Use Zustand over Redux for frontend state management
  - ADR-003: Use Supabase for authentication and PostgreSQL hosting
  - ADR-004: Use React Three Fiber for 3D rendering in browser
  - ADR-005: Use Cloudinary for image hosting and transformations
  - ADR-006: Use Detectron2 for garment segmentation tasks

- **Root Configuration:**
  - `.gitignore` with Node, Python, Next.js, NestJS, and OS-specific entries
  - `.editorconfig` for consistent editor settings across the team
  - `.prettierrc` with project-wide formatting rules
  - `.eslintrc` base configuration for TypeScript
  - `commitlint.config.js` with conventional commit enforcement
  - `.husky/` pre-commit and commit-msg hooks

### Changed

- No changes (initial release)

### Deprecated

- Nothing deprecated (initial release)

### Removed

- Nothing removed (initial release)

### Fixed

- Nothing fixed (initial release)

### Security

- No security fixes (initial release)

---

## Version History Template

The following entries will be populated as development progresses:

```
## [0.2.0] — 2026-06-15

### Added
- Phase 1: Next.js project scaffolding with TypeScript and Tailwind CSS
- Phase 1: NestJS project scaffolding with modular structure
- Phase 1: FastAPI Python service scaffolding
- Phase 1: PostgreSQL schema design and initial migrations
- Phase 1: Docker Compose configuration for local development
- Phase 1: Supabase project configuration
- Phase 1: User authentication pages (login, register, password reset)
- Phase 1: Responsive layout system (header, sidebar, footer)
- Phase 1: Zustand store setup with auth, app, ui, and notification slices
- Phase 1: TanStack Query configuration with auth token injection
- Phase 1: NestJS validation pipes and DTOs
- Phase 1: Swagger/OpenAPI documentation setup
- Phase 1: Rate limiting with @nestjs/throttler
- Phase 1: Health check endpoints
- Phase 1: Dockerfiles for all three services (Next.js, NestJS, Python)
- Phase 1: Vercel frontend deployment
- Phase 1: Railway backend deployment
- Phase 1: GitHub Actions CI pipeline

### Changed
- Nothing changed

### Fixed
- Nothing fixed
```

```
## [0.3.0] — 2026-07-13

### Added
- Phase 2: Garment CRUD module with full REST API
- Phase 2: File upload module with Multer and Cloudinary SDK
- Phase 2: Image processing pipeline with Sharp
- Phase 2: Cloudinary account and upload preset configuration
- Phase 2: Garment segmentation endpoint with Detectron2
- Phase 2: Garment attribute extraction (color, type, pattern)
- Phase 2: Measurement estimation from images
- Phase 2: Multi-step garment upload wizard
- Phase 2: Wardrobe grid and list views
- Phase 2: Garment detail page with CV results
- Phase 2: CV pipeline integration into upload flow
- Phase 2: Color palette analyzer
- Phase 2: Outfit CRUD module with many-to-many garment relationship
- Phase 2: Outfit scheduling in calendar events
- Phase 2: Outfit builder with drag-and-drop
- Phase 2: Calendar/weekly planner view
- Phase 2: Cloudinary webhook receiver
- Phase 2: Garment search and filtering
- Phase 2: Batch upload support

### Fixed
- Nothing fixed
```

```
## [0.4.0] — 2026-08-08

### Added
- Phase 3: Ready Player Me avatar integration
- Phase 3: Three.js scene with HDR environment and PBR lighting
- Phase 3: React Three Fiber avatar viewer
- Phase 3: Avatar customization panel (skin, body, hair)
- Phase 3: Avatar idle animation (breathing cycle)
- Phase 3: Blender Python script for garment mesh generation
- Phase 3: UV texture mapping from garment photos
- Phase 3: Blender add-on for batch processing
- Phase 3: Automated Blender pipeline integration
- Phase 3: LOD variant generation
- Phase 3: Garment physics simulation parameters
- Phase 3: React Three Fiber garment viewer
- Phase 3: Combined try-on view (avatar + garment)
- Phase 3: Garment attachment points on avatar
- Phase 3: Garment layering logic
- Phase 3: Material property overrides
- Phase 3: WebGL performance optimizations
- Phase 3: Mobile-performance 3D viewer
- Phase 3: 2D garment sprite fallback

### Fixed
- Nothing fixed
```

```
## [0.5.0] — 2026-09-05

### Added
- Phase 4: Style embedding generation with CLIP (512-dim vectors)
- Phase 4: Outfit compatibility scorer
- Phase 4: pgvector extension setup for embedding storage
- Phase 4: Redis caching layer for AI results
- Phase 4: Training data pipeline for embeddings
- Phase 4: Weather-based suggestion engine
- Phase 4: Occasion-based outfit generation
- Phase 4: Wardrobe gap analysis
- Phase 4: "What to wear today" feature
- Phase 4: AI recommendations panel component
- Phase 4: Swipeable outfit cards
- Phase 4: Push notification module with Firebase Cloud Messaging
- Phase 4: Weather alert notifications
- Phase 4: Outfit reminder notifications
- Phase 4: Wear frequency tracking and nudges
- Phase 4: Wear frequency predictor model
- Phase 4: Notification preferences in settings
- Phase 4: ONNX model export and containerization
- Phase 4: A/B testing framework for recommendations
- Phase 4: User feedback loop (thumbs up/down)
- Phase 4: Final responsive mobile layout

### Fixed
- Nothing fixed
```

```
## [1.0.0-beta.1] — 2026-09-26

### Added
- Phase 5: Analytics module (wear count, cost-per-wear, seasonal distribution)
- Phase 5: Analytics dashboard with Recharts
- Phase 5: Color palette visualization
- Phase 5: Wardrobe value tracker
- Phase 5: Seasonal wardrobe composition charts
- Phase 5: Data export (CSV/JSON)
- Phase 5: Socket.IO gateway with Redis adapter
- Phase 5: Real-time wardrobe sync across sessions
- Phase 5: Optimistic UI updates with TanStack Query
- Phase 5: Complete GitHub Actions CI pipeline
- Phase 5: Complete GitHub Actions CD pipeline
- Phase 5: Sentry error tracking integration
- Phase 5: Log aggregation setup
- Phase 5: Database backup strategy
- Phase 5: Load testing and performance optimization
- Phase 5: Security audit and remediation
- Phase 5: Beta onboarding wizard
- Phase 5: Onboarding tooltips and walkthrough
- Phase 5: User documentation (help center)
- Phase 5: Terms of Service and Privacy Policy pages
- Phase 5: Final E2E test pass
- Phase 5: SEO optimization
- Phase 5: Production smoke tests
- Phase 5: Beta launch communication materials

### Changed
- All Phase 1-4 components finalized and tested

### Fixed
- All known issues resolved before beta

### Security
- Security audit passed with zero critical/high findings
```

---

## How to Add a Changelog Entry

When making changes, add a new entry under `[Unreleased]` following this format:

```markdown
### Added | Changed | Deprecated | Removed | Fixed | Security

- Brief description of the change with component reference in parentheses (#123 if related to issue)
- If updating memory files, note which files were updated
```

When releasing, rename `[Unreleased]` to the new version number and date, then create a fresh `[Unreleased]` section.
