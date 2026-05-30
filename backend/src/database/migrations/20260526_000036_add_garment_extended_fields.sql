-- Migration: 20260526_000036
-- Description: Adds is_favorite, pipeline_status, notes, and tags to garments table.
-- These fields are required by the frontend contract but were missing from the initial schema.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_status') THEN
    CREATE TYPE pipeline_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END$$;

ALTER TABLE garments
  ADD COLUMN IF NOT EXISTS is_favorite   BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pipeline_status pipeline_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes          TEXT,
  ADD COLUMN IF NOT EXISTS tags           TEXT[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS material       TEXT[]       NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_garments_is_favorite ON garments(user_id) WHERE is_favorite = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_garments_pipeline_status ON garments(pipeline_status) WHERE deleted_at IS NULL;

COMMIT;
