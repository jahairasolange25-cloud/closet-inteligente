# Context Loading Rules — Closet Inteligente Digital

> **Last Updated:** 2026-05-25
> **Purpose:** Tell agents exactly which files to read for each task type.
> **Goal:** Minimize token waste. Never read the full project-memory.

---

## RULE 1: Always Load First

Before any task, load these three files (in order):

1. `project-memory/PROJECT_REALITY_MATRIX.md` — what exists vs. what is claimed
2. `project-memory/IMPLEMENTATION_STATUS.md` — % complete per module
3. `project-memory/STUB_REGISTRY.md` — which systems are stubs

Stop reading other project-memory files until you know the reality.

---

## RULE 2: Task-Specific Loading

### Backend Task

Load additionally:
- `project-memory/engineering/backend/modules.md`
- `project-memory/engineering/backend/api-contracts.md`
- `project-memory/engineering/backend/database-schema.md`
- Relevant ADR from `project-memory/decisions/`

Do NOT load:
- `project-memory/engineering/frontend/`
- `project-memory/engineering/ai/`
- `project-memory/engineering/rendering/`
- `project-memory/ui-ux/`

### Database / Migration Task

Load additionally:
- `project-memory/engineering/backend/database-schema.md`
- `project-memory/decisions/ADR-003-database.md`
- Verify actual migration files: `backend/src/database/migrations/`

Do NOT assume the claimed 35 migrations exist — check the filesystem.

### Frontend Task (Phase 2+)

Load additionally:
- `project-memory/engineering/frontend/component-tree.md`
- `project-memory/engineering/frontend/routes.md`
- `project-memory/engineering/frontend/state-management.md`
- `project-memory/decisions/ADR-001-frontend-framework.md`
- `project-memory/decisions/ADR-008-state-management.md`

NOTE: Frontend does not exist yet. These docs describe the PLAN, not reality.

### AI / CV Task (Phase 3+)

Load additionally:
- `project-memory/engineering/ai/garment-pipeline.md`
- `project-memory/engineering/ai/recommendation-engine.md`
- `project-memory/decisions/ADR-006-ai-framework.md`
- `project-memory/STUB_REGISTRY.md` (STUB-001 through STUB-005)

NOTE: AI service does not exist. All AI docs are PLANNED specs, not implementations.

### Infrastructure / DevOps Task

Load additionally:
- `project-memory/engineering/infrastructure/docker.md`
- `project-memory/engineering/infrastructure/ci-cd.md`
- `project-memory/decisions/ADR-013-deployment.md`
- `project-memory/decisions/ADR-014-containerization.md`

### Testing Task

Load additionally:
- `project-memory/testing/testing-strategy.md`

NOTE: Zero tests exist. All testing docs are PLANNED specs.

### Stub Replacement Task

Load:
- `project-memory/STUB_REGISTRY.md` — find the specific stub
- The source file containing the stub (listed in STUB_REGISTRY)
- Relevant engineering spec for the real implementation

---

## RULE 3: Do NOT Read These Files for Any Task

These files describe systems that do not exist or contain obsolete/contradicted information:

| File | Reason to Skip |
|---|---|
| `project-memory/archived-specs/` | Archived — obsolete |
| `project-memory/ROADMAP.md` (old phases) | Superseded by reality-based roadmap |
| `project-memory/engineering/rendering/` | 3D system does not exist |
| `project-memory/ui-ux/` | Frontend does not exist |
| `project-memory/operations/monitoring.md` | No monitoring system deployed |
| `project-memory/operations/logging.md` | No centralized logging deployed |

---

## RULE 4: Memory vs. Reality

If a project-memory file says a feature is "DONE" but the code shows a stub or missing file:
- **The code is the ground truth**
- Update `PROJECT_REALITY_MATRIX.md` and `IMPLEMENTATION_STATUS.md`
- Do NOT implement based on the memory claim

---

## RULE 5: Agents Must Not Read Full project-memory

Reading all project-memory files on session start wastes ~50K tokens.
Maximum context load at session start: 3 files (RULE 1 above).
Load additional files only when the task requires them.
