# Context Loading

> **CORRECTION NOTICE (2026-05-25):** Several paths in this file are incorrect.
> Use `CONTEXT_LOADING_RULES.md` instead — it reflects actual project structure.
>
> Known wrong paths in this file:
> - `backend/prisma/schema.prisma` — NO Prisma; project uses raw `pg`
> - `backend/src/modules/` — actual path is `backend/src/<module-name>/`
> - `python/requirements.txt` — Python/AI service does not exist
> - `frontend/package.json` — frontend does not exist
> - `docker/docker-compose.yml` — actual path is `docker-compose.yml` at project root
>
> **Correct context loading rules:** `project-memory/CONTEXT_LOADING_RULES.md`

> This document defines the process for loading the appropriate context before making any changes to the codebase. Proper context loading prevents errors, ensures consistency, and respects the project's architecture.

---

## Why Context Loading Matters

Every change to the codebase exists within a context of:
- Existing architecture decisions
- Current project structure and conventions
- Prior art (existing components, patterns, implementations)
- Team conventions and coding standards
- Open tasks and known issues

Skipping context loading leads to:
- Duplicate work (creating something that already exists)
- Inconsistent patterns (breaking established conventions)
- Architecture violations (ignoring documented constraints)
- Rejected PRs (failing code review)

---

## Required Context Files Per Task Type

### General (ALL tasks must read)
| Priority | File | Why |
|----------|------|-----|
| 1 | `project-memory/core/architecture.md` | Understand system architecture |
| 2 | `project-memory/core/coding-standards.md` | Understand coding conventions |
| 3 | `project-memory/core/naming-conventions.md` | Understand naming patterns |
| 4 | `project-memory/agent-control/architecture-protection-rules.md` | Understand non-negotiable rules |
| 5 | `project-memory/agent-control/forbidden-actions.md` | Understand forbidden actions |
| 6 | `project-memory/agent-control/file-modification-rules.md` | Understand file boundaries |

### Frontend Tasks
| Priority | File | Why |
|----------|------|-----|
| 1 | `frontend/package.json` | Check available dependencies |
| 2 | `frontend/tailwind.config.ts` | Check design tokens |
| 3 | `frontend/tsconfig.json` | Check TypeScript configuration |
| 4 | `frontend/src/types/` | Check existing type definitions |
| 5 | `frontend/src/stores/` | Check existing stores |
| 6 | `frontend/src/components/` | Check existing components |
| 7 | `project-memory/core/store-design.md` | Check state management patterns |

### Backend Tasks
| Priority | File | Why |
|----------|------|-----|
| 1 | `backend/package.json` | Check available dependencies |
| 2 | `backend/prisma/schema.prisma` | Check database schema |
| 3 | `backend/tsconfig.json` | Check TypeScript configuration |
| 4 | `backend/src/modules/` | Check existing modules |
| 5 | `backend/src/common/` | Check shared utilities |
| 6 | `backend/src/config/` | Check configuration patterns |
| 7 | `project-memory/core/database-schema.md` | Check database documentation |

### AI Tasks
| Priority | File | Why |
|----------|------|-----|
| 1 | `python/requirements.txt` | Check available dependencies |
| 2 | `python/services/schemas/` | Check existing schemas |
| 3 | `python/pipelines/` | Check existing pipeline patterns |
| 4 | `python/models/` | Check available models |
| 5 | `python/utils/` | Check existing utilities |

### Infrastructure Tasks
| Priority | File | Why |
|----------|------|-----|
| 1 | `docker/docker-compose.yml` | Check current Docker setup |
| 2 | `.github/workflows/` | Check CI/CD configuration |
| 3 | `vercel.json` | Check Vercel configuration |
| 4 | `railway.toml` | Check Railway configuration |
| 5 | `package.json` (root) | Check workspace configuration |

