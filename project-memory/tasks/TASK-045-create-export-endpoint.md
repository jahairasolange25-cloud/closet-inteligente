# TASK-045

# Create Data Export Endpoints (POST /export/data and GET /export/status/:id)

## OBJECTIVE

Implement the `POST /export/data` endpoint that triggers an async export of the user's data (garments, outfits, calendar events) as a JSON file. The `GET /export/status/:id` endpoint allows polling the export progress.

## CONTEXT FILES

- `backend/src/export/export.controller.ts`
- `backend/src/export/export.service.ts`
- `backend/src/export/export.module.ts`
- `backend/src/export/dto/export-request.dto.ts`

## ALLOWED FILES

- `backend/src/export/export.controller.ts`
- `backend/src/export/export.service.ts`
- `backend/src/export/export.module.ts`
- `backend/src/export/dto/export-request.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `ExportRequestDto`:
   - `sections`: string array (optional), `@IsOptional()`, `@IsArray()`, `@ArrayMinSize(1)`, `@IsIn(['garments', 'outfits', 'calendar', 'settings'], { each: true })` — defaults to all sections.
   - `format`: string (optional), `@IsOptional()`, `@IsIn(['json', 'csv'])` — defaults to `'json'`.

2. In `ExportService.requestExport(userId: string, dto: ExportRequestDto)`:
   - Generate a unique export ID (UUID v4).
   - Store export request in Redis: `{ export_id, user_id, status: 'pending', sections, format, created_at }`.
   - Add export job to the queue (async processing).
   - Return `{ export_id, status: 'pending' }`.

3. In `ExportService.getExportStatus(exportId: string)`:
   - Retrieve export status from Redis.
   - If not found, throw `NotFoundException` with `EXPORT_NOT_FOUND`.
   - Return `{ export_id, status, progress, download_url?, created_at, completed_at?, expires_at? }`.

4. Export processing (in queue handler):
   - Query all requested sections from the database.
   - Compile into a single JSON (or CSV) object.
   - Upload the export file to Cloudinary (or store temporarily).
   - Set a download URL and expiration (24 hours).
   - Update status to `'completed'` with `download_url`.
   - On failure, update status to `'failed'` with error details.

5. In `ExportController`:
   - `POST /export/data`: Accept DTO, return 201 with export_id.
   - `GET /export/status/:id`: Return export status.

## ACCEPTANCE CRITERIA

- `POST /export/data` returns HTTP 201 with `{ export_id, status: 'pending' }`.
- `POST /export/data` with specific sections exports only those sections.
- `POST /export/data` without auth returns HTTP 401.
- `GET /export/status/:id` with valid export ID returns current status.
- `GET /export/status/:id` for completed export returns `download_url`.
- `GET /export/status/:id` for non-existent export returns HTTP 404.
- `GET /export/status/:id` for another user's export returns HTTP 404.
- The export file is available for 24 hours after completion.

## EDGE CASES

- Export with no data for requested sections should still generate a file with empty arrays.
- The export must exclude soft-deleted items by default.
- CSV format should flatten nested objects (garments within outfits) into rows.
- Large exports (many garments/outfits) must be processed asynchronously with progress tracking.
- The export file must be stored securely and only accessible via the signed download URL.
- Export IDs in Redis should have a TTL of 48 hours (24h + 24h buffer for download).

## TESTS REQUIRED

- Unit test: `ExportService.requestExport()` creates Redis entry with pending status.
- Unit test: `ExportService.getExportStatus()` returns correct status.
- Integration test: `POST /export/data` returns 201.
- Integration test: `GET /export/status/:id` returns status.
- Integration test: `GET /export/status/:id` for non-existent returns 404.

## EXPECTED OUTPUT

- `backend/src/export/dto/export-request.dto.ts`
- `backend/src/export/export.service.ts` with request/status methods.
- `backend/src/export/export.controller.ts` with both endpoints.
- All tests pass.
