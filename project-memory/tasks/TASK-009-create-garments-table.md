# TASK-009

# Create Garments Table

## OBJECTIVE

Create the `garments` table in PostgreSQL with all required columns, foreign keys to users, enum types for garment type and state, performance indexes, RLS policies, and soft delete support. This is the core table for managing user clothing items.

## CONTEXT FILES

- `backend/src/database/migrations/20260525_000001_create_users_table.sql`
- `backend/src/database/migrations/20260525_000007_create_garment_type_enum.sql`
- `backend/src/database/migrations/20260525_000008_create_garment_state_enum.sql`
- `backend/prisma/schema.prisma` (if using Prisma)

## ALLOWED FILES

- `backend/src/database/migrations/*.sql` (new migration file)
- `backend/prisma/schema.prisma` (if using Prisma)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any TypeScript source files except Prisma schema

## REQUIREMENTS

1. Create a migration file `20260525_000009_create_garments_table.sql`.

2. The `garments` table must have these columns:
   - `id` UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`
   - `user_id` UUID, NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE
   - `name` VARCHAR(100), NOT NULL
   - `type` garment_type, NOT NULL
   - `state` garment_state, NOT NULL, DEFAULT `'available'`
   - `brand` VARCHAR(100), nullable
   - `size` VARCHAR(50), nullable
   - `color` VARCHAR(50), nullable
   - `season` VARCHAR(50), nullable
   - `usage_count` INTEGER, NOT NULL, DEFAULT 0
   - `last_used_at` TIMESTAMP WITH TIME ZONE, nullable
   - `image_url` TEXT, nullable
   - `thumbnail_url` TEXT, nullable
   - `created_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`
   - `updated_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`
   - `deleted_at` TIMESTAMP WITH TIME ZONE, nullable

3. Create indexes:
   - `idx_garments_user_id` on `user_id` (B-tree)
   - `idx_garments_type` on `type` (B-tree) for filtering
   - `idx_garments_state` on `state` (B-tree) for filtering
   - `idx_garments_created_at` on `created_at` (B-tree) for sorting
   - `idx_garments_user_active` partial index on `user_id` WHERE `deleted_at IS NULL`
   - `idx_garments_search` GIN index on `to_tsvector('spanish', name || ' ' || COALESCE(brand, ''))` for full-text search

4. Attach the `update_updated_at_column()` trigger to `garments` as `trg_garments_updated_at`.

5. Enable RLS with policies:
   - `garments_select_own`: SELECT WHERE `user_id = current_user_id()` AND `deleted_at IS NULL`
   - `garments_insert_own`: INSERT WITH CHECK `user_id = current_user_id()`
   - `garments_update_own`: UPDATE WHERE `user_id = current_user_id()` AND `deleted_at IS NULL`
   - `garments_delete_own`: UPDATE `deleted_at` WHERE `user_id = current_user_id()` (soft delete)

## ACCEPTANCE CRITERIA

- `\d garments` shows all columns with correct types, defaults, and foreign key.
- All 6 indexes are created and listed in `pg_indexes`.
- Inserting a garment auto-sets `state` to `'available'`, `usage_count` to 0.
- The trigger automatically updates `updated_at` on row modification.
- RLS policies exist and restrict access to the owning user.
- GIN index supports full-text search queries.

## EDGE CASES

- `usage_count` must never be negative (add CHECK constraint `usage_count >= 0`).
- `last_used_at` should be NULL for garments that have never been used.
- The `size` column must accommodate various sizing systems (XS-3XL, numeric, EU, US).
- The `season` column accepts any string (spring, summer, autumn, winter, all-season).
- `image_url` and `thumbnail_url` must be TEXT to allow up to 2048+ characters.
- The partial index `idx_garments_user_active` excludes soft-deleted rows to speed up common queries.

## TESTS REQUIRED

- Integration test: Apply migration, insert a garment, verify all columns.
- Integration test: Verify foreign key constraint by inserting with invalid `user_id`.
- Integration test: Verify enum constraint by inserting invalid `type` or `state`.
- Integration test: Verify `usage_count >= 0` check constraint.
- Integration test: Verify RLS restricts access to different user.
- Integration test: Verify full-text search query uses GIN index.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000009_create_garments_table.sql`
- Updated `backend/prisma/schema.prisma` with Garment model (if using Prisma).
- Migration applied successfully.
- All indexes, triggers, and RLS verified.