### Cross-Cutting Tasks
| Priority | File | Why |
|----------|------|-----|
| 1 | `project-memory/agent-control/workflows.md` | Check deterministic workflows |
| 2 | `project-memory/adr/` | Check relevant ADRs |
| 3 | `project-memory/tasks/` | Check related tasks |
| 4 | `project-memory/decisions/` | Check related decisions |

---

## Context Loading Sequence

Follow this sequence for EVERY task, regardless of type:

```
STEP 1: Load Agent Control Context
├── Read file-modification-rules.md (check your boundaries)
├── Read forbidden-actions.md (check what you cannot do)
├── Read workflows.md (check for a deterministic workflow)
├── Read commit-rules.md (prepare for commit)
└── Read pr-rules.md (prepare for PR)

STEP 2: Load Project Context
├── Read architecture.md (understand the system)
├── Read coding-standards.md (understand conventions)
├── Read naming-conventions.md (understand names)
└── Check ADR directory for relevant decisions

STEP 3: Load Task-Specific Context
├── [Frontend] Read frontend structure and existing components
├── [Backend] Read backend modules and database schema
├── [AI] Read python services and pipelines
└── [Infra] Read Docker and CI/CD configuration

STEP 4: Load Current State Context
├── Check open tasks in project-memory/tasks/
├── Check git log for recent changes
├── Check for any ongoing discussions
└── Verify document freshness (are docs outdated?)

STEP 5: Verify Understanding
├── Can I identify the exact files I need to modify?
├── Do I understand the patterns used in those files?
├── Have I checked naming conventions for new names?
├── Have I found at least one similar implementation?
└── Do I know what tests look like for this type of change?
```

---

## Priority Files to Read First

When time is limited, ALWAYS read these files before making ANY change:

1. **`project-memory/core/architecture.md`** — 5 minutes, prevents architecture violations
2. **`project-memory/core/coding-standards.md`** — 3 minutes, prevents style violations
3. **`project-memory/core/naming-conventions.md`** — 2 minutes, prevents naming violations
4. **`project-memory/agent-control/file-modification-rules.md`** — 3 minutes, prevents boundary violations
5. **`project-memory/agent-control/forbidden-actions.md`** — 5 minutes, prevents forbidden actions
6. **`project-memory/agent-control/architecture-protection-rules.md`** — 10 minutes, prevents architecture violations

---

## How to Search for Relevant Prior Decisions (ADRs)

### ADR Location
All ADRs are stored in `project-memory/adr/` with the naming convention:
```
adr-YYYYMMDD-brief-description.md
```

### Search Process
1. Identify keywords related to your task (e.g., "database", "authentication", "3d", "websocket").
2. Search the ADR directory for matching keywords.
3. Read any matching ADRs in full.
4. Check the `status` section of each ADR (Accepted, Deprecated, Superseded, Proposed).
5. If an ADR is superseded, find and read the superseding ADR.
6. If no ADR matches, consider whether a new ADR is needed.

### When to Create a New ADR
- You are changing something that is listed as "requires ADR" in a governance document.
- You are proposing a significant architectural change.
- You are introducing a new technology or dependency.
- You are overriding or modifying a previous ADR.

---

## How to Check Current Project Status

### Git-Based Status
```
git log --oneline -20      # Recent commits
git status                  # Current branch and changes
git diff --stat            # Uncommitted changes
```

### Task-Based Status
Read `project-memory/tasks/README.md` (if exists) for task board overview.
Check `project-memory/tasks/` for open tasks by date.

### Build Status
- Check CI/CD status in `.github/workflows/` for recent runs (if GitHub Actions is configured).
- Verify the project builds locally before making changes.

---

## How to Find Relevant Tasks

### Task Directory
Tasks are stored in `project-memory/tasks/` with the naming convention:
```
YYYYMMDD_HHMMSS_brief-description.md
```

