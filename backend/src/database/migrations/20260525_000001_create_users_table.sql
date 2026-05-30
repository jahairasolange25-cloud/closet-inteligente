-- TASK-001: Create PostgreSQL Users Table
-- Migration: 20260525_000001
-- Description: Creates the foundational users table with soft delete,
--              RLS policies, performance indexes, and updated_at trigger.

BEGIN;

-- 1. Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create trigger function for automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.* IS DISTINCT FROM NEW.*) THEN
    NEW.updated_at = NOW();
    RETURN NEW;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  avatar_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Add unique constraint on email with explicit name
ALTER TABLE users
  ADD CONSTRAINT uq_users_email UNIQUE (email);

-- 5. Create indexes
CREATE INDEX idx_users_email_unique ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_active ON users(deleted_at) WHERE deleted_at IS NULL;

-- 6. Attach trigger to users table
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
CREATE POLICY users_read_own ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = current_setting('app.current_user_id')::UUID)
  WITH CHECK (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY users_insert_register ON users
  FOR INSERT
  WITH CHECK (true);

COMMIT;
