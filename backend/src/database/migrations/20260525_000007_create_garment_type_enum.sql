-- TASK-007: Create PostgreSQL Enum for Garment Type
-- Migration: 20260525_000007
-- Description: Creates the garment_type enum with 8 values for garment categorization.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'garment_type') THEN
    CREATE TYPE garment_type AS ENUM (
      'shirt',
      'pants',
      'shoes',
      'jackets',
      'accessories',
      'dresses',
      'sportswear',
      'formalwear'
    );
  END IF;
END $$;

COMMIT;
