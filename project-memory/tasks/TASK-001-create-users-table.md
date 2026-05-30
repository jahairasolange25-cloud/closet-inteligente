# TASK-001

# Create PostgreSQL Users Table

## OBJECTIVE

Create the foundational `users` table in the PostgreSQL database schema with soft delete support, row-level security policies, performance indexes, and an automatic `updated_at` trigger. This table stores all registered user accounts for the Closet Inteligente Digital platform.

## CONTEXT FILES

- `backend/prisma/schema.prisma` (or `backend/src/database/migrations/` if using raw SQL)
- `backend/.env` (database connection configuration)
- `backend/src/database/database.module.ts`

## ALLOWED FILES

- `backend/prisma/schema.prisma`
- `backend/src/database/migrations/*.sql` (new migration file)
- `backend/src/database/database.module.ts`
- `backend/src/users/users.module.ts` (if creating a module file)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any file outside `backend/`
- Existing migration files that are not being extended

## REQUIREMENTS

1. Create a `users` table with the following columns:
   - `id` UUID type, primary key, defaults to `gen_random_uuid()`
   - `email` VARCHAR(255), NOT NULL, UNIQUE
   - `password_hash` VARCHAR(255), NOT NULL
   - `full_name` VARCHAR(150), NOT NULL
   - `avatar_url` TEXT, nullable
   - `created_at` TIMESTAMP WITH TIME ZONE, NOT NULL, defaults to `NOW()`
   - `updated_at` TIMESTAMP WITH TIME ZONE, NOT NULL, defaults to `NOW()`
   - `deleted_at` TIMESTAMP WITH TIME ZONE, nullable (soft delete)

2. Create a unique index on `email` (the UNIQUE constraint already provides this; ensure it is explicitly named `idx_users_email_unique`).

3. Create a B-tree index on `created_at` for sorting queries, named `idx_users_created_at`.

4. Create a partial index on `deleted_at` to filter out soft-deleted records, named `idx_users_active` with condition `WHERE deleted_at IS NULL`.

5. Create a trigger function `update_updated_at_column()` that sets `updated_at = NOW()` on every row update. Attach this trigger to the `users` table as `trg_users_updated_at`.

6. Enable Row-Level Security (RLS) on the `users` table:
   - Policy `users_read_own`: Allows `SELECT` where `id = current_user_id()` (the authenticated user UUID).
   - Policy `users_update_own`: Allows `UPDATE` where `id = current_user_id()`.
   - Policy `users_insert_register`: Allows `INSERT` during registration (use a role-based check or allow authenticated).

7. Write the migration as a raw SQL file in `backend/src/database/migrations/` with timestamp prefix, e.g., `20260525_000001_create_users_table.sql`.

8. If using Prisma, define the model in `schema.prisma` with proper field mappings and generate the migration via `npx prisma migrate dev --name create_users_table`.

## ACCEPTANCE CRITERIA

- The migration runs successfully without errors.
- `SELECT * FROM users` returns an empty set (table exists).
- `\d users` shows all columns with correct types and defaults.
- `\d idx_users_email_unique` shows an inique index.
- `\d idx_users_created_at` shows a B-tree index.
- `\d idx_users_active` shows a partial index.
- Updating a row automatically updates `updated_at` (verify with `SELECT now() - updated_at` before and after).
- Soft-deleted rows (with `deleted_at` set) are excluded from active queries using `WHERE deleted_at IS NULL`.
- RLS policies are active: `SELECT pg_policies() WHERE tablename = 'users'` shows three policies.

## EDGE CASES

- Ensure the `id` column uses `gen_random_uuid()` (PostgreSQL 13+) not `uuid_generate_v4()` (requires extension).
- The `email` column must be case-sensitive; store as-is, do not lowercase automatically.
- `avatar_url` must allow NULL and up to 2048 characters (use TEXT).
- The trigger must not fire on `deleted_at` updates that are performed by soft-delete operations (use `IF (OLD.* IS DISTINCT FROM NEW.*)` check).
- Concurrent inserts with same email must be caught by the unique constraint, not by application logic.

## TESTS REQUIRED

- Unit test: Verify SQL migration syntax with a dry-run against a test PostgreSQL instance.
- Integration test: Apply migration, insert a user, verify all columns are populated.
- Integration test: Attempt duplicate email insert, expect unique constraint violation.
- Integration test: Update a user, verify `updated_at` changes.
- Integration test: Soft-delete a user, verify `SELECT` without `WHERE deleted_at IS NULL` still returns the row.

## EXPECTED OUTPUT

- A new SQL migration file at `backend/src/database/migrations/20260525_000001_create_users_table.sql` containing the complete DDL.
- If using Prisma: updated `backend/prisma/schema.prisma` with the User model and a generated migration.
- Migration is applied to the local development database.
- All indexes and the trigger are verified existing via `psql` or a database inspection tool.
