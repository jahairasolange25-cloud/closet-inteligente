# Architecture Protection Rules

> **CORRECTION NOTICE (2026-05-25):**
> - Rule 1 says monorepo MUST have `frontend/`, `backend/`, `python/` — currently only `backend/` exists. This is a target, not a current reality.
> - Rule 4 says "Auth0 is the single source of truth" — **INCORRECT**. Actual auth is Supabase JWT (ADR-010).
> - Technology table lists "Backend ORM: Prisma 5.x" — **INCORRECT**. Actual: raw `pg` driver, no ORM (ADR-015).
> - Do not enforce Prisma-related rules — they do not apply to this codebase.
>
> See `PROJECT_REALITY_MATRIX.md` and `IMPLEMENTATION_STATUS.md` for the authoritative technology list.

## Non-Negotiable Architecture Rules

### 1. Monorepo Structure
The project MUST remain a monorepo with three top-level directories: `frontend/`, `backend/`, and `python/`. No agent may restructure the monorepo without an Architecture Decision Record (ADR) approved by the architecture board.

### 2. Three-Layer Architecture
The system MUST maintain strict three-layer separation:
- **Frontend Layer** (`frontend/`): Next.js + React + TypeScript
- **Backend Layer** (`backend/`): NestJS + Node.js + PostgreSQL
- **AI Layer** (`python/`): Python + PyTorch + OpenCV + Mediapipe

Data flow MUST always be: Frontend -> Backend -> AI (and reverse). No direct frontend-to-AI calls permitted.

### 3. Communication Protocol
- Frontend communicates with Backend exclusively via REST API (HTTP/HTTPS) and WebSocket (Socket.IO).
- Backend communicates with AI Layer exclusively via internal HTTP API (gRPC reserved for future performance optimization only).
- No other communication protocols may be introduced without an ADR.

### 4. Authentication & Authorization
- All API endpoints MUST pass through NestJS Guards.
- Auth0 integration is the single source of truth for authentication.
- No agent may introduce a second authentication provider.

### 5. State Management
- Zustand is the ONLY state management library permitted.
- No agent may introduce Redux, MobX, Recoil, Jotai, or any other state management library.
- Server state MUST be managed via TanStack Query, never Zustand.

---

## Technology Lock-In Rules

### Permitted Technologies (NO SUBSTITUTIONS)

| Layer | Technology | Version Constraint |
|-------|-----------|-------------------|
| Frontend Framework | Next.js | 14.x or later |
| Frontend UI | React | 18.x or later |
| Frontend Language | TypeScript | 5.x or later |
| Frontend Styling | Tailwind CSS | 3.x or later |
| Frontend State | Zustand | 4.x or later |
| Frontend Server State | TanStack Query | 5.x or later |
| Frontend 3D | React Three Fiber | 8.x or later |
| Frontend 3D Engine | Three.js | 0.160.x or later |
| Backend Framework | NestJS | 10.x or later |
| Backend Runtime | Node.js | 20.x LTS |
| Backend Database | PostgreSQL | 16.x |
| Backend ORM | Prisma | 5.x or later |
| Backend Cache | Redis | 7.x |
| Backend Real-time | Socket.IO | 4.x or later |
| AI Language | Python | 3.12.x |
| AI Deep Learning | PyTorch | 2.x or later |
| AI Computer Vision | OpenCV | 4.9.x or later |
| AI Pose Estimation | Mediapipe | 0.10.x or later |
| AI NLP | Hugging Face Transformers | 4.x or later |
| AI Object Detection | Detectron2 | 0.6 or later |

### Prohibited Technologies
The following technologies are explicitly FORBIDDEN:
- **Vue.js** (any version) — frontend lock-in violation
- **Django** — backend framework lock-in violation
- **Redux** — state management lock-in violation
- **Sequelize** — ORM lock-in violation
- **TensorFlow** — AI framework lock-in violation
- **Unity WebGL** — 3D rendering lock-in violation
- **Prisma** replacement tools (TypeORM, Drizzle, Knex) — ORM lock-in violation
- **Express.js** (standalone) — NestJS is the only permitted HTTP framework
- **Fastify** — NestJS is the only permitted HTTP framework
- **Flask** — backend framework lock-in violation
- **MongoDB** — database lock-in violation
- **MySQL** — database lock-in violation

