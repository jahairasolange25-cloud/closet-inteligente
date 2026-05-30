# TASK-021

# Create Outfit-Garments Junction Table

## OBJECTIVE

Create the `outfit_garments` junction table that links outfits to their constituent garments. Each link includes a position indicator (1-6) to preserve garment ordering within an outfit. A unique constraint prevents duplicate garment assignments.

## CONTEXT FILES

- `backend/src/database/migrations/`
- `backend/src/database/migrations/20260525_000009_create_garments_table.sql`
- `backend/src/database/migrations/20260525_000020_create_outfits_table.sql`
- `backend/prisma/schema.prisma` (if using Prisma)

## ALLOWED FILES

- `backend/src/database/migrations/*.sql` (new migration file)
- `backend/prisma/schema.prisma` (if using Prisma)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any TypeScript source files except Prisma schema

## REQUIREMENTS

1. Create a migration file `20260525_000021_create_outfit_garments_table.sql`.

2. The `outfit_garments` table must have these columns:
   - `id` UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`
   - `outfit_id` UUID, NOT NULL, REFERENCES `outfits(id)` ON DELETE CASCADE
   - `garment_id` UUID, NOT NULL, REFERENCES `garments(id)` ON DELETE CASCADE
   - `position` INTEGER, NOT NULL, CHECK (`position` BETWEEN 1 AND 6)
   - `created_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`

3. Create indexes:
   - `idx_outfit_garments_outfit_id` on `outfit_id`
   - `idx_outfit_garments_garment_id` on `garment_id`
   - `idx_outfit_garments_outfit_position` on `(outfit_id, position)` for ordering queries

4. Create unique constraints:
   - `uq_outfit_garment` UNIQUE on `(outfit_id, garment_id)` — prevents same garment from being added twice to the same outfit
   - `uq_outfit_position` UNIQUE on `(outfit_id, position)` — prevents two garments from occupying the same position

5. Enable RLS:
   - RLS on `outfit_garments` must be enabled.
   - Policies must use the owning user from the `outfits` table (subquery):
     - `outfit_garments_select`: SELECT WHERE `outfit_id IN (SELECT id FROM outfits WHERE user_id = current_user_id())`
     - `outfit_garments_insert`: INSERT WITH CHECK `outfit_id IN (SELECT id FROM outfits WHERE user_id = current_user_id())`
     - `outfit_garments_delete`: DELETE WHERE `outfit_id IN (SELECT id FROM outfits WHERE user_id = current_user_id())`

## ACCEPTANCE CRITERIA

- `\d outfit_garments` shows all columns with correct types and foreign keys.
- Both UNIQUE constraints are created and enforced.
- Inserting a garment at position 0 or 7 returns a CHECK constraint violation.
- Inserting the same garment twice into the same outfit returns a unique constraint violation.
- Inserting two garments at the same position in the same outfit returns a unique constraint violation.
- RLS prevents a user from accessing another user's outfit_garments.
- Deleting an outfit cascades to delete its `outfit_garments` entries.

## EDGE CASES

- The `position` CHECK constraint uses `BETWEEN 1 AND 6` to enforce exactly 1-6 garments.
- `ON DELETE CASCADE` ensures that when an outfit is deleted, its garment associations are also removed.
- `ON DELETE CASCADE` also applies to garments (if a garment is deleted, it is removed from all outfits).
- The unique constraint `uq_outfit_position` prevents two garments from sharing the same position slot.
- The unique constraint `uq_outfit_garment` prevents a garment from appearing twice in the same outfit (but the same garment can appear in different outfits).

## TESTS REQUIRED

- Integration test: Apply migration, insert outfit_garment, verify.
- Integration test: Verify both UNIQUE constraints.
- Integration test: Verify CHECK constraint (position 1-6).
- Integration test: Verify CASCADE delete on outfit deletion.
- Integration test: Verify CASCADE delete on garment deletion.
- Integration test: Verify RLS policies.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000021_create_outfit_garments_table.sql`
- Updated `backend/prisma/schema.prisma` with OutfitGarment model (if using Prisma).
- Migration applied successfully.
