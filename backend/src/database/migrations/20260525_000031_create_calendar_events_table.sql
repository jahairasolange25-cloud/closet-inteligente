-- TASK-031: Create Calendar Events Table
-- Migration: 20260525_000031
-- Description: Creates the calendar_events table for outfit scheduling events
--              with rolling 30-day window cleanup.

BEGIN;

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
  event_date DATE NOT NULL,
  title VARCHAR(200),
  notes TEXT,
  is_worn BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_calendar_user_date_outfit UNIQUE (user_id, event_date, outfit_id)
);

CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, event_date);
CREATE INDEX idx_calendar_events_user_date_range ON calendar_events(user_id) INCLUDE (event_date);
CREATE INDEX idx_calendar_events_created_at ON calendar_events(created_at);

CREATE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_select_own ON calendar_events
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY calendar_insert_own ON calendar_events
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY calendar_update_own ON calendar_events
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY calendar_delete_own ON calendar_events
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::UUID);

COMMIT;
