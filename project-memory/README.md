# Closet Inteligente Digital — Project Memory System

> **REALITY CHECK (2026-05-25):** Backend modules exist. Frontend, AI service, and 3D pipeline do NOT exist.
> Pipeline and queue are stubs. Tests do not exist. Read `PROJECT_REALITY_MATRIX.md` first.

---

## Project Overview

**Closet Inteligente Digital** is a full-stack fashion technology platform that will enable users to digitize, manage, and interact with their wardrobe through 3D avatars, AI-powered recommendations, and intelligent outfit planning.

### Planned Capabilities (not all implemented)

| Capability | Implemented? |
|---|---|
| Digital Wardrobe API | YES (backend only — no frontend) |
| 3D Avatar Try-On | NO — planned |
| AI Recommendations | PARTIAL — heuristic stub, not ML |
| Smart Calendar | YES (backend only — no frontend) |
| Wardrobe Analytics | YES (backend only — no frontend) |
| Multi-Platform Sync | YES (WebSocket backend only) |

### Current Architecture (What Actually Exists)

```
┌─────────────────────────────────────┐
│       Backend (NestJS) — EXISTS     │
│  Auth / Garments / Outfits          │
│  Calendar / Notifications /          │
│  Analytics / Storage / WebSocket    │
│  Pipeline (STUBBED) / Queue (STUB)  │
├─────────────────────────────────────┤
│  PostgreSQL (via Docker Compose)    │
│  Redis (via Docker Compose)         │
│  Cloudinary (image storage)         │
└─────────────────────────────────────┘

NOT YET BUILT:
- Frontend (Next.js)
- AI Service (Python/FastAPI)
- 3D Pipeline (Blender/Three.js)
```

---

## Memory System — Quick Start for Agents

### Step 1: Always Load These First

```
project-memory/PROJECT_REALITY_MATRIX.md   ← what exists vs. what is claimed
project-memory/IMPLEMENTATION_STATUS.md    ← % complete per module
project-memory/STUB_REGISTRY.md            ← which systems are stubs
```

### Step 2: Load Task-Specific Files

See `CONTEXT_LOADING_RULES.md` for the exact files to load per task type.
Do NOT read the full project-memory directory.

---

## Directory Structure

```
project-memory/
├── README.md                    ← This file (overview + agent quick-start)
├── PROJECT_STATUS.md            ← Component status table (reality-based)
├── PROJECT_REALITY_MATRIX.md    ← Ground truth: implemented vs. missing vs. stubbed
├── IMPLEMENTATION_STATUS.md     ← Per-module completion percentages
├── STUB_REGISTRY.md             ← All stubs catalogued with replacement plan
├── ROADMAP.md                   ← Reality-based phased roadmap
├── CHANGELOG.md                 ← Versioned changelog
├── CONTRIBUTING.md              ← Contribution rules (agents + humans)
├── CONTEXT_LOADING_RULES.md     ← Which files to load for each task type
├── decisions/                   ← Architecture Decision Records
├── engineering/
│   ├── backend/                 ← IMPLEMENTED specs
│   ├── frontend/                ← PLANNED specs (frontend does not exist yet)
│   ├── ai/                      ← PLANNED specs (AI service does not exist yet)
│   ├── rendering/               ← PLANNED specs (3D does not exist yet)
│   ├── infrastructure/          ← Partially implemented
│   └── storage/                 ← IMPLEMENTED
├── tasks/                       ← 60 backend task files (see status notes)
├── testing/                     ← PLANNED specs (no tests exist)
├── ui-ux/                       ← PLANNED specs (frontend does not exist)
├── agent-control/               ← Agent rules and constraints
├── prompts/                     ← Reusable prompt templates
├── task-templates/              ← Task file templates
├── operations/                  ← PLANNED (no monitoring deployed yet)
└── archived-specs/              ← Obsolete or superseded specs
```

---

## Key Technical Facts (2026-05-25)

- Raw SQL (`pg`) with NestJS — no ORM (TypeORM was originally planned; see ADR-015)
- Redis for consent, rate limiting, audit log, cache, export metadata
- Socket.IO namespace `/ws` with JWT auth
- Cloudinary for image storage with signed URLs
- GitHub Actions CI: 5 jobs (lint, typecheck, test, build, docker-build) — test job has zero test files
- Docker Compose: postgres + redis + backend (no frontend, no AI service)
- 12 of 35 claimed migrations exist — see `PROJECT_REALITY_MATRIX.md` for gap analysis

---

## Conventions

### Status Values

| Status | Meaning |
|---|---|
| `NOT_STARTED` | Work has not begun |
| `IN_PROGRESS` | Active development underway |
| `STUBBED` | Code exists but is a placeholder/simulation |
| `REVIEW` | Implementation complete, awaiting review |
| `DONE` | Reviewed, tested, merged — requires passing tests |
| `BLOCKED` | Cannot proceed due to dependency or issue |
| `DEFERRED` | Deliberately postponed |

> `DONE` requires passing tests. A module with no tests is at most `IN_PROGRESS`.

### Commit Message Format

```
<type>(<scope>): <description>

<body referencing memory files if updated>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`, `perf`, `ci`, `build`
