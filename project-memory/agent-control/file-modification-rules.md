# File Modification Rules

## Agent Type Definitions

This project recognizes four types of AI agents, each with specific file modification boundaries:

| Agent Type | Identifier | Primary Responsibility |
|------------|-----------|----------------------|
| **Frontend Agent** | `agent:frontend` | Next.js/React UI, components, styling, 3D rendering |
| **Backend Agent** | `agent:backend` | NestJS API, database (Prisma), WebSocket, Redis |
| **AI Agent** | `agent:ai` | Python ML pipelines, model training, inference |
| **Infrastructure Agent** | `agent:infra` | Docker, CI/CD, deployment, configuration |

---

## Frontend Agent — Allowed Files

Frontend agents may modify files within the following directories:

### Allowed Directories
```
frontend/
├── public/                    # Static assets, images, fonts
│   └── *                      # Any file
├── src/
│   ├── app/                   # Next.js App Router (pages, layouts, loading, error)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── (routes)/          # Page directories
│   ├── components/            # React components
│   │   ├── ui/                # Primitive UI components
│   │   ├── wardrobe/           # Wardrobe features
│   │   ├── outfit/            # Outfit building
│   │   ├── tryon/             # Virtual try-on
│   │   ├── profile/           # User profile
│   │   ├── 3d/                # Three.js/R3F components
│   │   └── layout/            # Layout components (Header, Footer, etc.)
│   ├── hooks/                 # Custom React hooks
│   │   └── *.ts / *.tsx
│   ├── stores/                # Zustand state stores
│   │   └── *.ts
│   ├── services/              # API service layer
│   │   └── *.ts
│   ├── types/                 # TypeScript type definitions
│   │   └── *.ts
│   ├── utils/                 # Utility functions
│   │   └── *.ts
│   └── styles/                # Global CSS and Tailwind config
│       └── *.css / *.ts
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js / .mjs / .ts
├── package.json
└── .env.local                 # Environment variables (without secrets)
```

### Prohibited Directories (Frontend Agent)
- `backend/` (any file)
- `python/` (any file)
- `docker/` (any file)
- `project-memory/agent-control/` (read-only)
- `project-memory/adr/` (read-only except for creating new ADRs)
- `.github/workflows/` (read-only)

---

## Backend Agent — Allowed Files

Backend agents may modify files within the following directories:

### Allowed Directories
```
backend/
├── src/
│   ├── modules/               # NestJS feature modules
│   │   └── */*               # controllers, services, repositories, guards, dto
│   ├── common/                # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── exceptions/
│   │   └── websocket/         # WebSocket event definitions
│   ├── config/                # Configuration files
│   │   └── *.ts
│   └── main.ts                # Entry point
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
│       └── */                 # Migration directories
├── test/                      # Test files
│   └── *.spec.ts / *.e2e-spec.ts
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── package.json
└── .env                       # Environment variables
```

### Prohibited Directories (Backend Agent)
- `frontend/` (any file)
- `python/` (any file)
- `docker/` (any file)
- `project-memory/agent-control/` (read-only)
- `project-memory/adr/` (read-only except for creating new ADRs)
- `.github/workflows/` (read-only)

---

## AI Agent — Allowed Files

AI agents may modify files within the following directories:

### Allowed Directories
```
python/
├── models/                    # Trained models (weights, checkpoints)
│   └── *                      # .pt, .pkl, .onnx, config files
├── pipelines/                 # AI processing pipelines
│   └── *.py                  # Pipeline implementations
├── services/                  # FastAPI service endpoints
│   ├── __init__.py
│   ├── main.py               # FastAPI app entry point
│   ├── schemas/               # Input/output schemas
│   │   └── *.py
│   └── routers/               # API route handlers
│       └── *.py
├── utils/                     # Python utility functions
│   └── *.py
├── tests/                     # Python test files
│   └── *.py
├── notebooks/                 # Jupyter notebooks (exploration only)
│   └── *.ipynb
├── requirements.txt
├── setup.py
├── setup.cfg
├── pyproject.toml
└── Dockerfile                 # AI-specific Dockerfile (if separate)
```

### Prohibited Directories (AI Agent)
- `frontend/` (any file)
- `backend/` (any file)
- `docker/` (any file except `python/` subdirectory)
- `project-memory/agent-control/` (read-only)
- `project-memory/adr/` (read-only except for creating new ADRs)
- `.github/workflows/` (read-only)

---

## Infrastructure Agent — Allowed Files

Infrastructure agents may modify files within the following directories:

