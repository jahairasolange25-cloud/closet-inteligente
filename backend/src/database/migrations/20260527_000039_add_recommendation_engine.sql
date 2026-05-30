-- Migration: 20260527_000039
-- Description: Adds embedding columns, recommendation feedback, and vector search support.

BEGIN;

-- Add embedding vector column to garments (512-dim CLIP embeddings)
ALTER TABLE garments
  ADD COLUMN IF NOT EXISTS embedding          vector(512),
  ADD COLUMN IF NOT EXISTS embedding_version  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Add style, season, usage metadata for better recommendations
ALTER TABLE garments
  ADD COLUMN IF NOT EXISTS style_tags         TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS season_tags        TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS occasion_tags      TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS color_embedding    REAL[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_embedding INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS style_embedding    REAL[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seasonality_score  REAL    DEFAULT 0.0;

-- Recommendation feedback table for ML training loop
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outfit_id       UUID REFERENCES outfits(id) ON DELETE SET NULL,
  garment_ids     UUID[] NOT NULL DEFAULT '{}',
  recommendation_type TEXT NOT NULL DEFAULT 'outfit',
  action          TEXT NOT NULL CHECK (action IN ('accepted', 'rejected', 'worn', 'saved', 'dismissed')),
  context         JSONB NOT NULL DEFAULT '{}',
  confidence_score REAL DEFAULT 0.0,
  session_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reco_feedback_user ON recommendation_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reco_feedback_action ON recommendation_feedback(user_id, action);
CREATE INDEX IF NOT EXISTS idx_reco_feedback_type ON recommendation_feedback(recommendation_type);

-- Outfit wear tracking table
CREATE TABLE IF NOT EXISTS outfit_wear_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id       UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worn_date       DATE NOT NULL,
  source          TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'recommendation', 'calendar', 'quick_wear')),
  recommendation_id UUID REFERENCES recommendation_feedback(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(outfit_id, worn_date)
);

CREATE INDEX IF NOT EXISTS idx_wear_history_user ON outfit_wear_history(user_id, worn_date DESC);
CREATE INDEX IF NOT EXISTS idx_wear_history_outfit ON outfit_wear_history(outfit_id, worn_date DESC);

-- Recommendation cache table
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  context_hash    TEXT NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]',
  total_count     INTEGER DEFAULT 0,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
  UNIQUE(user_id, context_hash)
);

CREATE INDEX IF NOT EXISTS idx_reco_cache_lookup ON recommendation_cache(user_id, context_hash, expires_at);

-- Recommendation metrics table for analytics
CREATE TABLE IF NOT EXISTS recommendation_metrics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  total_recommendations INTEGER DEFAULT 0,
  accepted_count      INTEGER DEFAULT 0,
  rejected_count      INTEGER DEFAULT 0,
  worn_count          INTEGER DEFAULT 0,
  ctr                 REAL DEFAULT 0.0,
  avg_confidence      REAL DEFAULT 0.0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create embedding similarity search index (IVFFlat for approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_garments_embedding
  ON garments
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMIT;
