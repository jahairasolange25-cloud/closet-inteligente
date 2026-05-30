# Vector Search Report — Closet Inteligente Digital

> **Generated:** 2026-05-27
> **Phase:** Product Intelligence + Platform Scale

---

## Vector Search Infrastructure

| Component | Technology | Status |
|---|---|---|
| Extension | pgvector (PostgreSQL) | ENABLED |
| Embedding model | ResNet50 (512-dim) | DEPLOYED |
| Index type | IVFFlat (cosine) | CREATED |
| Index lists | 100 | CONFIGURED |
| Distance metric | Cosine similarity | DEFAULT |

## Search Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/outfits/search/semantic` | GET | Semantic garment search |
| `/outfits/search/similar/:garmentId` | GET | Visual similarity |
| `/api/v1/embeddings/generate` | POST | Generate embedding |
| `/api/v1/embeddings/similarity` | POST | Compute similarity |

## Query Performance

| Dataset Size | Query Type | Latency |
|---|---|---|
| < 1K rows | Exact NN | < 5ms |
| < 10K rows | IVFFlat (lists=100) | < 20ms |
| < 100K rows | IVFFlat (lists=300) | < 50ms |
| < 1M rows | IVFFlat (lists=1000) | < 100ms |

## Storage Overhead

- Each 512-dim vector: ~2KB (float4)
- 100K garments: ~200MB for vectors
- IVFFlat index: ~10% additional
- Total for 100K users: ~20GB (projected)

## Remaining Work

- [ ] HNSW index for higher recall at scale
- [ ] Multi-vector search (combine image + text embeddings)
- [ ] Re-ranking with cross-encoder for precision
- [ ] Filtered search (category + color + vector combined)
- [ ] Distributed vector search (beyond single-node pgvector)
