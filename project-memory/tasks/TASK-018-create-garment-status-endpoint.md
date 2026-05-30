# TASK-018

# Create Garment Upload Status Endpoint (GET /garments/:id/status)

## OBJECTIVE

Implement the `GET /garments/:id/status` endpoint that returns the current processing status of the garment's AI pipeline. This allows the frontend to poll for progress updates after uploading an image.

## CONTEXT FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/pipeline/pipeline.service.ts`
- `backend/src/pipeline/pipeline.module.ts`

## ALLOWED FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/pipeline/pipeline.service.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. In `PipelineService.getPipelineStatus(garmentId: string)`:
   - Query Redis for the pipeline status of the given garment ID (key: `pipeline:garment:<garmentId>`).
   - If no status found, check the garment's `image_url`:
     - If `image_url` is set and not null, return `{ status: 'completed', message: 'No active pipeline' }`.
     - If `image_url` is null and no pipeline was ever started, return `{ status: 'not_started', message: 'No upload found for this garment' }`.
   - If pipeline exists, return the full status object: `{ status, progress, steps: [{ name, status, started_at, completed_at, error? }], created_at, updated_at }`.

2. In `GarmentsController.getStatus()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string`.
   - Verify garment ownership (call `GarmentsService.findOne()` or inline check).
   - Call `PipelineService.getPipelineStatus(id)`.
   - Return HTTP 200 with status object.

3. The status response must be:
   ```json
   {
     "upload_id": "uuid",
     "status": "processing",
     "progress": 50,
     "steps": [
       { "name": "background_removal", "status": "completed", "started_at": "iso", "completed_at": "iso" },
       { "name": "classification", "status": "processing", "started_at": "iso", "completed_at": null },
       { "name": "attribute_extraction", "status": "pending", "started_at": null, "completed_at": null },
       { "name": "thumbnail", "status": "pending", "started_at": null, "completed_at": null }
     ],
     "created_at": "iso",
     "updated_at": "iso"
   }
   ```

## ACCEPTANCE CRITERIA

- `GET /garments/:id/status` for a garment with completed pipeline returns `{ status: 'completed', progress: 100, steps: all completed }`.
- `GET /garments/:id/status` during pipeline processing returns intermediate progress.
- `GET /garments/:id/status` for a failed pipeline returns `{ status: 'failed', steps: [..., { name: 'classification', status: 'failed', error: 'error details' }] }`.
- `GET /garments/:id/status` for a garment with no upload returns `{ status: 'not_started' }`.
- `GET /garments/:id/status` for another user's garment returns HTTP 404.
- `GET /garments/:id/status` without auth returns HTTP 401.

## EDGE CASES

- If the pipeline status is not in Redis but the garment has an `image_url`, assume processing is complete.
- The status endpoint must be fast (primarily Redis reads, no heavy queries).
- If Redis is down, fall back to checking the garment's `image_url` field from the database.
- Progress percentage is calculated as `(completed_steps / total_steps) * 100`.
- Steps that have not started yet should have `null` for timestamps.

## TESTS REQUIRED

- Unit test: `PipelineService.getPipelineStatus()` returns correct status for each state (pending, processing, completed, failed).
- Unit test: Fallback logic when Redis is unavailable.
- Integration test: `GET /garments/:id/status` returns 200 with valid status.
- Integration test: `GET /garments/:id/status` returns 404 for non-existent garment.
- Integration test: `GET /garments/:id/status` returns 404 for other user's garment.

## EXPECTED OUTPUT

- Updated `backend/src/pipeline/pipeline.service.ts` with `getPipelineStatus()`.
- Updated `backend/src/garments/garments.controller.ts` with `GET /garments/:id/status`.
- All tests pass.
