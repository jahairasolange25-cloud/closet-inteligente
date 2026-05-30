# TASK-020

# Create Outfits Table

## OBJECTIVE

Create the `outfits` table in PostgreSQL that stores user-created outfit combinations. Each outfit has a name, type classification, completion status, version counter for optimistic concurrency, and soft delete support.

## CONTEXT FILES

- `backend/src/database/migrations/`
- `backend/src/database/migrations/20260525_000001_create_users_table.sql`
- `backend/src/database/migrations/20260525_000019_create_outfit_type_enum.sql`
- `backend/prisma/schema.prisma` (if using Prisma)

## ALLOWED FILES

- `backend/src/database/migrations/*.sql` (new migration file)
- `backend/prisma/schema.prisma` (if using Prisma)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any TypeScript source files except Prisma schema

## REQUIREMENTS

1. Create a migration file `20260525_000020_create_outfits_table.sql`.

2. The `outfits` table must have these columns:
   - `id` UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`
   - `user_id` UUID, NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE
   - `name` VARCHAR(150), NOT NULL
   - `type` outfit_type, NOT NULL
   - `is_complete` BOOLEAN, NOT NULL, DEFAULT `false`
   - `version` INTEGER, NOT NULL, DEFAULT 1
   - `created_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`
   - `updated_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`
   - `deleted_at` TIMESTAMP WITH TIME ZONE, nullable

3. Create indexes:
   - `idx_outfits_user_id` on `user_id` (B-tree)
   - `idx_outfits_type` on `type` (B-tree)
   - `idx_outfits_created_at` on `created_at` (B-tree)
   - `idx_outfits_user_active` partial index on `user_id` WHERE `deleted_at IS NULL`

4. Attach the `update_updated_at_column()` trigger to `outfits` as `trg_outfits_updated_at`.

5. Add a CHECK constraint: `version >= 1`.

6. Enable RLS with policies:
   - `outfits_select_own`: SELECT WHERE `user_id = current_user_id()` AND `deleted_at IS NULL`
   - `outfits_insert_own`: INSERT WITH CHECK `user_id = current_user_id()`
   - `outfits_update_own`: UPDATE WHERE `user_id = current_user_id()` AND `deleted_at IS NULL`
   - `outfits_delete_own`: UPDATE `deleted_at` WHERE `user_id = current_user_id()` (soft delete)

## ACCEPTANCE CRITERIA

- `\d outfits` shows all columns with correct types, defaults, and foreign key.
- All 4 indexes are created.
- `version` defaults to 1 on insert.
- `is_complete` defaults to `false` on insert.
- The trigger automatically updates `updated_at`.
- RLS policies restrict access to the owning user.
- The CHECK constraint prevents `version` from being 0 or negative.

## EDGE CASES

- `version` is used for optimistic concurrency control (incremented on every update).
- `is_complete` is set to `true` when the outfit has at least one upper garment and one lower garment (enforced by application logic, not DB constraint).
- The `name` column allows up to 150 characters.
- The `type` enum constraint prevents invalid type values at the database level.

## TESTS REQUIRED

- Integration test: Apply migration, insert an outfit, verify all columns.
- Integration test: Verify foreign key constraint.
- Integration test: Verify `version` defaults to 1.
- Integration test: Verify `is_complete` defaults to `false`.
- Integration test: Verify CHECK constraint prevents `version = 0`.
- Integration test: Verify RLS policies.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000020_create_outfits_table.sql`
- Updated `backend/prisma/schema.prisma` with Outfit model (if using Prisma).
- Migration applied successfully.
- All indexes, trigger, and RLS verified.