### Technology Upgrade Rules
1. Major version upgrades require an ADR.
2. Minor version upgrades are permitted but must be tested across all environments.
3. Patch version upgrades are automatically permitted.
4. Any technology replacement requires unanimous architecture board approval.

---

## File Structure Preservation Rules

### Mandatory Directory Structure

```
closet-inteligente-digital/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   ├── components/          # React components
│   │   │   ├── ui/              # Generic UI primitives
│   │   │   ├── wardrobe/        # Wardrobe-specific components
│   │   │   ├── outfit/          # Outfit-related components
│   │   │   ├── tryon/           # Virtual try-on components
│   │   │   ├── profile/         # Profile components
│   │   │   └── 3d/              # Three.js/React Three Fiber components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── stores/              # Zustand stores
│   │   ├── services/            # API service layer
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions
│   │   └── styles/              # Global styles
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── next.config.js
├── backend/
│   ├── src/
│   │   ├── modules/             # NestJS feature modules
│   │   ├── common/              # Shared utilities, guards, filters
│   │   ├── config/              # Configuration
│   │   ├── database/            # Prisma schema, migrations
│   │   └── main.ts              # Entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── test/
│   ├── tsconfig.json
│   └── package.json
├── python/
│   ├── models/                  # Trained model storage
│   ├── pipelines/               # AI processing pipelines
│   ├── services/                # FastAPI service endpoints
│   ├── tests/
│   ├── requirements.txt
│   └── setup.py
├── docker/
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   ├── python.Dockerfile
│   └── docker-compose.yml
├── project-memory/
│   ├── adr/                     # Architecture Decision Records
│   ├── core/                    # Core documentation
│   ├── agent-control/           # THIS DIRECTORY (agent governance)
│   ├── tasks/                   # Task tracking
│   └── decisions/               # Historical decisions
├── .github/
│   └── workflows/               # CI/CD pipelines
├── vercel.json
├── railway.toml
├── package.json                 # Root workspace config
└── README.md
```

### File Structure Modification Rules
1. No agent may delete any top-level directory.
2. No agent may rename any top-level directory.
3. New subdirectories may be created only if they follow the naming convention: `kebab-case`.
4. New directories must be documented in this file within 24 hours.
5. Custom directory structures outside the mandated layout require an ADR.

---

## API Contract Immutability Rules

### REST API Contracts
1. Once an API endpoint is deployed to production, its contract (path, method, request body shape, response body shape) is IMMUTABLE for the current major version.
2. Breaking changes require:
   - A new endpoint version (e.g., `/api/v2/resource` instead of `/api/v1/resource`)
   - Deprecation notice on the old endpoint for at least 2 release cycles
   - ADR documenting the versioning decision
3. Adding new fields to responses is permitted (backward-compatible expansion).
4. Removing fields from responses is FORBIDDEN.
5. Changing field types is FORBIDDEN.
6. Adding optional fields to request bodies is permitted.
7. Making optional fields required is FORBIDDEN.

### WebSocket Event Contracts
1. Event names must follow the pattern: `namespace:event:action` (e.g., `wardrobe:item:created`).
2. Once a WebSocket event is documented in `backend/src/common/websocket/events.md`, its payload shape is IMMUTABLE.
3. New fields may be appended to event payloads, but existing fields may not be modified or removed.
4. Event deprecation follows the same 2-cycle rule as REST API endpoints.

### Internal API Contracts (Backend <-> AI)
1. AI service endpoints are versioned via URL path (e.g., `/api/v1/predict`).
2. Input/output schemas for AI endpoints are defined in `python/services/schemas/` and are immutable per version.
3. Backend agents may not bypass AI service schemas by calling AI internals directly.