### Search Process
1. Read the task directory listing to see all tasks.
2. Filter by status (OPEN, IN_PROGRESS, REVIEW, DONE, BLOCKED).
3. Search for keywords related to your current work.
4. Check the `depends_on` field in relevant tasks to find dependencies.
5. Check the `related_tasks` field to find linked tasks.

### Task File Format
Each task file contains:
- **Title**: Brief description
- **Status**: OPEN | IN_PROGRESS | REVIEW | DONE | BLOCKED
- **Priority**: LOW | MEDIUM | HIGH | CRITICAL
- **Agent**: Assigned agent type
- **Description**: Detailed description
- **Acceptance Criteria**: What must be true when done
- **Dependencies**: Tasks that must be done first
- **Related Tasks**: Linked tasks
- **Notes**: Implementation notes

---

## How to Verify Test Patterns Before Writing Tests

### Step 1: Find Existing Tests
```
frontend/         → frontend/src/**/*.test.ts, frontend/src/**/*.spec.ts
backend/          → backend/test/*.spec.ts, backend/test/*.e2e-spec.ts
python/           → python/tests/*.py (test_ prefix)
```

### Step 2: Read Example Tests
Read at least 2-3 existing test files to understand:
- Test framework and assertions (Jest, pytest)
- Mocking patterns (jest.mock, unittest.mock)
- Test organization (describe/it blocks, test classes)
- Test data setup (factories, fixtures, builders)
- Test isolation (beforeEach, setUp, teardown)
- Coverage expectations (what is tested and what is not)

### Step 3: Match Test Patterns
Copy the patterns you observe:
- Same naming convention for test files
- Same test structure (Arrange-Act-Assert)
- Same mocking approach
- Same test data approach

### Step 4: Check Testing Rules
Read `project-memory/agent-control/testing-rules.md` for additional requirements.

---

## How to Review Existing Components Before Creating New Ones

### Step 1: Search for Existing Solutions
Before creating any new file:
- Search for existing components with similar names or functionality.
- Check if the functionality already exists and only needs to be enhanced.
- Check if there is a base/primitive component that can be extended.

### Step 2: Review Similar Components
Read at least 2-3 existing components in the same category:
- File structure: How are files organized?
- Props pattern: What patterns do props follow?
- Style pattern: How is Tailwind CSS used?
- State pattern: How is state managed (local vs store vs query)?
- Error handling: How are errors handled?
- Loading state: How are loading states handled?
- Empty state: How are empty/null states handled?

### Step 3: Match Established Patterns
Ensure your new component follows the same patterns:
- Same file structure
- Same naming conventions
- Same import order
- Same export style (named vs default)
- Same commenting/documentation approach

---

## How to Check Naming Conventions Before Naming Anything

### Step 1: Read Naming Conventions
Read `project-memory/core/naming-conventions.md` in full.

### Step 2: Check Existing Names
Search for similar existing files to see how they are named:
- Components: PascalCase with `.tsx` extension
- Hooks: camelCase with `use` prefix and `.ts` extension
- Stores: camelCase with `Store` suffix and `.ts` extension
- Services: camelCase with `Service` suffix and `.ts` extension
- Types: PascalCase with `.ts` extension
- Utils: camelCase with `.ts` extension
- Backend modules: kebab-case directories
- Database tables: snake_case
- Environment variables: UPPER_SNAKE_CASE

### Step 3: Validate
- Run `npx tsx scripts/check-naming-conventions.ts` if available.
- Manually verify against the naming conventions document.
- Ask for review if unsure.

---

## How to Validate Against Coding Standards

### Step 1: Run Linters
```
Frontend: npx eslint frontend/src/
Frontend: npx prettier --check frontend/src/
Backend:  npx eslint backend/src/
Python:   flake8 python/
Python:   black --check python/
```

### Step 2: Run Type Checker
```
Frontend: npx tsc --noEmit --project frontend/tsconfig.json
Backend:  npx tsc --noEmit --project backend/tsconfig.json
Python:   mypy python/
```

