-- TASK-028: Create Avatar Versions Table
-- Migration: 20260525_000028
-- Description: Creates the avatar_versions table for version history of avatars,
--              with RLS via subquery through avatars table.

BEGIN;

CREATE TABLE avatar_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  full_body_url TEXT,
  head_url TEXT,
  changes_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_avatar_version UNIQUE (avatar_id, version_number)
);

CREATE INDEX idx_avatar_versions_avatar_id ON avatar_versions(avatar_id);

ALTER TABLE avatar_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY avatar_versions_select ON avatar_versions
  FOR SELECT
  USING (avatar_id IN (SELECT id FROM avatars WHERE user_id = current_setting('app.current_user_id')::UUID));

CREATE POLICY avatar_versions_insert ON avatar_versions
  FOR INSERT
  WITH CHECK (avatar_id IN (SELECT id FROM avatars WHERE user_id = current_setting('app.current_user_id')::UUID));

CREATE POLICY avatar_versions_delete ON avatar_versions
  FOR DELETE
  USING (avatar_id IN (SELECT id FROM avatars WHERE user_id = current_setting('app.current_user_id')::UUID));

COMMIT;