### Allowed Directories
```
docker/
├── frontend.Dockerfile
├── backend.Dockerfile
├── python.Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── .dockerignore

.github/
└── workflows/
    ├── ci.yml
    ├── cd.yml
    ├── deploy-frontend.yml
    ├── deploy-backend.yml
    ├── deploy-ai.yml
    └── test.yml

Root files:
├── vercel.json
├── railway.toml
├── .gitignore
├── .prettierrc
├── .eslintrc.js / .eslintrc.json
├── .nvmrc
├── .node-version
└── package.json               # Root workspace config (workspace dependencies only)
```

### Prohibited Directories (Infrastructure Agent)
- `frontend/src/` (any file)
- `backend/src/` (any file)
- `python/pipelines/` (any file)
- `python/models/` (any file)
- `project-memory/agent-control/` (read-only)
- `project-memory/adr/` (read-only)

---

## Cross-Boundary Modification Rules

### When Cross-Boundary Modification Is Necessary

Cross-boundary modifications (e.g., frontend agent modifying a backend file) are only permitted when:

1. **The change is trivial and well-understood** (e.g., adding a field to a type definition that mirrors a database column).
2. **The change is blocking progress** and the responsible agent type is unavailable.
3. **The change is an emergency fix** (production outage).

### Cross-Boundary Modification Process

1. **Document the need**: Create a brief note in the commit message and/or PR description explaining why cross-boundary access is needed.
2. **Keep changes minimal**: Only modify the minimum files necessary across the boundary.
3. **Request review**: The PR must be reviewed by an agent of the target type.
4. **Revert if possible**: After the change, create a task to properly implement the change by the correct agent type.

### Examples of Acceptable Cross-Boundary Modifications

- A backend agent adding a new TypeScript type in `frontend/src/types/` that mirrors a new database entity.
- A frontend agent adding a new environment variable to `.env.example`.
- An infrastructure agent adding a health check endpoint to `backend/src/main.ts` for monitoring.

### Examples of Unacceptable Cross-Boundary Modifications

- A frontend agent modifying a Prisma migration.
- A backend agent creating a new React component.
- An AI agent modifying a NestJS service.
- An infrastructure agent modifying AI pipeline logic.

---

## Read-Only Files

The following files are READ-ONLY for ALL agent types. They may only be modified via explicit ADR approval.

```
project-memory/
├── agent-control/              # THIS ENTIRE DIRECTORY
│   ├── architecture-protection-rules.md
│   ├── forbidden-actions.md
│   ├── file-modification-rules.md
│   ├── context-loading.md
│   ├── workflows.md
│   ├── coding-standards.md
│   ├── refactoring-rules.md
│   ├── review-rules.md
│   ├── testing-rules.md
│   ├── documentation-rules.md
│   ├── debugging-rules.md
│   ├── dependency-rules.md
│   ├── commit-rules.md
│   └── pr-rules.md
├── core/                       # Core documentation
│   ├── architecture.md
│   ├── coding-standards.md
│   ├── naming-conventions.md
│   ├── store-design.md
│   └── database-schema.md
├── adr/                        # Existing ADRs (new ones can be created)
│   └── *.md
└── decisions/                  # Historical decisions
    └── *.md
```

### Exceptions
- Creating new files in `project-memory/adr/` is permitted for any agent (new ADRs).
- Creating new files in `project-memory/tasks/` is permitted for any agent.
- Creating new files in `project-memory/decisions/` is permitted for any agent.
- Errors in read-only files must be reported via an issue/task; they may not be edited directly.

---

## Modification Approval Matrix

