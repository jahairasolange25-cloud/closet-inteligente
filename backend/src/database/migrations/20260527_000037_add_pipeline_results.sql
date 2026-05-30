-- Migration: 20260527_000037
-- Description: Adds pipeline result columns for AI/CV processing outputs.
-- Stores dominant colors, classification, confidence, and processing metadata.

BEGIN;

ALTER TABLE garments
  ADD COLUMN IF NOT EXISTS processed_image_url    TEXT,
  ADD COLUMN IF NOT EXISTS dominant_colors        JSONB    NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dominant_colors_hex    TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_classification      TEXT,
  ADD COLUMN IF NOT EXISTS ai_confidence          REAL     DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS ai_processing_duration_ms INTEGER DEFAULT 0;

ALTER TABLE garments
  ALTER COLUMN pipeline_status SET DEFAULT 'pending';

COMMIT;
