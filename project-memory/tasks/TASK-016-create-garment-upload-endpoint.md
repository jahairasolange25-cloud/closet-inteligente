# TASK-016

# Create Garment Image Upload Endpoint (POST /garments/:id/upload)

## OBJECTIVE

Implement the `POST /garments/:id/upload` endpoint that accepts an image file upload for a garment. The endpoint validates file type and size, stores the file temporarily, and returns an upload ID that the client can use to poll processing status.

## CONTEXT FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/garments.module.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/storage.module.ts`
- `backend/package.json` (check for multer, @types/multer, sharp, cloudinary)

## ALLOWED FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/dto/upload-garment.dto.ts` (create)
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/storage.module.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Configure file upload handling in the controller:
   - Use `@UseInterceptors(FileInterceptor('file'))` from `@nestjs/platform-express`.
   - Configure multer with `MulterModule.register()` or use a custom `FileInterceptor`.
   - Disk storage or memory storage (prefer memory for Cloudinary uploads).

2. Create file validation (can be a custom `FileValidator` or pipe):
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/heic`, `image/webp`.
   - Maximum file size: 10 MB (`1024 * 1024 * 10` bytes).
   - Reject with HTTP 400 and `INVALID_FILE_TYPE` if MIME type is not allowed.
   - Reject with HTTP 400 and `FILE_TOO_LARGE` if file exceeds 10MB.

3. In `GarmentsService.upload(userId: string, garmentId: string, file: Express.Multer.File)`:
   - Verify the garment exists and belongs to the user (same ownership check).
   - Generate a unique upload ID (UUID v4).
   - Store the upload metadata in Redis (or a temporary uploads table):
     - `upload_id`, `garment_id`, `user_id`, `status: 'pending'`, `file_size`, `mime_type`, `created_at`.
   - Send the file to the storage service for secure temporary storage and return the temporary URL.
   - Trigger an asynchronous AI pipeline event (emit an event or add to a job queue).
   - Return the `upload_id` and `status: 'pending'`.

4. In `StorageService.uploadTemp(file: Express.Multer.File)`:
   - Store file temporarily (Cloudinary with a temp folder or filesystem in `uploads/temp/`).
   - Return `{ temp_url: string, file_hash: string }`.

## ACCEPTANCE CRITERIA

- `POST /garments/:id/upload` with a valid JPG file returns HTTP 201 with `{ upload_id, status: 'pending' }`.
- `POST /garments/:id/upload` with a PNG file returns HTTP 201.
- `POST /garments/:id/upload` with a file larger than 10MB returns HTTP 400 with `FILE_TOO_LARGE`.
- `POST /garments/:id/upload` with a GIF file returns HTTP 400 with `INVALID_FILE_TYPE`.
- `POST /garments/:id/upload` without a file returns HTTP 400.
- `POST /garments/:id/upload` for a non-existent garment returns HTTP 404.
- `POST /garments/:id/upload` for another user's garment returns HTTP 404.
- `POST /garments/:id/upload` without auth returns HTTP 401.

## EDGE CASES

- The `file` field name must be exactly `'file'` (single file upload).
- HEIC files from iOS devices must be accepted (even if converted server-side later).
- Concurrent uploads for the same garment must each create a separate upload ID; the most recent one's result will overwrite the garment images.
- File names must be sanitized to prevent path traversal (use UUID-based names, not original filename).
- The temporary file must be automatically cleaned up after 24 hours if the pipeline does not process it.
- Multer must be configured with appropriate limits to prevent DOS attacks.

## TESTS REQUIRED

- Unit test: File validation rejects invalid MIME types.
- Unit test: File validation rejects oversized files.
- Unit test: `GarmentsService.upload()` creates upload record with pending status.
- Integration test: Upload valid JPG returns 201 with upload_id.
- Integration test: Upload invalid file type returns 400.
- Integration test: Upload without auth returns 401.
- Integration test: Upload for non-existent garment returns 404.

## EXPECTED OUTPUT

- Updated `backend/src/garments/garments.controller.ts` with `POST /garments/:id/upload`.
- Updated `backend/src/garments/garments.service.ts` with `upload()` method.
- Updated `backend/src/storage/storage.service.ts` with `uploadTemp()` method.
- All tests pass.
