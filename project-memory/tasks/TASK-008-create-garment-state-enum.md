# TASK-008

# Create PostgreSQL Enum for Garment State

## OBJECTIVE

Create a PostgreSQL enum type `garment_state` that defines the allowed lifecycle states for garments on the platform. This enum is referenced by the `garments` table to track whether a garment is available, in laundry, borrowed, stored, etc.

## CONTEXT FILES

- `backend/src/database/migrations/` (existing migrations)
- `backend/prisma/schema.prisma` (if using Prisma)

## ALLOWED FILES

- `backend/src/database/migrations/*.sql` (new migration file)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any TypeScript source files except the migration
- `backend/src/app.module.ts`

## REQUIREMENTS

1. Create a migration file `20260525_000008_create_garment_state_enum.sql` in `backend/src/database/migrations/`.

2. The migration must execute:
   ```sql
   DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'garment_state') THEN
       CREATE TYPE garment_state AS ENUM (
         'available',
         'washing',
         'laundry_basket',
         'borrowed',
         'stored',
         'repair'
       );
     END IF;
   END $$;
   ```

3. The enum values must be exactly:
   - `'available'` — garment is clean and ready to wear
   - `'washing'` — garment is currently being washed
   - `'laundry_basket'` — garment is dirty and waiting to be washed
   - `'borrowed'` — garment has been lent to someone else
   - `'stored'` — garment is in off-season storage
   - `'repair'` — garment needs fixing

4. Use `DO $$ ... END $$;` block with `IF NOT EXISTS` check for idempotency.

## ACCEPTANCE CRITERIA

- `SELECT enum_range(NULL::garment_state)` returns `{available,washing,laundry_basket,borrowed,stored,repair}`.
- The enum type `garment_state` exists in `pg_type` catalog.
- Running the migration twice does not cause an error.

## EDGE CASES

- The `IF NOT EXISTS` check must query `pg_type` catalog.
- Enum values are lowercase and use snake_case for multi-word values (e.g., `laundry_basket`).
- The enum order is alphabetical for clarity, but no ordering semantics should be assumed.
- Adding new states in the future must use `ALTER TYPE ... ADD VALUE` (outside this task scope).

## TESTS REQUIRED

- Integration test: Apply migration and verify `garment_state` enum exists with all 6 values.
- Integration test: Apply migration a second time and verify no error.
- Integration test: Insert a row into a test table using the enum and verify.
- Integration test: Attempt invalid value and verify constraint violation.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000008_create_garment_state_enum.sql`
- Migration applied successfully to the local development database.
- Enum verified via database inspection.
