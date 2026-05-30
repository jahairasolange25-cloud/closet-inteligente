-- TASK-027: Create Avatars Table
-- Migration: 20260525_000027
-- Description: Creates the avatars table for user 3D avatar data,
--              body measurements, and Ready Player Me URLs.

BEGIN;

CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_body_url TEXT,
  head_url TEXT,
  height_cm DECIMAL(5,1),
  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hips_cm DECIMAL(5,1),
  inseam_cm DECIMAL(5,1),
  shoulder_width_cm DECIMAL(5,1),
  arm_length_cm DECIMAL(5,1),
  leg_length_cm DECIMAL(5,1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_avatars_user_id UNIQUE (user_id),
  CONSTRAINT ck_avatars_height_cm CHECK (height_cm > 0 AND height_cm < 300),
  CONSTRAINT ck_avatars_chest_cm CHECK (chest_cm > 0 AND chest_cm < 300),
  CONSTRAINT ck_avatars_waist_cm CHECK (waist_cm > 0 AND waist_cm < 300),
  CONSTRAINT ck_avatars_hips_cm CHECK (hips_cm > 0 AND hips_cm < 300),
  CONSTRAINT ck_avatars_inseam_cm CHECK (inseam_cm > 0 AND inseam_cm < 200),
  CONSTRAINT ck_avatars_shoulder_width_cm CHECK (shoulder_width_cm > 0 AND shoulder_width_cm < 100),
  CONSTRAINT ck_avatars_arm_length_cm CHECK (arm_length_cm > 0 AND arm_length_cm < 150),
  CONSTRAINT ck_avatars_leg_length_cm CHECK (leg_length_cm > 0 AND leg_length_cm < 150)
);

CREATE UNIQUE INDEX idx_avatars_user_id ON avatars(user_id);
CREATE INDEX idx_avatars_is_active ON avatars(is_active) WHERE is_active = true;

CREATE TRIGGER trg_avatars_updated_at
  BEFORE UPDATE ON avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY avatars_select_own ON avatars
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY avatars_insert_own ON avatars
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY avatars_update_own ON avatars
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY avatars_delete_own ON avatars
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

COMMIT;
