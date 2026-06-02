-- Migration: 20260602_000040
-- Description: Replace blanket UNIQUE(user_id) on avatars with a partial unique
--              index scoped to active, non-deleted rows. The create service
--              deactivates the previous avatar before inserting a new one, but
--              the old constraint fired on ALL rows regardless of is_active,
--              causing a unique-violation 500 on every re-creation attempt.

BEGIN;

-- Drop the redundant unique index created alongside the constraint
DROP INDEX IF EXISTS idx_avatars_user_id;

-- Drop the blanket unique constraint
ALTER TABLE avatars DROP CONSTRAINT IF EXISTS uq_avatars_user_id;

-- Partial unique index: only one active+non-deleted avatar per user
CREATE UNIQUE INDEX idx_avatars_user_id_active
  ON avatars(user_id)
  WHERE is_active = true AND deleted_at IS NULL;

COMMIT;