---

## Database Schema Protection Rules

### Prisma Schema Rules
1. The Prisma schema (`backend/prisma/schema.prisma`) is the single source of truth for the database schema.
2. Every database change MUST go through a Prisma migration.
3. Raw SQL may not be used to modify schema outside Prisma migrations.
4. Schema changes must be reviewed by at least one backend specialist.

### Migration Rules
1. Every migration must be reversible (have a `down` counterpart or be logically reversible).
2. Migrations must be named descriptively: `YYYYMMDD_HHMMSS_description_of_change`.
3. Data migrations (transforming existing data) must be in a separate migration from schema migrations.
4. Migrations must be tested against a staging database before production.
5. Rolling back a migration must not cause data loss.
6. Irreversible migrations (e.g., column removal without backup) are FORBIDDEN.

### Schema Change Constraints
1. Columns may be added but must have defaults or be nullable (to avoid downtime).
2. Columns may NOT be dropped without a 2-phase process: (a) mark as deprecated, (b) remove after 2 releases.
3. Table renaming requires an ADR.
4. Changing column types is FORBIDDEN; create a new column and migrate data instead.
5. Foreign key constraints may not be removed without ADR approval.

---

## Module Boundary Rules

### Frontend Module Boundaries
```
┌─────────────────────────────────────────────┐
│                 pages/ (app/)               │
│           (composition layer only)           │
├─────────────────────────────────────────────┤
│              components/                     │
│         (UI rendering, NO business logic)     │
├─────────────────────────────────────────────┤
│                hooks/                        │
│        (stateful logic, side effects)         │
├─────────────────────────────────────────────┤
│               stores/                        │
│          (global state management)            │
├─────────────────────────────────────────────┤
│              services/                       │
│         (API communication only)              │
├─────────────────────────────────────────────┤
│               types/                         │
│          (TypeScript definitions)             │
└─────────────────────────────────────────────┘
```

**Boundary Rules:**
- `pages/` may import from `components/`, `hooks/`, `stores/`, `services/`, `types/`
- `components/` may import from `hooks/`, `stores/`, `types/`, `utils/`
- `components/` may NOT import from `services/` directly (use hooks)
- `hooks/` may import from `services/`, `stores/`, `types/`, `utils/`
- `stores/` may import from `types/`, `utils/` only (NO service calls in stores)
- `services/` may import from `types/` only
- Circular dependencies are FORBIDDEN

### Backend Module Boundaries
```
┌─────────────────────────────────────────────┐
│             modules/ (NestJS)                │
│     ┌─────────────────────────────────┐      │
│     │  controllers/ (routing only)    │      │
│     ├─────────────────────────────────┤      │
│     │  services/ (business logic)     │      │
│     ├─────────────────────────────────┤      │
│     │  repositories/ (data access)    │      │
│     ├─────────────────────────────────┤      │
│     │  guards/ (auth checks)         │      │
│     ├─────────────────────────────────┤      │
│     │  dto/ (data transfer objects)  │      │
│     └─────────────────────────────────┘      │
├─────────────────────────────────────────────┤
│              common/                         │
├─────────────────────────────────────────────┤
│              config/                         │
└─────────────────────────────────────────────┘
```

**Boundary Rules:**
- `controllers/` may only call `services/` and use `dto/`, `guards/`
- `controllers/` may NOT contain business logic
- `services/` may call `repositories/` and other services
- `services/` may NOT import from `controllers/`
- `repositories/` may only access database (Prisma)
- Cross-module imports within `modules/` must go through service interfaces

---

## Dependency Direction Rules

### Strict Dependency Flow

```
FRONTEND (Next.js/React)
    │
    ▼ (REST/WebSocket)
BACKEND (NestJS/Node.js)
    │
    ▼ (Internal HTTP API)
AI LAYER (Python/PyTorch)
```

### Violations (FORBIDDEN)
- ❌ Frontend calling AI layer directly
- ❌ Backend importing frontend code
- ❌ AI layer calling frontend endpoints
- ❌ AI layer directly accessing the database
- ❌ Frontend directly accessing the database (bypassing backend)

