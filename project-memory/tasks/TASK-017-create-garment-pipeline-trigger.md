# TASK-017

# Create Garment AI Pipeline Trigger Service

## OBJECTIVE

Create a background service that triggers the AI garment processing pipeline after an image is uploaded. The pipeline handles background removal, garment type classification, attribute extraction, and thumbnail generation. The service manages async processing via a job queue and provides a status endpoint for polling.

## CONTEXT FILES

- `backend/src/garments/garments.service.ts`
- `backend/src/garments/garments.controller.ts`
- `backend/src/pipeline/pipeline.service.ts`
- `backend/src/pipeline/pipeline.module.ts`
- `backend/src/queue/queue.module.ts`
- `backend/src/queue/queue.service.ts`
- `backend/src/redis/redis.service.ts`

## ALLOWED FILES

- `backend/src/pipeline/pipeline.service.ts` (create)
- `backend/src/pipeline/pipeline.module.ts` (create)
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/garments.controller.ts`
- `backend/src/queue/queue.service.ts` (create if not exists)
- `backend/src/queue/queue.module.ts` (create if not exists)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/` (the Python AI code itself)
- Any database migration files

## REQUIREMENTS

1. Create `QueueService`:
   - Interface to a job queue (BullMQ with Redis, or an in-process event emitter for development).
   - `addJob(queueName: string, payload: any)` method.
   - `processJobs(queueName: string, handler: (job: any) => Promise<void>)` method.
   - For now, use an in-process event-based queue (defer BullMQ setup to later).

2. Create `PipelineService`:
   - `startPipeline(uploadId: string, garmentId: string, imageUrl: string)`:
     - Update upload status in Redis to `'processing'`.
     - Add a pipeline job to the queue with steps: `['background_removal', 'classification', 'attribute_extraction', 'thumbnail']`.
     - Return immediately (async processing).
   - `getPipelineStatus(uploadId: string)`:
     - Return current status from Redis: `{ status, steps: { step_name: { status, started_at, completed_at, error? } } }`.
   - Handle pipeline completion:
     - On success: update upload status to `'completed'`, update garment `image_url` and `thumbnail_url`, trigger a Socket.IO event.
     - On failure: update upload status to `'failed'`, store error details, trigger a Socket.IO event.

3. Create `PipelineModule`:
   - Import `QueueModule`, `GarmentsModule`, `RedisModule`.
   - Provide `PipelineService`.
   - Export `PipelineService`.

4. In `GarmentsService.upload()`:
   - After storing the temp file, call `PipelineService.startPipeline()` with the upload data.
   - The pipeline runs asynchronously; do not await it.

5. Pipeline step simulation:
   - For MVP, each step simulates processing by waiting a random delay (500ms-2000ms) and updating status.
   - The actual Python/AI integration will replace these simulations in later tasks.

## ACCEPTANCE CRITERIA

- After `POST /garments/:id/upload`, a pipeline job is queued (verify via Redis or queue inspection).
- The pipeline processes through all 4 steps (background_removal, classification, attribute_extraction, thumbnail).
- On pipeline completion, the garment's `image_url` and `thumbnail_url` are updated.
- On pipeline failure, the garment's images are not updated and status shows failure.
- The pipeline runs asynchronously and does not block the upload response.
- The `getPipelineStatus()` returns the correct progress for each step.

## EDGE CASES

- If the garment is deleted during pipeline processing, the pipeline should skip writing results (check garment existence before updating).
- If the upload job is already processing, reject new pipeline triggers for the same upload ID.
- Pipeline steps should have individual timeouts (30 seconds per step).
- If a step fails, the entire pipeline fails; do not retry automatically (manual re-trigger).
- The queue must handle concurrent pipeline executions for different garments.
- Redis status keys must have a TTL of 24 hours to auto-clean stale entries.

## TESTS REQUIRED

- Unit test: `PipelineService.startPipeline()` adds job to queue and returns immediately.
- Unit test: `PipelineService.getPipelineStatus()` returns current step statuses.
- Integration test: Full pipeline flow from upload to completion (in-process queue).
- Integration test: Pipeline failure updates status to 'failed'.
- Integration test: Garment deletion during pipeline skips updates.

## EXPECTED OUTPUT

- `backend/src/queue/queue.service.ts`
- `backend/src/queue/queue.module.ts`
- `backend/src/pipeline/pipeline.service.ts`
- `backend/src/pipeline/pipeline.module.ts`
- Updated `backend/src/garments/garments.service.ts` to trigger pipeline on upload.
- All tests pass.
