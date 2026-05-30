-- TASK-019: Create PostgreSQL Enum for Outfit Type
-- Migration: 20260525_000019
-- Description: Creates the outfit_type enum with 4 values for outfit categorization.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outfit_type') THEN
    CREATE TYPE outfit_type AS ENUM (
      'casual',
      'formal',
      'office',
      'party'
    );
  END IF;
END $$;

COMMIT;