### Allowed Exceptions
- Development tooling may cross layers (e.g., linting configs)
- Shared TypeScript types may be duplicated (never shared at runtime)
- CI/CD configurations may reference any layer

---

## Service Layer Abstraction Rules

### Frontend Service Layer
1. Every external API call MUST go through `frontend/src/services/`.
2. Service functions must return typed responses.
3. Service functions must handle errors (catch and transform into application errors).
4. Service functions may not contain UI logic.
5. Service functions must use TanStack Query for caching where applicable.

### Backend Service Layer
1. Every controller method MUST delegate to a service.
2. Services must be injectable (NestJS `@Injectable()`).
3. Services must use DTOs for input validation.
4. Services must not access HTTP request/response objects directly.
5. Services must throw typed exceptions (defined in `common/exceptions/`).

### AI Service Layer
1. Every AI endpoint must have a corresponding service file in `python/services/`.
2. AI services must validate inputs before processing.
3. AI services must log inference metadata (model version, confidence, processing time).
4. AI services must not store results directly (return to backend for persistence).

---

## What Cannot Be Changed Without ADR

1. **Architecture pattern** (monorepo, three-layer, etc.)
2. **Technology stack** (any framework, library, or tool replacement)
3. **Database technology** (PostgreSQL replacement)
4. **Authentication provider** (Auth0 replacement)
5. **API versioning strategy**
6. **State management approach**
7. **Build system** (Next.js build, NestJS build, etc.)
8. **Deployment platform** (Vercel, Railway)
9. **Testing framework** (Jest, pytest replacement)
10. **CI/CD pipeline structure**
11. **Monorepo tooling** (workspace configuration)
12. **File structure** (top-level directory changes)
13. **Communication protocols** (REST, WebSocket replacement)
14. **3D rendering engine** (Three.js replacement)
15. **Architecture Protection Rules document** (THIS document)

---

## Consequences of Violating Architecture Rules

### Severity Levels

| Level | Consequence | Examples |
|-------|------------|----------|
| **CRITICAL** | Immediate revert + ADR required + agent retraining | Changing tech stack, deleting directories, bypassing auth |
| **HIGH** | Revert required + code review + documentation update | Adding new library without approval, modifying API contracts |
| **MEDIUM** | Fix required within 1 sprint + documentation update | Service layer violation, module boundary crossing |
| **LOW** | Fix required within 2 sprints + documentation update | Naming convention violation, minor import rule violation |

### Escalation Path
1. CI/CD pipeline detects violation → blocks merge
2. Code review detects violation → blocks approval
3. Automated test detects violation → marks as failed
4. Manual audit detects violation → creates corrective task

### Repeat Violations
- 1st violation: Warning + documentation review
- 2nd violation: Mandatory architecture training
- 3rd violation: Agent access restrictions imposed
- 4th violation: Agent removed from project

---

## Architecture Review Trigger Conditions

An architecture review is AUTOMATICALLY triggered when:

1. **Any CRITICAL severity violation** is detected.
2. **Code coverage drops below 75%** for any module.
3. **Bundle size increases by more than 20%** in a single PR.
4. **API response time increases by more than 30%** for any endpoint.
5. **A new external dependency** is proposed.
6. **The database schema requires a backward-incompatible change.**
7. **A major version upgrade** of any core technology is proposed.
8. **A security vulnerability** is found in the dependency tree.
9. **The team size doubles** (architecture scalability review).
10. **A component exceeds 500 lines** of code.
11. **A module exceeds 10 files** without a subdirectory restructure.
12. **Any ADR is proposed** that contradicts a previous ADR.
13. **The project has been inactive for 30+ days** (architecture freshness review).
14. **A pull request modifies more than 20 files** in a single change.
15. **Any agent attempts to modify this document** without explicit approval.

Review must be completed within 5 business days and results documented in `project-memory/decisions/`.
