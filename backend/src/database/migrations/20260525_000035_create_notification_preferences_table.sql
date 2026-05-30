-- TASK-035: Create Notification Preferences Table
-- Migration: 20260525_000035
-- Description: Creates the notification_preferences table for per-user
--              notification settings with channel and type toggles.

BEGIN;

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  pipeline_complete BOOLEAN NOT NULL DEFAULT true,
  pipeline_failed BOOLEAN NOT NULL DEFAULT true,
  outfit_recommended BOOLEAN NOT NULL DEFAULT true,
  daily_reminder BOOLEAN NOT NULL DEFAULT false,
  laundry_reminder BOOLEAN NOT NULL DEFAULT false,
  system BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY preferences_select_own ON notification_preferences
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY preferences_insert_own ON notification_preferences
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY preferences_update_own ON notification_preferences
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

COMMIT;
