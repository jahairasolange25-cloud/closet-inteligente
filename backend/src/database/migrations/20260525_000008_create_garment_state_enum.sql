-- TASK-008: Create PostgreSQL Enum for Garment State
-- Migration: 20260525_000008
-- Description: Creates the garment_state enum with 6 values for garment lifecycle tracking.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'garment_state') THEN
    CREATE TYPE garment_state AS ENUM (
      'available',
      'washing',
      'laundry_basket',
      'borrowed',
      'stored',
      'repair'
    );
  END IF;
END $$;

COMMIT;