### Step 3: Run Tests
```
Frontend: npm test --prefix frontend
Backend:  npm test --prefix backend
Python:   pytest python/tests/
```

### Step 4: Verify No Violations
- Zero lint errors
- Zero type errors
- All tests passing
- No console.warn/error in test output
- No TODO or FIXME comments without associated tasks

---

## Context Freshness Checking

### Detecting Outdated Documentation

Signs that documentation may be outdated:
1. **The code doesn't match the docs**: Implementation differs from the documented approach.
2. **Stale ADRs**: An ADR exists but a newer one supersedes it without explicit notation.
3. **Missing files**: Documentation references files that no longer exist.
4. **Orphaned files**: Files exist that are not referenced in any documentation.
5. **Inconsistent version numbers**: Documentation mentions versions that differ from actual dependencies.
6. **Broken links**: Documentation contains links to files or URLs that return 404.

### What to Do When Documentation Is Outdated

1. **Do NOT blindly follow outdated documentation** — this will produce incorrect results.
2. **Cross-reference with actual code** — the code is the source of truth.
3. **Create a task** to update the documentation: `project-memory/tasks/YYYYMMDD_HHMMSS_update-docs.md`.
4. **Make a note** in your PR description that you encountered outdated documentation.
5. **If safe, fix the documentation** as part of your change (small fixes only).

### Freshness Check Every Agent Should Run
```
Before every change:
1. When was this document last modified? (git log --oneline <file>)
2. Does the document reference code/files that still exist?
3. Does the document's guidance still match the actual codebase?
4. Are there any newer documents that might supersede this one?
```

---

## Minimum Context Requirements Before Editing

### Absolute Minimum (For ANY change, no exceptions)
- [ ] Read `project-memory/core/coding-standards.md`
- [ ] Read `project-memory/core/naming-conventions.md`
- [ ] Read `project-memory/agent-control/file-modification-rules.md`
- [ ] Read `project-memory/agent-control/forbidden-actions.md`

### Minimum for Frontend Changes
- [ ] All of the above
- [ ] Read `project-memory/core/architecture.md` (frontend section)
- [ ] Read `frontend/package.json`
- [ ] Read 2-3 existing similar components
- [ ] Check `frontend/src/types/` for relevant type definitions

### Minimum for Backend Changes
- [ ] All of the above
- [ ] Read `project-memory/core/architecture.md` (backend section)
- [ ] Read `backend/package.json`
- [ ] Read `backend/prisma/schema.prisma` (if database-related)
- [ ] Read 2-3 existing similar modules

### Minimum for AI Changes
- [ ] All of the above
- [ ] Read `python/requirements.txt`
- [ ] Read 2-3 existing similar pipelines or services
- [ ] Check `python/services/schemas/` for relevant schemas

### Minimum for Infrastructure Changes
- [ ] All of the above
- [ ] Read `docker/docker-compose.yml`
- [ ] Read `.github/workflows/` relevant workflow files
- [ ] Read `vercel.json` or `railway.toml` as applicable

---

## Context Loading Checklist (Print This)

```
[ ] 1. Read file-modification-rules.md — know my boundaries
[ ] 2. Read forbidden-actions.md — know what I can't do
[ ] 3. Read workflows.md — is there a defined workflow?
[ ] 4. Read architecture.md — understand the system
[ ] 5. Read coding-standards.md — understand conventions
[ ] 6. Read naming-conventions.md — understand names
[ ] 7. Check ADRs — any relevant decisions?
[ ] 8. Check existing components — is there prior art?
[ ] 9. Check existing tasks — any related work?
[ ] 10. Check test patterns — how are tests written?
[ ] 11. Verify docs freshness — are docs outdated?
[ ] 12. Read commit-rules.md — how to commit
[ ] 13. Read pr-rules.md — how to PR
```

If any item is unchecked, go back and load that context before proceeding.
