-- Migration: 20260525_000010
-- Creates the garment_images table for tracking image versions.
-- The garments table stores primary image_url/thumbnail_url;
-- this table tracks all processed image versions.

BEGIN;

CREATE TABLE IF NOT EXISTS garment_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_id UUID NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  public_id VARCHAR(500),
  format VARCHAR(20),
  width INTEGER,
  height INTEGER,
  bytes INTEGER,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_garment_images_garment_id ON garment_images(garment_id);
CREATE INDEX idx_garment_images_primary ON garment_images(garment_id) WHERE is_primary = true;

ALTER TABLE garment_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY garment_images_select_own ON garment_images
  FOR SELECT
  USING (
    garment_id IN (
      SELECT id FROM garments WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY garment_images_insert_own ON garment_images
  FOR INSERT
  WITH CHECK (
    garment_id IN (
      SELECT id FROM garments WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

COMMIT;
