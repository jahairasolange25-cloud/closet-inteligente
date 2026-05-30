-- Migration: 20260525_000022
-- Creates the sync_log table for WebSocket conflict resolution audit.
-- Records every sync:conflict event resolution for debugging and auditing.

BEGIN;

CREATE TABLE IF NOT EXISTS sync_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  resolution_strategy VARCHAR(50) NOT NULL,
  client_version INTEGER,
  server_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_created_at ON sync_log(created_at);

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_log_select_own ON sync_log
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY sync_log_insert ON sync_log
  FOR INSERT
  WITH CHECK (true);

COMMIT;
