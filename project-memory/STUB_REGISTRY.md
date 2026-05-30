# Stub Registry — Closet Inteligente Digital

> **Last Updated:** 2026-05-27 (Product Intelligence + Platform Scale Phase)
> **Purpose:** Track all stubbed, mocked, or placeholder implementations.
> Agents MUST NOT claim a stub is a real implementation.
> Each stub needs a replacement before production.

---

## ~~STUB-001: AI Pipeline Steps~~ — REPLACED 2026-05-27

**Status:** RESOLVED — `HttpAIPipelineAdapter` calls real Python FastAPI service.
**Old stub:** `SimulatedAIPipelineAdapter` (kept as fallback behind `AI_ADAPTER=simulated` env var).
**Note:** Remove `SimulatedAIPipelineAdapter` in next cleanup phase.

---

## ~~STUB-002: Job Queue (In-Memory EventEmitter)~~ — REPLACED 2026-05-26

**Status:** RESOLVED — replaced with BullMQ (Redis-backed, 3 retries, exponential backoff).

---

## ~~STUB-003: Outfit Recommendation Engine~~ — REPLACED 2026-05-27

**Status:** RESOLVED — replaced with `RecommendationService` (V2 ML-assisted ranking).
**Old heuristic:** `recommend()` in `outfits.service.ts` — kept for backward compatibility.
**New system:**
- `recommendation.service.ts` — Contextual, color, rotation, diversity scoring
- `vector-search.service.ts` — pgvector semantic similarity
- Explanation metadata with confidence scores
- Feedback loop (accepted/rejected/worn tracking)
- Recommendation metrics (CTR, rejection rate)

---

## ~~STUB-004: Thumbnail URL Generation~~ — REPLACED 2026-05-27

**Status:** RESOLVED — Python service generates real thumbnails via Pillow LANCZOS.
**Old stub:** String replacement `_thumb` suffix — removed.

---

## STUB-005: Analytics "AI Precision" Metric

**File:** `backend/src/analytics/analytics.service.ts`
**What it does:** Returns placeholder precision/recall metrics — not derived from real ML model output.
**What it needs:** Real model evaluation pipeline feeding into the analytics DB.
**Priority:** LOW — misleading but not blocking core functionality.

---

## STUB-006: CLIP Embedding Model

**File:** `python/app/services/embedding_service.py`
**What it does:** Uses ResNet50 (ImageNet pretrained) instead of actual CLIP model.
**What it needs:** OpenAI CLIP model with proper text-image joint embedding.
**Priority:** MEDIUM — ResNet50 works for visual similarity, CLIP enables cross-modal search.

---

## STUB-007: 3D Avatar Rendering

**File:** `backend/src/avatars/garment-fit.contracts.ts`
**What it does:** Defines types, skeleton mapping, layer system, and conflict rules — no running code.
**What it needs:** React Three Fiber scene, GLTF loader, garment mesh generator.
**Priority:** LOW — contracts are ready for frontend implementation.

---

## Systems That Do NOT Exist (Not Stubs — Fully Missing)

| System | Status |
|---|---|
| Full CLIP model integration | NOT STARTED |
| Cloth physics simulation | NOT STARTED |
| E2E test suite | NOT STARTED |
| Swagger/OpenAPI docs | NOT STARTED |
| PWA service worker | NOT STARTED |
| S3 storage provider impl | NOT STARTED — interface designed |
| StorageProvider abstraction impl | NOT STARTED — interface designed |
| Online learning for recs | NOT STARTED — feedback stored only |
| Collaborative filtering | NOT STARTED |
| Multi-region deployment | NOT STARTED |
