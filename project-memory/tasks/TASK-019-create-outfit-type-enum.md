# TASK-019

# Create PostgreSQL Enum for Outfit Type

## OBJECTIVE

Create a PostgreSQL enum type `outfit_type` that defines the allowed categories for outfits on the platform. This enum is referenced by the `outfits` table to classify outfit combinations.

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

1. Create a migration file `20260525_000019_create_outfit_type_enum.sql` in `backend/src/database/migrations/`.

2. The migration must execute:
   ```sql
   DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outfit_type') THEN
       CREATE TYPE outfit_type AS ENUM (
         'casual',
         'formal',
         'office',
         'party'
       );
     END IF;
   END $$;
   ```

3. The enum values must be exactly:
   - `'casual'` — everyday, relaxed outfits
   - `'formal'` — formal events, ceremonies
   - `'office'` — business and work attire
   - `'party'` — social gatherings and parties

4. Use `DO $$ ... END $$;` block with `IF NOT EXISTS` check for idempotency.

## ACCEPTANCE CRITERIA

- `SELECT enum_range(NULL::outfit_type)` returns `{casual,formal,office,party}`.
- The enum type `outfit_type` exists in `pg_type` catalog.
- Running the migration twice does not cause an error.
- Enum values are lowercase.

## EDGE CASES

- The `IF NOT EXISTS` check must query `pg_type` catalog.
- Enum values are lowercase to match PostgreSQL convention.
- The migration must be idempotent.

## TESTS REQUIRED

- Integration test: Apply migration and verify `outfit_type` enum exists with all 4 values.
- Integration test: Apply migration a second time and verify no error.
- Integration test: Insert into a test table using the enum type.
- Integration test: Attempt invalid value and verify constraint violation.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000019_create_outfit_type_enum.sql`
- Migration applied successfully to the local development database.
- Enum verified via database inspection.
