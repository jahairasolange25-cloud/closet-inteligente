-- TASK-020: Create Outfits Table
-- Migration: 20260525_000020
-- Description: Creates the outfits table with foreign key to users, outfit_type enum,
--              version column for optimistic concurrency, RLS policies, and soft delete.

BEGIN;

CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  type outfit_type NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT ck_outfits_version_positive CHECK (version >= 1)
);

CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_outfits_type ON outfits(type);
CREATE INDEX idx_outfits_created_at ON outfits(created_at);
CREATE INDEX idx_outfits_user_active ON outfits(user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_outfits_updated_at
  BEFORE UPDATE ON outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY outfits_select_own ON outfits
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID AND deleted_at IS NULL);

CREATE POLICY outfits_insert_own ON outfits
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY outfits_update_own ON outfits
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID AND deleted_at IS NULL);

CREATE POLICY outfits_delete_own ON outfits
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

COMMIT;
