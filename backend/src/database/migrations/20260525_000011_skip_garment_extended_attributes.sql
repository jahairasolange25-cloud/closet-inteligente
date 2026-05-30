-- Migration: 20260525_000011 — SKIPPED
-- Original intent: separate garment_extended_attributes table with per-garment color tags,
-- pattern detection, and AI-derived attributes as a separate 1:1 table.
-- Decision: merged into garments.detected_attributes JSONB (migration 000006).
-- This slot is intentionally a no-op.
SELECT 1;
