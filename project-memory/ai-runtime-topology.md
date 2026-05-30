# AI Runtime Topology — Closet Inteligente Digital

> Last Updated: 2026-05-27
> Documents: Upload lifecycle, processing lifecycle, retry behavior, failure behavior, cleanup lifecycle.

---

## Infrastructure Topology (Updated)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Internet / User Browser                                              │
│  Next.js frontend :3000 (not yet containerized)                       │
└──────────────────────────┬────────────────────────────────────────────┘
                           │ HTTP + WebSocket
┌──────────────────────────▼────────────────────────────────────────────┐
│  NestJS Backend :4000                                                 │
│  ├── REST API: /api/v1/*                                              │
│  ├── WebSocket: /ws  (Socket.IO)                                      │
│  ├── Health: /health                                                  │
│  └── Correlation-ID middleware (X-Request-ID on all routes)           │
│                                                                       │
│  ├── PostgreSQL (via pg Pool)  :5432                                  │
│  ├── Redis (ioredis + BullMQ)  :6379                                  │
│  ├── Cloudinary (external CDN)  HTTPS                                 │
│  └── AI Service HTTP client → closet-ai:5100                          │
└──────────────────────┬────────────────────────────────────────────────┘
                       │ HTTP (internal Docker network)
┌──────────────────────▼────────────────────────────────────────────────┐
│  Python AI Service (FastAPI) :5100                                    │
│  ├── REST API: /api/v1/pipeline/*                                     │
│  ├── REST API: /api/v1/process/*                                      │
│  ├── Health: /health                                                  │
│  │                                                                    │
│  ├── Processors:                                                      │
│  │   ├── background removal (rembg)                                   │
│  │   ├── thumbnail generation (Pillow)                                │
│  │   ├── color extraction (OpenCV k-means)                            │
│  │   ├── metadata extraction                                          │
│  │   └── heuristic classification (V1)                                │
│  │                                                                    │
│  └── Storage: shared /app/uploads volume with backend                 │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Upload Lifecycle

```
USER UPLOADS GARMENT IMAGE
──────────────────────────
1. Frontend submits FormData → POST /api/v1/garments/:id/upload
2. FileMagicPipe validates MIME via magic bytes
3. StorageService.uploadTemp() → writes to local /app/uploads/temp/
4. GarmentsService.upload() → stores upload metadata in Redis
5. PipelineService.startPipeline() → enqueues BullMQ job
6. Returns { upload_id, status: "pending" } to client
```

---

## Processing Lifecycle

```
PIPELINE PROCESSING (BullMQ worker → Python AI Service)
────────────────────────────────────────────────────────
1. QueueService worker receives 'pipeline' job
2. PipelineService.processPipeline(uploadId):
   ├── Reads PipelineStatus from Redis
   ├── Sets status = 'processing'
   │
   ├── [HttpAIPipelineAdapter] POST /api/v1/pipeline/full
   │   └── Python service:
   │       ├── Downloads image from temp_url (httpx)
   │       ├── Background removal (rembg) → transparent PNG
   │       ├── Classification (heuristic V1) → category + confidence
   │       ├── Color extraction (OpenCV k-means) → top 5 HEX colors
   │       ├── Metadata extraction → width, height, ratio, size, mime
   │       └── Thumbnail generation (Pillow) → 300px thumb + 800px preview
   │
   ├── On success:
   │   ├── status = 'completed'
   │   ├── Persist results to PostgreSQL (dominant_colors, ai_classification, etc.)
   │   ├── Update pipeline_status in garments table
   │   └── Save PipelineStatus to Redis
   │
   └── On failure:
       ├── status = 'failed'
       ├── Set error message
       ├── Save PipelineStatus to Redis with error
       ├── Update pipeline_status = 'failed' in garments table
       └── Temp files cleaned up

CLIENT POLLING
──────────────
GET /api/v1/garments/:id/status
  → Redis: get pipeline:garment:{garmentId} → uploadId
  → Redis: get pipeline:{uploadId} → PipelineStatus JSON
  → Returns { status, progress, steps, created_at, updated_at }
```

---

## Retry Behavior

| Level | Attempts | Backoff | Trigger |
|---|---|---|---|
| HTTP call to AI service | 3 (1 initial + 2 retries) | Exponential: 500ms → 1s → 2s | Connection error, timeout, 5xx response |
| Circuit breaker | Opens after 5 failures | 30s cooldown | Consecutive failures |
| BullMQ job | 3 attempts (configured in QueueService) | Exponential: 2s → 4s → 8s | Unhandled exception in processPipeline |
| Per-stage timeout | 1 | N/A | Step exceeds 30s timeout |
| Global timeout | 1 | N/A | Full pipeline exceeds 120s timeout |

Non-retryable errors (immediate failure):
- 4xx responses from AI service (invalid image, bad request)
- Invalid image format
- Circuit breaker open

---

## Failure Behavior

| Failure Mode | Behavior | Recovery |
|---|---|---|
| AI service unreachable | 3 retries → circuit breaker opens | Circuit resets after 30s cooldown |
| Step timeout (30s) | Stage marked failed, pipeline fails | Re-upload triggers new pipeline |
| Global timeout (120s) | Pipeline marked failed | Re-upload triggers new pipeline |
| Image download fails | Pipeline fails immediately | Retry with valid image |
| Invalid image (corrupted) | Pipeline fails in preprocessing | Frontend shows validation error |
| AI service returns 5xx | Retries 2 times then fails | Manual re-upload |
| AI service returns 4xx | Immediate failure (no retry) | Fix image/request |

---

## Cleanup Lifecycle

```
TEMP FILE CLEANUP
─────────────────
1. Upload: StorageService.uploadTemp() → /app/uploads/temp/{uuid}.{ext}
2. Processing: Python service downloads → /app/uploads/temp/{garment_id}_{uuid}.png
3. Processing: Removed BG → /app/uploads/temp/{garment_id}_nobg_{uuid}.png
4. Processing: Thumbnails → /app/uploads/temp/{garment_id}_thumb.png
5. Processing: Preview → /app/uploads/temp/{garment_id}_preview.png
6. Pipeline complete/failed → file_manager.cleanup() removes all temp files

REDIS TTL CLEANUP
─────────────────
- pipeline:{uploadId} → 86400s (24h) TTL
- pipeline:garment:{garmentId} → 86400s (24h) TTL
- upload:{uploadId} → 86400s (24h) TTL

PERSISTED DATA (survives cleanup):
- garment.image_url → final image (Cloudinary or permanent)
- garment.thumbnail_url → thumbnail
- garment.processed_image_url → background-removed image
- garment.dominant_colors → JSONB array
- garment.dominant_colors_hex → TEXT[] array
- garment.ai_classification → string
- garment.ai_confidence → float
- garment.ai_processing_duration_ms → integer
```
