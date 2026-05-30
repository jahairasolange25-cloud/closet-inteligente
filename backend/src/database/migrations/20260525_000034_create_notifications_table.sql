-- TASK-034: Create Notifications Table
-- Migration: 20260525_000034
-- Description: Creates the notifications table for user notifications
--              with JSONB data payload, partial indexes, and RLS.

BEGIN;

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::UUID);

COMMIT;
