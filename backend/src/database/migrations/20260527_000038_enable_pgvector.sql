-- Migration: 20260527_000038
-- Description: Enables pgvector extension for AI embeddings and similarity search.

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

COMMIT;
