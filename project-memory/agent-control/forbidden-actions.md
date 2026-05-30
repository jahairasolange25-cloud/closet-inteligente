# Forbidden Actions

> **CORRECTION NOTICE (2026-05-25):**
> - Rule 3 says "MUST go through a Prisma migration" — **NO PRISMA**. Use raw `.sql` migration files in `backend/src/database/migrations/`.
> - Any reference to Prisma in this file is INCORRECT. The project uses raw `pg` (ADR-015).
> - Any reference to Auth0 in this file is INCORRECT. The project uses Supabase JWT (ADR-010).
>
> See `PROJECT_REALITY_MATRIX.md` for authoritative technology list.

> This document defines the complete list of actions that AI agents are explicitly FORBIDDEN from performing. Violations are tracked and escalated according to the severity matrix.

---

## 1. Cannot Modify Tech Stack

**Rule:** No agent may add, remove, or replace any technology in the approved tech stack (Next.js, React, TypeScript, Tailwind CSS, Zustand, TanStack Query, React Three Fiber, Three.js, NestJS, Node.js, PostgreSQL, Supabase, Redis, Socket.IO, Python, PyTorch, OpenCV, Mediapipe, Hugging Face Transformers, Detectron2).

**Why:** The tech stack was carefully selected and approved by the architecture board. Uncontrolled changes create integration risks, knowledge fragmentation, and maintenance overhead.

**Consequences:** CRITICAL severity. Immediate revert. ADR required. Agent access suspended pending retraining.

**Examples:**
- Replacing Zustand with Redux
- Introducing MongoDB alongside PostgreSQL
- Switching from Next.js to Gatsby
- Adding Express.js as a secondary backend
- Introducing TensorFlow instead of PyTorch

---

## 2. Cannot Add New Dependencies Without Review

**Rule:** No new npm, pip, or system dependencies may be added without going through the dependency review process defined in `dependency-rules.md`.

**Why:** Unreviewed dependencies introduce security vulnerabilities, license compliance issues, bundle bloat, and maintenance burden.

**Consequences:** HIGH severity. Dependency must be removed. Dependency review must be completed before re-addition.

**Examples:**
- Running `npm install <package>` without creating a dependency review ticket
- Adding a Python package to `requirements.txt` without review
- Adding a native system dependency to Dockerfile without review

---

## 3. Cannot Modify Database Schema Without Migration

**Rule:** Every database schema change MUST go through a Prisma migration. Direct SQL schema modifications (ALTER TABLE, CREATE TABLE, DROP TABLE) outside of migrations are FORBIDDEN.

**Why:** Direct schema modifications bypass version control, make rollbacks impossible, and risk data loss.

**Consequences:** CRITICAL severity. Schema changes must be reverted. Proper migration must be created.

**Examples:**
- Running `ALTER TABLE users ADD COLUMN age INT` directly on the database
- Editing `schema.prisma` without running `prisma migrate dev`
- Deleting migration files
- Modifying migration files after they've been applied

---

## 4. Cannot Modify API Contracts Without Versioning

**Rule:** Once an API endpoint or WebSocket event is in production, its contract may not be changed without proper versioning (new endpoint version, deprecation notice on old version).

**Why:** Breaking API changes silently break all consumers (frontend, mobile apps, third-party integrations).

**Consequences:** CRITICAL severity. Changes must be reverted. Proper versioning must be implemented.

**Examples:**
- Changing a response field name without creating a v2 endpoint
- Removing a field from an API response
- Changing a WebSocket event payload shape
- Making an optional request field required
- Changing a field's data type

---

## 5. Cannot Simplify Error Handling

**Rule:** Error handling may not be simplified, consolidated, or removed. Every catch block must handle the error appropriately (log, transform, and either rethrow or return a meaningful error response).

**Why:** Simplifying error handling leads to silent failures, poor debugging experience, and data corruption.

**Consequences:** HIGH severity. Error handling must be restored. Code review must verify completeness.

**Examples:**
- Replacing specific error types with a generic `catch (err) {}`
- Removing error logging
- Returning `200 OK` for all responses instead of proper HTTP status codes
- Removing input validation error messages

---

## 6. Cannot Remove Validation

**Rule:** Input validation (frontend form validation, backend DTO validation, API request validation) may not be removed, commented out, or bypassed.

