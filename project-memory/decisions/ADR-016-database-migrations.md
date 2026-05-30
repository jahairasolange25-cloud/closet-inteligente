# ADR-016: Database Migrations

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform's database schema evolves continuously as new features are added: garment attribute fields, user preference extensions, AI analysis result tables, social interaction features, and performance optimization indexes. A migration system is needed to version-control schema changes, enable team collaboration on schema design, support rollback procedures for failed deployments, automate migrations in CI/CD pipelines, and maintain synchronization between local development databases, staging, and production. The migration system must work with Supabase PostgreSQL and support Row-Level Security policy management alongside schema changes.

## DECISION
We will use **raw SQL migration files** managed via Supabase's migration tooling (supabase CLI).

Migrations are written as plain SQL files in `project-memory/database/migrations/` with a sequential naming convention: `YYYYMMDDHHMMSS_description.sql`. Each migration file is a complete SQL transaction with forward migration DDL (CREATE/ALTER/DROP) and metadata (author, description, PR link) in SQL comments.

Key principles:
- **One migration per schema change** — each file represents a single atomic change
- **Idempotent patterns** — IF NOT EXISTS / IF EXISTS guards for safe re-execution
- **RLS policies in migrations** — Row-Level Security policies are versioned alongside table changes
- **Seed data** — Initial data (garment categories, size charts) in separate seed migration files
- **Rollback scripts** — Reversible migrations with a corresponding rollback SQL file (or `DROP IF EXISTS` patterns in the forward migration)

The supabase CLI provides `supabase migration new`, `supabase migration up`, and `supabase migration down` commands that integrate with the local development workflow and CI/CD pipelines. Migration status is tracked via the `_supabase_migrations` table in the database.

## CONSEQUENCES

**Positive:**
- Full SQL control — any PostgreSQL feature is accessible without ORM abstraction limitations
- RLS policies are versioned in migrations alongside schema changes, ensuring consistent security posture
- Supabase CLI integrates with local development (supabase start) for local PostgreSQL instance
- Raw SQL migration files are portable — not tied to any specific ORM or migration library
- Transactional migrations ensure atomic schema changes with rollback on failure
- Migration history is transparent — SQL files are readable by any team member familiar with PostgreSQL

**Negative:**
- No TypeScript validation — schema changes are not type-checked against application code
- Manual synchronization required between SQL schema and TypeScript types/interfaces
- No built-in ORM features (type generation, query building) — must rely on separate type generation tooling
- No migration visualization — schema changes must be reviewed by reading raw SQL
- Local Supabase instance setup is required for development migration testing
- No automated down migrations — rollbacks require manually written SQL or point-in-time database restoration

## ALTERNATIVES CONSIDERED

### Prisma Migrate
- **Pros:** Type-safe schema definition (Prisma Schema Language), auto-generated TypeScript types, visual migration history, declarative data model rather than imperative SQL, seamless integration with Prisma Client
- **Cons:** ORM abstraction layer between application and database — limits access to advanced PostgreSQL features (RLS policies, partial indexes, exclusion constraints), migration SQL is auto-generated and opaque, additional dependency in the stack, Supabase integration requires additional configuration (pgbouncer mode), adds latency for simple queries through Prisma Client overhead

### TypeORM Migrations
- **Pros:** TypeORM is already used with NestJS, decorator-based entity definitions, auto-migration generation from entity changes
- **Cons:** Migration auto-generation produces verbose, hard-to-review SQL, TypeORM's query generation can be inefficient for complex queries, less control over RLS policies and database-specific features, migration history management can become inconsistent with entity decorator drift

### Knex.js
- **Pros:** Lightweight query builder with migration system, explicit SQL control, well-documented, works with any PostgreSQL setup, programmatic seed management
- **Cons:** Additional dependency alongside the existing stack, no TypeScript type generation from schema, query builder adds abstraction without Supabase integration benefits, requires separate RLS policy management, Knex migration tracking table conflicts with Supabase's own migration tracking

## DATE
2026-05-25

## REVIEWERS
Lead Backend Engineer, Database Administrator, Tech Lead
