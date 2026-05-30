-- Migration: 20260525_000004
-- Creates the user_preferences table.
-- The application persists consent and notification prefs here;
-- Redis is used for fast reads with 365-day TTL cache-aside.

BEGIN;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL DEFAULT 'es',
  theme VARCHAR(20) NOT NULL DEFAULT 'system',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  analytics_consent BOOLEAN NOT NULL DEFAULT false,
  data_sharing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_prefs_select_own ON user_preferences
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_prefs_insert_own ON user_preferences
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_prefs_update_own ON user_preferences
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID)
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

COMMIT;