**Why:** Validation is the first line of defense against malformed data, injection attacks, and business logic errors.

**Consequences:** HIGH severity. Validation must be restored. Security review must be triggered.

**Examples:**
- Removing Zod schemas from API routes
- Removing class-validator decorators from DTOs
- Removing frontend form validation "because backend validates too"
- Adding `@SkipValidation()` or equivalent bypass decorators
- Adding `// eslint-disable-next-line @typescript-eslint/no-explicit-any` to skip type validation

---

## 7. Cannot Skip Tests

**Rule:** Tests may not be skipped (`test.skip`, `it.skip`, `pytest.mark.skip`), commented out, or removed without documented justification approved by the test lead.

**Why:** Skipping tests creates gaps in coverage, leading to undetected regressions.

**Consequences:** HIGH severity. Tests must be restored. Justification must be documented.

**Examples:**
- Adding `.skip` to a failing test instead of fixing it
- Removing test files
- Adding `// TODO: add tests later` without creating a task
- Adding `@pytest.mark.skip` without a reason

---

## 8. Cannot Modify README or Core Docs Without Syncing

**Rule:** Changes to README.md, core documentation files (`project-memory/core/*`), or this agent-control directory must be synced across all related documentation.

**Why:** Outdated or inconsistent documentation causes confusion, errors, and wasted time.

**Consequences:** MEDIUM severity. Documentation must be updated to be consistent.

**Examples:**
- Updating README installation steps without updating the contributing guide
- Modifying API documentation without updating the corresponding type definitions
- Renaming a directory without updating all references to the old path

---

## 9. Cannot Delete Files Without Approval

**Rule:** No file may be deleted without approval from at least one other team member (or documented reason in a task/issue).

**Why:** Deletion is irreversible. Files may contain functionality or references unknown to the deleting agent.

**Consequences:** MEDIUM severity. File must be restored. Approval process must be followed.

**Examples:**
- Deleting a component file that is still imported elsewhere
- Deleting a migration file that has been applied
- Deleting documentation that is still referenced

---

## 10. Cannot Rename Files Without Updating Imports

**Rule:** When renaming a file, all imports referencing the old path MUST be updated in the same commit.

**Why:** Broken imports cause build failures, broken functionality, and wasted debugging time.

**Consequences:** MEDIUM severity. Updated commits must fix all import references.

**Examples:**
- Renaming `Button.tsx` to `PrimaryButton.tsx` without updating `import { Button }` to `import { PrimaryButton }`
- Renaming a utility file without updating all files that import from it

---

## 11. Cannot Create Generic Components Without Specification

**Rule:** Generic/reusable components may only be created when a clear specification exists (defined in `project-memory/tasks/` or a design document). Components may not be "pre-emptively" made generic.

**Why:** Premature abstraction creates unused code, increases maintenance burden, and adds unnecessary complexity.

**Consequences:** LOW severity. Component must either be used or removed.

**Examples:**
- Creating a `GenericModal` component when only one type of modal is needed
- Creating a `DataTable` component with pagination, sorting, and filtering before any such table is needed
- Abstracting a component too early with props/options that are never used

---

## 12. Cannot Modify State Management Without Store Design

**Rule:** Zustand stores may not be modified or created without a documented store design (listed in `project-memory/core/store-design.md` or similar).

**Why:** Ad-hoc state management changes lead to inconsistent patterns, duplicate state, and difficult-to-track bugs.

**Consequences:** MEDIUM severity. Store design must be documented.

**Examples:**
- Adding a new piece of state to a store without documenting it
- Creating a new Zustand store without updating the store registry
- Splitting or merging stores without ADR
- Using `useState` for global state that should be in a store

---

## 13. Cannot Remove Accessibility Features

**Rule:** Accessibility (a11y) features — ARIA labels, keyboard navigation, focus management, screen reader support, color contrast — may not be removed, commented out, or downgraded.

**Why:** Accessibility is a legal requirement in many jurisdictions and a core value of the platform.

**Consequences:** HIGH severity. Accessibility features must be restored. Accessibility audit must be triggered.

**Examples:**
- Removing `aria-label` attributes
- Removing keyboard event handlers
- Removing skip-to-content links
- Removing focus-visible styles
- Removing alt text from images

