# TASK-007

# Create PostgreSQL Enum for Garment Type

## OBJECTIVE

Create a PostgreSQL enum type `garment_type` that defines the allowed categories for garments on the platform. This enum is referenced by the `garments` table and enforces data integrity at the database level.

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

1. Create a migration file `20260525_000007_create_garment_type_enum.sql` in `backend/src/database/migrations/`.

2. The migration must execute:
   ```sql
   DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'garment_type') THEN
       CREATE TYPE garment_type AS ENUM (
         'shirt',
         'pants',
         'shoes',
         'jackets',
         'accessories',
         'dresses',
         'sportswear',
         'formalwear'
       );
     END IF;
   END $$;
   ```

3. The enum values must be exactly:
   - `'shirt'`
   - `'pants'`
   - `'shoes'`
   - `'jackets'`
   - `'accessories'`
   - `'dresses'`
   - `'sportswear'`
   - `'formalwear'`

4. Use `DO $$ ... END $$;` block with `IF NOT EXISTS` check to make the migration idempotent.

## ACCEPTANCE CRITERIA

- `SELECT enum_range(NULL::garment_type)` returns `{shirt,pants,shoes,jackets,accessories,dresses,sportswear,formalwear}`.
- The enum type `garment_type` exists in `pg_type` catalog.
- Running the migration twice does not cause an error (idempotent).

## EDGE CASES

- The `IF NOT EXISTS` check must query `pg_type` catalog, not rely on a custom table.
- Enum values are lowercase to match PostgreSQL convention and to match the application code constants.
- If the migration is run on a database that already has the enum (from a previous manual creation), it must succeed without error.

## TESTS REQUIRED

- Integration test: Apply migration and verify `garment_type` enum exists with all values.
- Integration test: Apply migration a second time and verify no error occurs.
- Integration test: Insert a row into a test table using the enum type and verify it stores correctly.
- Integration test: Attempt to insert an invalid enum value and verify constraint error.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000007_create_garment_type_enum.sql`
- Migration applied successfully to the local development database.
- Enum verified via `psql` or database inspection.
