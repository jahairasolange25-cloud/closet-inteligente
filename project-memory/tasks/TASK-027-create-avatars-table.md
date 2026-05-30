# TASK-027

# Create Avatars Table

## OBJECTIVE

Create the `avatars` table in PostgreSQL that stores user's 3D avatar data, including body measurements and Ready Player Me URL. Each user can have only one active avatar at a time.

## CONTEXT FILES

- `backend/src/database/migrations/`
- `backend/src/database/migrations/20260525_000001_create_users_table.sql`
- `backend/prisma/schema.prisma`

## ALLOWED FILES

- `backend/src/database/migrations/*.sql` (new migration file)
- `backend/prisma/schema.prisma`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any TypeScript source files except Prisma schema

## REQUIREMENTS

1. Create a migration file `20260525_000027_create_avatars_table.sql`.

2. The `avatars` table must have these columns:
   - `id` UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`
   - `user_id` UUID, NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE, UNIQUE (one avatar per user)
   - `full_body_url` TEXT, nullable (Ready Player Me URL)
   - `head_url` TEXT, nullable (head-only URL)
   - `height_cm` DECIMAL(5,1), nullable (user height in cm)
   - `chest_cm` DECIMAL(5,1), nullable (chest measurement)
   - `waist_cm` DECIMAL(5,1), nullable (waist measurement)
   - `hips_cm` DECIMAL(5,1), nullable (hips measurement)
   - `inseam_cm` DECIMAL(5,1), nullable (inseam measurement)
   - `shoulder_width_cm` DECIMAL(5,1), nullable (shoulder width)
   - `arm_length_cm` DECIMAL(5,1), nullable (arm length)
   - `leg_length_cm` DECIMAL(5,1), nullable (leg length)
   - `is_active` BOOLEAN, NOT NULL, DEFAULT `true`
   - `created_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`
   - `updated_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`
   - `deleted_at` TIMESTAMP WITH TIME ZONE, nullable

3. Create indexes:
   - `idx_avatars_user_id` on `user_id` (unique index for fast lookup)
   - `idx_avatars_is_active` on `is_active` WHERE `is_active = true`

4. Attach the `update_updated_at_column()` trigger as `trg_avatars_updated_at`.

5. Add CHECK constraints:
   - `height_cm > 0 AND height_cm < 300`
   - `chest_cm > 0 AND chest_cm < 300`
   - `waist_cm > 0 AND waist_cm < 300`
   - `hips_cm > 0 AND hips_cm < 300`
   - `inseam_cm > 0 AND inseam_cm < 200`
   - `shoulder_width_cm > 0 AND shoulder_width_cm < 100`
   - `arm_length_cm > 0 AND arm_length_cm < 150`
   - `leg_length_cm > 0 AND leg_length_cm < 150`

6. Enable RLS with policies:
   - `avatars_select_own`: SELECT WHERE `user_id = current_user_id()`
   - `avatars_insert_own`: INSERT WITH CHECK `user_id = current_user_id()`
   - `avatars_update_own`: UPDATE WHERE `user_id = current_user_id()`
   - `avatars_delete_own`: UPDATE `deleted_at` WHERE `user_id = current_user_id()`

## ACCEPTANCE CRITERIA

- `\d avatars` shows all columns with correct types.
- The `user_id` UNIQUE constraint ensures one avatar per user.
- All CHECK constraints prevent invalid measurement values (negative, zero, or unreasonably large).
- The trigger updates `updated_at` on row modification.
- RLS policies restrict access to the owning user.
- Measurement columns allow NULL (not all measurements are required).

## EDGE CASES

- The UNIQUE constraint on `user_id` prevents multiple avatars per user; creating a new avatar must deactivate the old one (application-level logic).
- All measurement columns are optional (allow NULL) to support partial data entry.
- Decimal precision is 5 digits total with 1 decimal place (e.g., 175.5 cm).
- `full_body_url` and `head_url` are TEXT fields to accommodate long Ready Player Me URLs (can exceed 255 chars).

## TESTS REQUIRED

- Integration test: Apply migration and insert an avatar.
- Integration test: Verify UNIQUE constraint on `user_id`.
- Integration test: Verify CHECK constraints reject invalid measurements.
- Integration test: Verify RLS policies.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000027_create_avatars_table.sql`
- Updated `backend/prisma/schema.prisma` with Avatar model.
- Migration applied successfully.
