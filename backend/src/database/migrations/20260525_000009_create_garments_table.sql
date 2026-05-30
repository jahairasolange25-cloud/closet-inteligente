-- TASK-009: Create Garments Table
-- Migration: 20260525_000009
-- Description: Creates the garments table with foreign key to users, enum types,
--              performance indexes, full-text search, RLS policies, and soft delete.

BEGIN;

CREATE TABLE garments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type garment_type NOT NULL,
  state garment_state NOT NULL DEFAULT 'available',
  brand VARCHAR(100),
  size VARCHAR(50),
  color VARCHAR(50),
  season VARCHAR(50),
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  image_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subcategory VARCHAR(100),
  notes TEXT,
  materials TEXT[],
  tags TEXT[],
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  processing_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  detected_attributes JSONB,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT ck_garments_usage_count_non_negative CHECK (usage_count >= 0)
);

CREATE INDEX idx_garments_user_id ON garments(user_id);
CREATE INDEX idx_garments_type ON garments(type);
CREATE INDEX idx_garments_state ON garments(state);
CREATE INDEX idx_garments_created_at ON garments(created_at);
CREATE INDEX idx_garments_user_active ON garments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_garments_search ON garments
  USING GIN (to_tsvector('spanish', name || ' ' || COALESCE(brand, '')));
CREATE INDEX idx_garments_is_favorite ON garments(user_id, is_favorite) WHERE deleted_at IS NULL;
CREATE INDEX idx_garments_processing_status ON garments(processing_status);
CREATE INDEX idx_garments_tags ON garments USING GIN(tags);

CREATE TRIGGER trg_garments_updated_at
  BEFORE UPDATE ON garments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE garments ENABLE ROW LEVEL SECURITY;

CREATE POLICY garments_select_own ON garments
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID AND deleted_at IS NULL);

CREATE POLICY garments_insert_own ON garments
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY garments_update_own ON garments
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID AND deleted_at IS NULL);

CREATE POLICY garments_delete_own ON garments
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

COMMIT;