---

## 14. Cannot Use Prohibited Libraries

**Rule:** The following libraries are explicitly FORBIDDEN:
- **Vue.js** (any version)
- **Django** (any version)
- **Redux** (any version)
- **Sequelize** (any version)
- **TensorFlow** (any version)
- **Unity WebGL** (any version)
- **Prisma** replacement tools (TypeORM, Drizzle, Knex)
- **Express.js** (standalone)
- **Fastify**
- **Flask**
- **MongoDB**
- **MySQL**

**Why:** These technologies conflict with the approved tech stack and would introduce maintenance, integration, and knowledge-sharing issues.

**Consequences:** CRITICAL severity. Library must be removed immediately. ADR required if addition is genuinely needed.

---

## 15. Cannot Inline API Endpoints

**Rule:** API endpoint URLs may not be hardcoded/inlined in components or hooks. Every endpoint must be defined in `frontend/src/services/`.

**Why:** Inlined endpoints are impossible to maintain, refactor, or version consistently.

**Consequences:** LOW severity. Endpoint must be moved to service layer.

**Examples:**
- Writing `fetch('/api/wardrobe/items')` inside a component
- Hardcoding `const API_URL = 'https://api.example.com'` in a hook

---

## 16. Cannot Hardcode Secrets

**Rule:** API keys, database passwords, JWT secrets, Auth0 credentials, or any other secrets must NOT be hardcoded in source code. All secrets must be in environment variables (`.env` files or CI/CD secrets).

**Why:** Hardcoded secrets are a critical security vulnerability. They can be exposed through version control, build logs, or decompilation.

**Consequences:** CRITICAL severity. Secret must be immediately rotated and removed from all history. Security incident report must be filed.

**Examples:**
- Adding `const AUTH0_SECRET = 'abc123'` to source code
- Committing `.env` files with real secrets
- Including API keys in test files
- Hardcoding database connection strings

---

## 17. Cannot Disable TypeScript Strict Mode

**Rule:** TypeScript's strict mode (`strict: true` in `tsconfig.json`) may not be disabled, modified to less strict, or bypassed with excessive `any` types.

**Why:** Strict TypeScript catches entire classes of bugs at compile time. Relaxing strictness increases runtime errors.

**Consequences:** HIGH severity. Strict mode must be restored. Excessive `any` types must be replaced.

**Examples:**
- Setting `"strict": false`
- Setting `"noImplicitAny": false`
- Setting `"strictNullChecks": false`
- Adding `// @ts-nocheck` or `// @ts-ignore` without documented justification
- Using `any` type more than once per file without justification

---

## 18. Cannot Modify WebSocket Event Contracts Without Documentation

**Rule:** WebSocket event names, payload schemas, and direction (client-to-server vs server-to-client) must be documented before implementation. Existing contracts may not be modified without updating documentation.

**Why:** Undocumented WebSocket changes are invisible to the rest of the team and cause runtime failures.

**Consequences:** MEDIUM severity. Documentation must be updated.

**Examples:**
- Adding a new WebSocket event without documenting it
- Changing an existing event's payload without updating its schema
- Removing an event without deprecation notice

---

## 19. Cannot Bypass Authentication Guards

**Rule:** NestJS Guards (`@UseGuards()`) may not be removed, modified to allow unauthenticated access, or bypassed via custom middleware.

**Why:** Authentication bypass is a critical security vulnerability that exposes user data and system functionality.

**Consequences:** CRITICAL severity. Guard must be restored. Security audit must be triggered.

**Examples:**
- Removing `@UseGuards(AuthGuard)` from a protected endpoint
- Adding a wildcard route before authentication middleware
- Creating an "internal only" endpoint without authentication
- Adding a query parameter that skips auth for testing

---

## 20. Cannot Remove Audit Logging

**Rule:** Audit logging (user actions, system events, data changes) may not be removed, reduced in detail, or bypassed.

**Why:** Audit logs are essential for security investigations, compliance, debugging, and user support.

**Consequences:** HIGH severity. Audit logging must be restored. Compliance review must be triggered.

**Examples:**
- Removing `console.log` / structured log calls from service methods
- Commenting out audit event emissions
- Reducing log level to skip important events
- Removing user identification from log entries

---

## 21. Cannot Modify Encryption Standards

