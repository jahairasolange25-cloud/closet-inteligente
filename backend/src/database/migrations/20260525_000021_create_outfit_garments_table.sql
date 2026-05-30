-- TASK-021: Create Outfit-Garments Junction Table
-- Migration: 20260525_000021
-- Description: Creates the outfit_garments junction table linking outfits to garments
--              with position constraints and unique constraints.

BEGIN;

CREATE TABLE outfit_garments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  garment_id UUID NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outfit_garments_outfit_id ON outfit_garments(outfit_id);
CREATE INDEX idx_outfit_garments_garment_id ON outfit_garments(garment_id);
CREATE INDEX idx_outfit_garments_outfit_position ON outfit_garments(outfit_id, position);

ALTER TABLE outfit_garments
  ADD CONSTRAINT uq_outfit_garment UNIQUE (outfit_id, garment_id);

ALTER TABLE outfit_garments
  ADD CONSTRAINT uq_outfit_position UNIQUE (outfit_id, position);

ALTER TABLE outfit_garments ENABLE ROW LEVEL SECURITY;

CREATE POLICY outfit_garments_select ON outfit_garments
  FOR SELECT
  USING (outfit_id IN (SELECT id FROM outfits WHERE user_id = current_setting('app.current_user_id')::UUID));

CREATE POLICY outfit_garments_insert ON outfit_garments
  FOR INSERT
  WITH CHECK (outfit_id IN (SELECT id FROM outfits WHERE user_id = current_setting('app.current_user_id')::UUID));

CREATE POLICY outfit_garments_delete ON outfit_garments
  FOR DELETE
  USING (outfit_id IN (SELECT id FROM outfits WHERE user_id = current_setting('app.current_user_id')::UUID));

COMMIT;
