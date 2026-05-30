# Contributing Guide — Closet Inteligente Digital

> **Audience:** AI agents and human contributors
> **Purpose:** Define the rules, standards, and workflows for contributing to this project

---

## CRITICAL: Reconciliation Rules (Added 2026-05-25)

These rules override any conflicting instruction in this file.

### Agents Must Not Read Full project-memory

Reading all project-memory on session start wastes context. Follow `CONTEXT_LOADING_RULES.md`.
**Mandatory first reads:** `PROJECT_REALITY_MATRIX.md`, `IMPLEMENTATION_STATUS.md`, `STUB_REGISTRY.md`.

### Stub Handling Rules

- A stub is NOT a completed implementation. Never mark a stub as `DONE`.
- All stubs are catalogued in `STUB_REGISTRY.md`.
- When replacing a stub, update the registry and `IMPLEMENTATION_STATUS.md`.
- Stubs that depend on missing systems (AI service, frontend) must stay stubs until those systems exist.

### Frontend / AI / 3D Does Not Exist

- Never write code that imports from `frontend/`, `ai/`, or references Three.js/Blender unless those directories actually exist.
- Specs in `engineering/frontend/`, `engineering/ai/`, and `engineering/rendering/` are PLANNED, not implemented.
- Check `PROJECT_REALITY_MATRIX.md` before trusting any "DONE" claim.

### ADR Update Policy

- If implementation diverged from an ADR (e.g., TypeORM → raw pg), create a superseding ADR immediately.
- Contradictory ADRs must not coexist — one must supersede the other.
- ADR-001 in CHANGELOG v0.1.0 references "TypeORM"; the actual implementation uses raw `pg`. ADR-015 documents this.

### Reconciliation Trigger

If you find project-memory that contradicts reality:
1. Update `PROJECT_REALITY_MATRIX.md` with the contradiction.
2. Update `IMPLEMENTATION_STATUS.md` with the correct status.
3. Do NOT silently accept false "DONE" status.

---

## Table of Contents