| File Location | Frontend Agent | Backend Agent | AI Agent | Infra Agent | Requires Review By |
|---|---|---|---|---|---|
| `frontend/src/app/` | ✅ Full | ❌ | ❌ | ❌ | Frontend lead |
| `frontend/src/components/` | ✅ Full | ❌ | ❌ | ❌ | Frontend lead |
| `frontend/src/hooks/` | ✅ Full | ❌ | ❌ | ❌ | Frontend lead |
| `frontend/src/stores/` | ✅ Full | ❌ | ❌ | ❌ | Frontend lead |
| `frontend/src/services/` | ✅ Full | ✅ Limited | ❌ | ❌ | Frontend or Backend lead |
| `frontend/src/types/` | ✅ Full | ✅ Limited | ❌ | ❌ | Both leads |
| `frontend/src/utils/` | ✅ Full | ❌ | ❌ | ❌ | Frontend lead |
| `frontend/src/styles/` | ✅ Full | ❌ | ❌ | ❌ | Frontend lead |
| `backend/src/modules/` | ❌ | ✅ Full | ❌ | ❌ | Backend lead |
| `backend/src/common/` | ❌ | ✅ Full | ❌ | ❌ | Backend lead |
| `backend/src/config/` | ❌ | ✅ Full | ❌ | ✅ Limited | Backend lead |
| `backend/prisma/schema.prisma` | ❌ | ✅ Full | ❌ | ❌ | Backend lead + DB review |
| `backend/prisma/migrations/` | ❌ | ✅ Full | ❌ | ❌ | Backend lead |
| `python/pipelines/` | ❌ | ❌ | ✅ Full | ❌ | AI lead |
| `python/models/` | ❌ | ❌ | ✅ Full | ❌ | AI lead |
| `python/services/` | ❌ | ❌ | ✅ Full | ❌ | AI lead |
| `python/tests/` | ❌ | ❌ | ✅ Full | ❌ | AI lead |
| `docker/` | ❌ | ❌ | ❌ | ✅ Full | Infrastructure lead |
| `.github/workflows/` | ❌ | ❌ | ❌ | ✅ Full | Infrastructure lead |
| `vercel.json` | ❌ | ❌ | ❌ | ✅ Full | Infrastructure lead |
| `railway.toml` | ❌ | ❌ | ❌ | ✅ Full | Infrastructure lead |
| `project-memory/adr/` (new) | ✅ Create | ✅ Create | ✅ Create | ✅ Create | Architecture board |
| `project-memory/adr/` (existing) | ❌ | ❌ | ❌ | ❌ | Architecture board only |
| `project-memory/agent-control/` | ❌ | ❌ | ❌ | ❌ | Architecture board only |
| `project-memory/core/` | ❌ | ❌ | ❌ | ❌ | Architecture board only |
| `project-memory/tasks/` | ✅ Create | ✅ Create | ✅ Create | ✅ Create | Project lead |
| `README.md` | ❌ | ❌ | ❌ | ❌ | Architecture board only |

---

## File Locking Mechanism

### Lock Types
- **Soft Lock**: Other agents may suggest changes via issues/PRs, but the file is "owned" by the responsible agent type.
- **Hard Lock**: Only the specified agent type may modify; all others MUST get explicit written permission.
- **Read-Only**: No agent may modify. Changes require ADR process.

### Active Locks

| File/Pattern | Lock Type | Owner Agent | Expires |
|---|---|---|---|
| `frontend/src/stores/` | Soft | Frontend | Permanent |
| `frontend/src/components/ui/` | Hard | Frontend (UI specialist) | Permanent |
| `backend/prisma/schema.prisma` | Hard | Backend (DB specialist) | Permanent |
| `python/models/` | Hard | AI (ML specialist) | Permanent |
| `python/pipelines/*.py` | Hard | AI (ML specialist) | Permanent |
| `docker/docker-compose.yml` | Hard | Infrastructure | Permanent |
| `.github/workflows/` | Hard | Infrastructure | Permanent |
| `project-memory/agent-control/*` | Read-Only | Architecture board | Permanent |
| `project-memory/core/*` | Read-Only | Architecture board | Permanent |
| `project-memory/adr/*.md` | Read-Only | Architecture board | Permanent |

### Requesting Lock Changes
1. Create a task in `project-memory/tasks/` with the `[LOCK-CHANGE]` prefix.
2. Include: file pattern, current lock, desired lock, justification.
3. The architecture board will review and respond within 3 business days.
4. Lock changes are documented in `project-memory/decisions/lock-changes.md`.

---

## How to Request Cross-Boundary Access

### Step 1: Determine Necessity
Ask yourself:
- Is this change truly necessary?
- Can the change wait for the correct agent type?
- Is there a workaround within my allowed boundaries?

### Step 2: Document the Request
Create a file in `project-memory/tasks/cross-boundary-requests/` with the format:
```
YYYYMMDD_HHMMSS_brief-description.md
```
Containing:
- **Requestor**: Agent type and name
- **Target**: Which files need modification
- **Reason**: Why cross-boundary access is needed
- **Scope**: Exact changes planned
- **Risk**: What could go wrong
- **Alternatives**: What alternatives were considered

### Step 3: Get Approval
- Submit the request for review by the target agent type's lead.
- If the lead is unavailable, escalate to the architecture board.
- Approval must be documented in the request file.

### Step 4: Execute Changes
- Make only the approved changes.
- Leave comments in changed files noting the cross-boundary modification.
- Add the tag `[CROSS-BOUNDARY]` to the commit message.

### Step 5: Follow Up
- Create a task for the correct agent type to eventually take ownership.
- Close the cross-boundary request when the task is created.
