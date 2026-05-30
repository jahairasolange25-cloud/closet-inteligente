-- Migration: 20260525_000003
-- Creates the audit_log table for persistent HTTP audit trail.
-- The application also appends to Redis and to daily .jsonl files;
-- this table enables long-term querying.

BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  status INTEGER NOT NULL,
  execution_ms INTEGER,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_status ON audit_log(status);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log is append-only; only admin role can query all rows.
-- Application service role bypasses RLS.
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT
  WITH CHECK (true);

COMMIT;
