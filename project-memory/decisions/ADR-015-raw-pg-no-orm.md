# ADR-015: Use Raw pg Driver (No ORM)

## STATUS
Accepted

## DATE
2026-05-25 (documents a decision already implemented)

## CONTEXT
The initial CHANGELOG v0.1.0 entry for ADR-001 stated "Use NestJS with TypeORM for backend architecture." The actual implementation diverged: all database access uses the raw `pg` (node-postgres) driver with hand-written SQL. No ORM (TypeORM, Prisma, or otherwise) is present in the codebase.

## DECISION
Use raw `pg` (node-postgres) with a shared `Pool` injected via `DATABASE_POOL` token. All queries are hand-written SQL strings. No ORM or query builder is used.

## CONSEQUENCES

**Positive:**
- Full control over SQL — no ORM abstraction leaking into queries
- No migration framework lock-in (migrations are plain `.sql` files)
- Smaller dependency footprint
- Predictable query behavior; no N+1 surprises from lazy loading

**Negative:**
- No auto-generated migrations from entity changes
- DTO ↔ DB mapping is manual
- Refactoring column names requires grep across all query strings
- No built-in pagination helpers or soft-delete support (must be implemented per-query)

## SUPERSEDES
ADR-001 (frontend framework ADR — the TypeORM reference in the v0.1.0 CHANGELOG was incorrectly associated with ADR-001 content; this ADR formally documents the actual backend ORM decision).

## REFERENCES
- `backend/src/database/database.module.ts` — `DATABASE_POOL` injection token
- `backend/src/garments/garments.service.ts` — example raw SQL usage