1. [AI Agent Contribution Guidelines](#1-ai-agent-contribution-guidelines)
2. [Memory System Update Rules](#2-memory-system-update-rules)
3. [Pull Request Standards](#3-pull-request-standards)
4. [File Modification Rules](#4-file-modification-rules)
5. [Documentation Requirements](#5-documentation-requirements)
6. [Testing Requirements](#6-testing-requirements)
7. [Code Review Process](#7-code-review-process)
8. [Commit Message Format](#8-commit-message-format)
9. [Branch Naming Convention](#9-branch-naming-convention)
10. [Code Style & Linting](#10-code-style--linting)

---

## 1. AI Agent Contribution Guidelines

### 1.1 Agent Identity

Every AI agent must identify itself at the start of a session by writing its agent ID, the date, the task it was assigned, and which memory files it consulted. This must be recorded in a session log file under `project-memory/AGENT-LOGS/`.

**Session log template:**

```markdown
# Session Log — YYYY-MM-DD

**Agent ID:** agent-<name>-<version>
**Task:** <brief description of assigned task>
**Memory Files Consulted:**
- project-memory/PROJECT_STATUS.md
- project-memory/ROADMAP.md
- project-memory/CHANGELOG.md
- project-memory/DECISIONS/adr-<N>.md
- project-memory/COMPONENTS/<component>.md

## Work Performed
- <bullet list of changes made>

## Decisions Made
- <bullet list of decisions>

## Files Created/Modified
- <file path> — <what changed>

## Context Notes
- <anything future agents should know>
```

### 1.2 Mandatory Reading Before Action

Before modifying any source code or configuration, an agent MUST read the following memory files:

| File | Why |
|---|---|
| `PROJECT_STATUS.md` | Know current state, avoid duplicate work |
| `ROADMAP.md` | Know which phase is active, respect priorities |
| `CHANGELOG.md` | Know recent changes, avoid regressions |
| `CONTRIBUTING.md` | Refresh rules (this file) |
| `DECISIONS/ADR-*.md` relevant to the task | Do not violate previous decisions |
| `COMPONENTS/<relevant>.md` | Understand the module being modified |

Failure to read these files before coding may result in rejected contributions.

### 1.3 Mandatory Update After Action

After making any changes, the agent MUST update:

1. **`PROJECT_STATUS.md`** — Update component status (NOT_STARTED → IN_PROGRESS → REVIEW → DONE)
2. **`CHANGELOG.md`** — Add entry under `[Unreleased]` describing the change
3. **`AGENT-LOGS/session-<date>--<agent-id>.md`** — Record the session

If the change introduces a new architectural decision, also create a new ADR in `DECISIONS/`.

### 1.4 Scope Limitation

- An agent should only modify files within the scope of its assigned task
- If an agent discovers an issue outside its task scope, it should file a GitHub Issue (or TODO in the code) rather than fixing it, unless the fix is trivial (<5 lines)
- Cross-cutting concerns (linting, type errors, deprecation warnings) should be fixed regardless of scope

### 1.5 Escalation

If an agent encounters:
- A decision that contradicts an existing ADR → flag for human review
- A security vulnerability → stop work and report immediately
- A task that cannot be completed due to missing prerequisites → update PROJECT_STATUS.md with new blocker entry

---

## 2. Memory System Update Rules

### 2.1 When to Update

| Event | Files to Update |
|---|---|
| Start working on a component | `PROJECT_STATUS.md` (status → IN_PROGRESS) |
| Complete a component | `PROJECT_STATUS.md` (status → REVIEW or DONE) |
| Discover a new risk | `PROJECT_STATUS.md` (add to risk register) |
| Encounter a blocker | `PROJECT_STATUS.md` (add to blockers section) |
| Make an architectural decision | `DECISIONS/adr-<N>.md` (new file) |
| Complete a milestone | `ROADMAP.md` (update status), `PROJECT_STATUS.md` |
| Any code change | `CHANGELOG.md` (unreleased entry) |
| End of session | `AGENT-LOGS/session-<date>--<agent-id>.md` |

### 2.2 Update Frequency

- **PROJECT_STATUS.md:** Update in real-time as work progresses. Do not wait until end of session to update component status.
- **CHANGELOG.md:** Update after each logical change (every commit or group of related commits).
- **AGENT-LOGS:** Write at end of session, but may append during long sessions.
- **DECISIONS:** Write as soon as the decision is made, before implementing.

### 2.3 Data Consistency Rules

- Component status in `PROJECT_STATUS.md` must match reality. If code is written but not reviewed, status is `REVIEW`, not `DONE`.
- If a component is blocked, the blockers table must have a corresponding entry.
- If a component depends on another, the dependency must be listed in both the component table and the roadmap dependencies.
- Never mark a component `DONE` unless:
  - All its tasks in the roadmap are complete
  - Tests are written and passing
  - Documentation is updated
  - Code has been reviewed (or was written by a human)

### 2.4 ADR Creation Rules

- ADRs are numbered sequentially (ADR-001, ADR-002, etc.)
- Each ADR must follow the template:

```markdown
# ADR-<NNN>: <Title>

**Status:** PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED  
**Date:** YYYY-MM-DD  
**Author:** <agent-id or human name>

## Context
<Describe the problem and why this decision is needed>

## Decision
<Describe the chosen approach>

## Consequences
<Positive and negative consequences of this decision>

## Alternatives Considered
<Briefly list alternatives and why they were rejected>

## References
<Links to relevant documentation, issues, or other ADRs>
```

- An ADR is `PROPOSED` when created, `ACCEPTED` after team review, `DEPRECATED` when replaced, `SUPERSEDED` when a newer ADR overrides it.
- Once `ACCEPTED`, the decision must be followed. To change an accepted decision, create a new ADR and mark the old one as `SUPERSEDED`.

---

## 3. Pull Request Standards

### 3.1 PR Size

- **Maximum: 400 lines changed** (excluding auto-generated files, lockfiles, and test fixtures)
- If a PR exceeds this, it must be split into smaller logical PRs
- Exception: Scaffolding PRs (initial project setup) may be larger

### 3.2 PR Title Format

```
<type>(<scope>): <imperative description>
```

Examples:
```
feat(garment): add upload endpoint with CV preprocessing
fix(avatar): correct skin texture mapping on RPM models
refactor(analytics): extract chart components into reusable library
```

### 3.3 PR Description Template

```markdown
## Summary
<2-3 sentences explaining what this PR does and why>

## Changes
### Frontend
- <file path>: <change description>
- <file path>: <change description>

### Backend
- <file path>: <change description>

### AI / CV
- <file path>: <change description>

### Infrastructure
- <file path>: <change description>

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Memory System Updates
- [ ] PROJECT_STATUS.md updated
- [ ] CHANGELOG.md updated
- [ ] ADR created/updated (if applicable)
- [ ] Component spec updated (if applicable)

## Screenshots (if UI change)
<drag and drop screenshots here>

## Related Issues
Closes #<issue-number>
```

### 3.4 PR Checklist (Before Opening)

- [ ] Code compiles without errors (`npm run build` / `nest build` / `tsc --noEmit`)
- [ ] Linting passes (`npm run lint` / `ruff check .`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] All tests pass (`npm run test` / `pytest`)
- [ ] New code has tests (unit + integration where applicable)
- [ ] Memory files updated (PROJECT_STATUS, CHANGELOG, AGENT-LOG)
- [ ] ADR created if new architectural decision
- [ ] Branch is up to date with `main`
- [ ] PR description follows template
- [ ] No secrets or credentials in code
- [ ] No TODO/FIXME without a linked GitHub Issue

---

## 4. File Modification Rules

### 4.1 Source Code Files

- **Do NOT add comments** unless the code is non-obvious and a comment adds significant clarity. Prefer self-documenting code (descriptive variable/function names, small functions, clear types).
- Follow existing code style and patterns in the file you're editing.
- When creating a new file, follow the patterns of similar files in the same directory.
- One file should have one clear responsibility (Single Responsibility Principle).
- Max function length: 40 lines. If a function exceeds this, refactor it into smaller functions.
- Max file length: 400 lines. If a file exceeds this, split it into multiple modules.

### 4.2 Configuration Files

- Do not change configuration files (package.json, tsconfig.json, nest-cli.json, etc.) without a clear reason documented in the PR.
- When adding dependencies, justify why it's needed and whether a lighter alternative exists.
- Pin dependency versions in package.json (no `^` or `~` ranges for production dependencies).

### 4.3 Test Files

- Test files should mirror the source file structure under `__tests__/` directories.
- Test naming: `describe('ComponentName')` → `it('should <expected behavior> when <condition>')`.
- Every public function must have at least one test covering the happy path.
- Bug fixes must include a regression test that fails before the fix and passes after.

### 4.4 AI Model Files

- Large model weight files (>50MB) must NOT be committed to Git. Store them in cloud storage (S3, Hugging Face Hub) and load at runtime.
- Model card documentation in `AI-MODELS/` must include: architecture, training data stats, evaluation metrics, inference performance, and usage example.
- Training scripts should accept hyperparameters via command line or config file, not hardcoded.

### 4.5 No TODOs Without Issues

Every `TODO`, `FIXME`, `HACK`, or `XXX` comment must reference a GitHub Issue number:
```typescript
// TODO(#123): Implement retry logic for failed uploads
```
Unlinked TODOs will be flagged in code review.

---

## 5. Documentation Requirements

### 5.1 When Documentation Is Required

Documentation must be written when:

- Adding a new API endpoint → document in `API/rest-endpoints.md` or `API/websocket-events.md`
- Adding a new AI model → document in `AI-MODELS/<model-name>.md`
- Adding a new component module → document in `COMPONENTS/<component-name>.md`
- Changing a build or deployment process → document in `INFRASTRUCTURE/`
- Adding a non-trivial developer workflow → document in `GUIDES/`

### 5.2 Documentation Quality

- Use descriptive headings and subheadings
- Include code examples where helpful (with syntax highlighting)
- Include sequence diagrams (Mermaid) for multi-step processes
- Document error states and edge cases
- Document environment variables required (with descriptions, not values)

### 5.3 API Documentation

All REST endpoints must be documented in `API/rest-endpoints.md` with:

```
### `METHOD /api/<path>`

**Auth:** Required | Optional | None  
**Rate Limit:** <requests per window>

**Request:**
\`\`\`json
{
  "field": "type | description"
}
\`\`\`

**Response 200:**
\`\`\`json
{
  "data": { ... },
  "meta": { "page": 1, "total": 42 }
}
\`\`\`

**Errors:**
- `401` — Unauthorized (invalid or expired token)
- `404` — Resource not found
- `422` — Validation error (see body for details)
- `429` — Rate limit exceeded
- `500` — Internal server error
```

---

## 6. Testing Requirements

### 6.1 Test Coverage Targets

| Layer | Coverage Target | Notes |
|---|---|---|
| Frontend (components) | ≥70% | Jest + React Testing Library |
| Frontend (hooks/stores) | ≥85% | Pure logic testing |
| Backend (services) | ≥90% | Unit tests with mocks |
| Backend (controllers) | ≥80% | Integration tests with supertest |
| Python AI services | ≥80% | pytest for API + model inference |
| E2E critical paths | 100% coverage of defined paths | Playwright or Cypress |

### 6.2 Test Types Required

| PR Type | Unit Tests | Integration Tests | E2E Tests |
|---|---|---|---|
| Bug fix | ✅ Required | ✅ If applicable | ✅ Regression test |
| New feature (backend) | ✅ Required | ✅ Required | ❌ Unless critical path |
| New feature (frontend) | ✅ Required | ❌ | ✅ For critical UX flows |
| Refactor | ✅ Required (existing must pass) | ✅ Required | ❌ |
| Infrastructure | ❌ | ✅ Required | ❌ |
| AI/ML | ✅ Model tests | ✅ Pipeline tests | ❌ |

### 6.3 Testing Conventions

- Frontend tests: Use `@testing-library/react` for component tests. Avoid testing implementation details.
- Backend tests: Use `@nestjs/testing` with TestBed. Mock external services (Cloudinary, Supabase, Redis).
- AI tests: Use pytest fixtures for sample images. Mock model weights for CI (use tiny test models).
- E2E tests: Use Playwright with page object model pattern. Test on Chrome and Firefox (mobile and desktop viewports).
- Test data: Use factories (Faker.js or Factory Bot pattern). Never use production data in tests.

### 6.4 Running Tests

```bash
# Frontend
cd apps/frontend && npm run test        # Unit tests
cd apps/frontend && npm run test:e2e    # E2E tests (requires backend running)

# Backend
cd apps/backend && npm run test         # Unit + integration tests
cd apps/backend && npm run test:e2e     # E2E API tests

# Python AI
cd services/ai && pytest                # All tests
cd services/ai && pytest -m "not slow"  # Skip slow model tests for CI
```

---

## 7. Code Review Process

### 7.1 Who Reviews

- **AI agent PRs:** Must be reviewed by a human before merging into `main`
- **Human PRs:** Must be reviewed by at least one other human (or AI agent for style/lint checks)
- **Emergency fixes:** Can be merged with post-merge review, but must be tagged with `[HOTFIX]`

### 7.2 Review Checklist

Reviewers must verify:

- [ ] Code is correct and achieves the stated goal
- [ ] Code follows project conventions (naming, structure, patterns)
- [ ] No obvious performance issues (N+1 queries, unnecessary re-renders, large bundles)
- [ ] Error handling is appropriate (no swallowed errors, proper user-facing messages)
- [ ] Security: no injection vulnerabilities, no exposed secrets, proper input validation
- [ ] Tests are adequate and passing
- [ ] Documentation is updated (memory files, API docs, component specs)
- [ ] No unnecessary dependencies added
- [ ] Accessibility considerations (for frontend changes: keyboard nav, screen reader labels, color contrast)

### 7.3 Review Response Time

| PR Priority | Initial Review Target | Merge Target |
|---|---|---|
| Critical (blocks other work) | 4 hours | 8 hours |
| High (feature milestone) | 8 hours | 24 hours |
| Medium (standard feature) | 24 hours | 48 hours |
| Low (refactor, docs, chores) | 48 hours | 72 hours |

### 7.4 Merge Rules

- PRs require at least one approval (human for AI PRs, human or agent for human PRs)
- All CI checks must pass
- No merge conflicts with `main`
- Use **squash merge** for feature branches (clean history)
- Use **merge commit** for release branches (preserves structure)
- Delete the branch after merge

---

## 8. Commit Message Format

### 8.1 Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 8.2 Type

| Type | Usage |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes (including memory files) |
| `style` | Code style changes (formatting, missing semicolons) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, CI, tooling changes |
| `ci` | CI configuration changes |
| `build` | Dependency updates, build system changes |

### 8.3 Scope

| Scope | Area |
|---|---|
| `frontend` | Next.js application |
| `backend` | NestJS application |
| `ai` | Python AI/CV services |
| `3d` | Three.js, Blender pipeline |
| `infra` | Docker, CI/CD, hosting |
| `memory` | Project memory system files |
| `auth` | Authentication module |
| `garment` | Garment CRUD and upload |
| `outfit` | Outfit builder and CRUD |
| `avatar` | Avatar customization and 3D |
| `recommend` | AI recommendation engine |
| `calendar` | Outfit scheduling |
| `analytics` | Wardrobe analytics |
| `notif` | Push notifications |
| `sync` | Real-time sync (Socket.IO) |

### 8.4 Subject Rules

- Maximum 72 characters
- Imperative mood ("add feature" not "added feature" or "adds feature")
- Do NOT end with a period
- Capitalize the first letter

### 8.5 Body Rules

- Optional but recommended for non-trivial changes
- Explain WHAT changed and WHY, not HOW
- Reference memory files updated
- Reference related issues

### 8.6 Footer Rules

- Reference issues: `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: <description>`
- Co-authors: `Co-authored-by: Name <email>`

### 8.7 Examples

```
feat(garment): implement upload endpoint with CV preprocessing

Adds POST /api/garments/upload flow:
1. Multer receives image file
2. Image sent to Python CV service for segmentation and attribute extraction
3. Processed image and metadata stored via Cloudinary and PostgreSQL
4. Response includes garment ID, thumbnail URL, and extracted attributes

Memory files updated:
- PROJECT_STATUS.md: garment service → IN_PROGRESS
- CHANGELOG.md: added under Unreleased

Closes #42
```

```
fix(avatar): correct skin texture UV mapping on RPM models

The UV coordinates for the face region were offset by 2px causing a visible
seam at the jawline. Adjusted the texture atlas offset to align with RPM
GLTF export specification.

Memory files updated:
- CHANGELOG.md: added fix entry

Fixes #128
```

```
docs(memory): add ADR-007 for Redis caching strategy

Records decision to implement Redis for:
- AI inference result caching (5 min TTL)
- Session store for Socket.IO
- Rate limiter backend
- Garment thumbnail cache (1 hour TTL)

Memory files updated:
- DECISIONS/adr-007-redis-caching-strategy.md (new)
- ROADMAP.md: Redis milestone updated

Closes #89
```

---

## 9. Branch Naming Convention

### 9.1 Format

```
<type>/<scope>/<short-description>
```

### 9.2 Examples

| Type | Example Branch |
|---|---|
| Feature | `feat/garment/upload-endpoint` |
| Bug Fix | `fix/avatar/skin-texture-offset` |
| Refactor | `refactor/frontend/extract-chart-library` |
| Docs | `docs/memory/add-adr-007` |
| Chore | `chore/infra/update-docker-compose` |

### 9.3 Branch Rules

- Always branch from `main`
- Keep branches short-lived (merge within 3 days of creation)
- Delete after merge
- Do not commit directly to `main` or `develop`

---

## 10. Code Style & Linting

### 10.1 General

- **Indentation:** 2 spaces (configured in `.editorconfig`)
- **Quotes:** Single quotes for TypeScript/JavaScript, double quotes for Python
- **Semicolons:** Required for TypeScript/JavaScript
- **Trailing commas:** Required for multi-line statements
- **Line length:** 100 characters max (120 for Python)
- **File encoding:** UTF-8
- **Line endings:** LF (Unix), not CRLF

### 10.2 TypeScript / JavaScript

- Strict TypeScript mode (`strict: true` in tsconfig)
- Prefer `interface` over `type` for object shapes
- Prefer `const` over `let` and never use `var`
- Use `async/await` over raw Promises (except in Promise.all)
- Use optional chaining (`?.`) and nullish coalescing (`??`) over `&&` or `||` guards
- Import order: built-in → external → internal → relative
- Named exports preferred over default exports
- React components: function components with hooks (no class components)
- Props interfaces should be co-located with the component file

### 10.3 Python

- Follow PEP 8 (enforced by `ruff`)
- Type hints required for all function signatures
- Use `pathlib` over `os.path`
- Use `dataclasses` over manual `__init__` methods
- Docstrings: Google style for public APIs
- Imports order: standard library → third-party → local

### 10.4 CSS / Tailwind

- Use Tailwind utility classes for layout and spacing (avoid custom CSS)
- Custom CSS only for animations, complex gradients, or when Tailwind cannot express the design
- Use CSS Modules (`.module.css`) when custom CSS is needed
- Follow mobile-first responsive design: `sm:`, `md:`, `lg:`, `xl:` breakpoints

### 10.5 Linting Commands

```bash
# Frontend
cd apps/frontend && npm run lint        # ESLint
cd apps/frontend && npm run typecheck   # tsc --noEmit

# Backend
cd apps/backend && npm run lint         # ESLint
cd apps/backend && npm run typecheck    # tsc --noEmit

# Python AI
cd services/ai && ruff check .          # Lint
cd services/ai && ruff format --check . # Format check
cd services/ai && mypy .               # Type check

# All services (from root)
npm run lint                            # Root-level lint (all workspaces)
npm run typecheck                       # Root-level typecheck (all workspaces)
```

---

## 11. Dependency Management

### 11.1 Adding Dependencies

- Before adding a dependency, check if there's a built-in or lighter alternative
- Dependencies must be justified in the PR description
- Pin exact versions for production dependencies (`"next": "14.2.3"`)
- Allow patch ranges for dev dependencies (`"eslint": "~8.56.0"`)
- Run `npm audit` after adding dependencies and fix any vulnerabilities

### 11.2 Prohibited Dependencies

- Libraries with known security vulnerabilities (check Snyk/advisory DB)
- Libraries with unstable APIs (pre-1.0 versions unless necessary)
- Multiple libraries that solve the same problem (e.g., dayjs + date-fns)
- jQuery, Bootstrap, or other DOM-manipulation libraries (conflict with React)

---

## 12. Environment & Secrets

### 12.1 Environment Variables

- All environment variables must be documented in `.env.example` at the root and per-service
- Never commit actual `.env` files, `.env.local`, or any file containing secrets
- Use descriptive variable names with prefixes per service: `NEXT_PUBLIC_*`, `NEST_*`, `AI_*`
- For local development, provide sensible defaults in `.env.example`

### 12.2 Secrets Management

- Production secrets: stored in Vercel Environment Variables, Railway secrets, or GitHub Actions secrets
- Never log secrets (sensitive data) to console or error tracking services
- Use short-lived JWT tokens; rotate tokens regularly
- API keys for external services (Cloudinary, Supabase, Firebase) should have restricted permissions

---

## 13. Performance Budgets

| Metric | Budget | Measurement |
|---|---|---|
| First Contentful Paint (FCP) | <1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | <2.5s | Lighthouse |
| Time to Interactive (TTI) | <3.5s | Lighthouse |
| JavaScript bundle (gzipped) | <250KB | webpack-bundle-analyzer |
| API response time (P95) | <500ms | Server-side logging |
| AI inference time (P95) | <3s | Python logging |
| 3D render frame rate | >30 FPS | Three.js stats |
| Database query time (P95) | <100ms | PostgreSQL slow query log |

---

## 14. Communication

- **GitHub Issues** for bug reports, feature requests, and tasks
- **GitHub Discussions** for architectural questions and design proposals
- **PR comments** for code-specific feedback
- **Memory system updates** for recording decisions and status
- All communication should be in English (for tooling compatibility) or Spanish (primary team language)
- Be respectful and constructive in code reviews; focus on the code, not the author

---

## 15. Licensing

By contributing to this project, you agree that your contributions will be licensed under the project's license. Ensure you have the right to contribute any code you submit.
