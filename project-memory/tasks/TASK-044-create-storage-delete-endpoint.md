# TASK-044

# Create Storage Delete Endpoint (DELETE /storage/delete)

## OBJECTIVE

Implement the `DELETE /storage/delete` endpoint that removes a file from Cloudinary by its public_id. This is used to clean up unused or replaced garment images and avatar files.

## CONTEXT FILES

- `backend/src/storage/storage.controller.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/dto/delete-file.dto.ts`

## ALLOWED FILES

- `backend/src/storage/storage.controller.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/dto/delete-file.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `DeleteFileDto`:
   - `public_id`: string, `@IsString()`, `@IsNotEmpty()` — the Cloudinary public ID to delete.

2. In `StorageService.delete(publicId: string)`:
   - Call Cloudinary's `uploader.destroy(publicId)` to remove the file.
   - Handle the response:
     - If `result === 'ok'`, return `{ success: true, message: 'File deleted' }`.
     - If `result === 'not found'`, return `{ success: false, message: 'File not found' }` — do not throw.
     - If Cloudinary returns an error, throw `InternalServerErrorException` with `CLOUDINARY_DELETE_FAILED`.
   - If the public_id contains a folder path (e.g., `uploads/abc123`), extract only the public_id without the `uploads/` prefix if needed.

3. In `StorageController.delete()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Body() dto: DeleteFileDto` (use body, not query params, for security).
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `DELETE /storage/delete` with a valid public_id returns HTTP 200 with `{ success: true }`.
- `DELETE /storage/delete` with a non-existent public_id returns HTTP 200 with `{ success: false, message: 'File not found' }`.
- `DELETE /storage/delete` without `public_id` returns HTTP 400.
- `DELETE /storage/delete` without auth returns HTTP 401.

## EDGE CASES

- Deletion is idempotent: deleting a non-existent file returns success (but `success: false`).
- The endpoint uses DELETE HTTP method, not POST.
- The public_id must be validated to contain only safe characters (alphanumeric, underscores, hyphens, slashes).
- If Cloudinary API is unreachable, return HTTP 502 with `STORAGE_SERVICE_UNAVAILABLE`.

## TESTS REQUIRED

- Unit test: `StorageService.delete()` calls Cloudinary destroy.
- Unit test: `StorageService.delete()` handles 'not found' gracefully.
- Unit test: `StorageService.delete()` throws on Cloudinary error.
- Integration test: `DELETE /storage/delete` returns 200.

## EXPECTED OUTPUT

- `backend/src/storage/dto/delete-file.dto.ts`
- Updated `backend/src/storage/storage.service.ts` with robust `delete()` method.
- Updated `backend/src/storage/storage.controller.ts` with `DELETE /storage/delete`.
- All tests pass.