**Rule:** Encryption algorithms, key lengths, and hashing methods may not be downgraded or modified without security team approval.

**Why:** Weakening encryption creates security vulnerabilities that expose user data.

**Consequences:** CRITICAL severity. Encryption must be restored. Security incident report must be filed.

**Examples:**
- Replacing bcrypt with MD5 for password hashing
- Reducing HTTPS TLS version
- Removing data encryption at rest
- Storing passwords in plaintext
- Reducing encryption key length

---

## 22. Cannot Directly Access Database from Frontend

**Rule:** The frontend may never directly connect to PostgreSQL, Supabase, or Redis. All data access must go through the NestJS backend API.

**Why:** Direct database access from the frontend bypasses all authentication, authorization, validation, and business logic.

**Consequences:** CRITICAL severity. Direct access must be removed immediately. Security audit must be triggered.

---

## 23. Cannot Modify Docker Compose for Production Without Review

**Rule:** `docker-compose.yml` and individual Dockerfiles may not be modified for production use without review by an infrastructure specialist.

**Why:** Docker configuration changes can introduce security vulnerabilities, resource exhaustion, or deployment failures.

**Consequences:** HIGH severity. Changes must be reviewed and adjusted.

---

## 24. Cannot Remove Rate Limiting

**Rule:** Rate limiting on API endpoints may not be removed, increased to unreasonable levels (>1000 requests/minute), or bypassed.

**Why:** Rate limiting prevents abuse, DDoS attacks, and resource exhaustion.

**Consequences:** HIGH severity. Rate limiting must be restored. Security review must be triggered.

---

## 25. Cannot Skip Environment Checks

**Rule:** Code that checks environment variables, validates configuration, or ensures required services are running may not be removed or commented out.

**Why:** Environment checks prevent deployment to misconfigured environments, reducing downtime and errors.

**Consequences:** MEDIUM severity. Environment checks must be restored.

---

## Consequences Per Forbidden Action — Quick Reference

| # | Forbidden Action | Severity | Immediate Action | Escalation |
|---|---|---|---|---|
| 1 | Modify tech stack | CRITICAL | Revert | Agent suspension |
| 2 | Add dependencies without review | HIGH | Remove dependency | Dependency review |
| 3 | Modify schema without migration | CRITICAL | Revert | Migration required |
| 4 | Modify API contracts without versioning | CRITICAL | Revert | Versioning required |
| 5 | Simplify error handling | HIGH | Restore | Code review |
| 6 | Remove validation | HIGH | Restore | Security review |
| 7 | Skip tests | HIGH | Restore | Test review |
| 8 | Modify docs without syncing | MEDIUM | Sync docs | Documentation review |
| 9 | Delete files without approval | MEDIUM | Restore | Approval process |
| 10 | Rename files without updating imports | MEDIUM | Fix imports | Code review |
| 11 | Create generic components without spec | LOW | Use or remove | Design review |
| 12 | Modify state management without store design | MEDIUM | Document | Store review |
| 13 | Remove accessibility features | HIGH | Restore | Accessibility audit |
| 14 | Use prohibited libraries | CRITICAL | Remove | Security review |
| 15 | Inline API endpoints | LOW | Move to service | Code review |
| 16 | Hardcode secrets | CRITICAL | Rotate secret | Security incident |
| 17 | Disable TypeScript strict mode | HIGH | Restore | Code review |
| 18 | Modify WebSocket events without docs | MEDIUM | Document | Documentation review |
| 19 | Bypass authentication guards | CRITICAL | Restore | Security audit |
| 20 | Remove audit logging | HIGH | Restore | Compliance review |
| 21 | Modify encryption standards | CRITICAL | Restore | Security incident |
| 22 | Direct DB access from frontend | CRITICAL | Remove | Security audit |
| 23 | Modify Docker without review | HIGH | Review | Infrastructure review |
| 24 | Remove rate limiting | HIGH | Restore | Security review |
| 25 | Skip environment checks | MEDIUM | Restore | Code review |

---

## Reporting Violations

If you observe a forbidden action:
1. Document the violation in `project-memory/decisions/violations/` with timestamp and details.
2. Notify the architecture board via the project communication channel.
3. If CRITICAL severity, halt the affected deployment process.
4. Create a corrective task in the task tracker.
