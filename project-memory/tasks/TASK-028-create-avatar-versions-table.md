# TASK-028

# Create Avatar Versions Table

## OBJECTIVE

Create the `avatar_versions` table that stores version history for user avatars. Each avatar is limited to a maximum of 3 versions to control storage costs. Older versions are automatically pruned when the limit is exceeded.

## CONTEXT FILES

- `backend/src/database/migrations/`
- `backend/src/database/migrations/20260525_000027_create_avatars_table.sql`
- `backend/prisma/schema.prisma`

## ALLOWED FILES

- `backend/src/database/migrations/*.sql` (new migration file)
- `backend/prisma/schema.prisma`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any TypeScript source files except Prisma schema

## REQUIREMENTS

1. Create a migration file `20260525_000028_create_avatar_versions_table.sql`.

2. The `avatar_versions` table must have these columns:
   - `id` UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`
   - `avatar_id` UUID, NOT NULL, REFERENCES `avatars(id)` ON DELETE CASCADE
   - `version_number` INTEGER, NOT NULL
   - `full_body_url` TEXT, nullable
   - `head_url` TEXT, nullable
   - `changes_description` TEXT, nullable (summary of what changed)
   - `created_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`

3. Create indexes:
   - `idx_avatar_versions_avatar_id` on `avatar_id`
   - `uq_avatar_version` UNIQUE on `(avatar_id, version_number)`

4. Enable RLS:
   - Same policy pattern as `avatars`, using subquery through `avatars` to check user ownership.

5. Create a database trigger or handle at the application level to enforce the max 3 versions per avatar (application-level enforcement is preferred for this task).

## ACCEPTANCE CRITERIA

- `\d avatar_versions` shows all columns with correct types and foreign key.
- The UNIQUE constraint prevents duplicate version numbers for the same avatar.
- `ON DELETE CASCADE` removes all versions when an avatar is deleted.
- Multiple versions can exist for the same avatar, up to the application-enforced limit of 3.
- RLS prevents access to other users' avatar versions.

## EDGE CASES

- Version numbers start at 1 and increment sequentially per avatar.
- When a new version is created and the count exceeds 3, the oldest version should be automatically deleted.
- The `changes_description` field is optional and can store a human-readable summary (e.g., "Updated body measurements").
- If an avatar is soft-deleted, its versions should remain (accessible only if avatar is restored).
- The UNIQUE constraint on `(avatar_id, version_number)` prevents accidental duplicate version creation.

## TESTS REQUIRED

- Integration test: Apply migration and insert avatar versions.
- Integration test: Verify UNIQUE constraint on (avatar_id, version_number).
- Integration test: Verify CASCADE delete when avatar is deleted.
- Integration test: Verify max 3 versions enforcement (application-level).
- Integration test: Verify RLS policies.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000028_create_avatar_versions_table.sql`
- Updated `backend/prisma/schema.prisma` with AvatarVersion model.
- Migration applied successfully.
