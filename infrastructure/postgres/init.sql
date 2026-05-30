-- PostgreSQL initialization script for Closet Inteligente
-- Runs once when the database container is first created.

-- Extensions required by the application
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- pg_trgm enables fuzzy text search (used in garment search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Notify
DO $$
BEGIN
  RAISE NOTICE 'Closet Inteligente database initialized with required extensions.';
END $$;
