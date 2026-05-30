# TASK-042

# Create Storage Upload Endpoint (POST /storage/upload)

## OBJECTIVE

Implement the `POST /storage/upload` endpoint that provides a generic file upload service with Cloudinary integration. This endpoint handles file validation, uploads to Cloudinary, and returns the public URL. It supports optional image transformations (resize, format conversion).

## CONTEXT FILES

- `backend/src/storage/storage.controller.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/storage.module.ts`
- `backend/src/storage/dto/upload-file.dto.ts`
- `backend/package.json` (check for cloudinary, @types/cloudinary)

## ALLOWED FILES

- `backend/src/storage/storage.controller.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/storage.module.ts`
- `backend/src/storage/dto/upload-file.dto.ts` (create)
- `backend/.env` (add Cloudinary config)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `UploadFileDto` (for multipart upload):
   - `file`: file (multipart), validated by interceptor.
   - `folder`: string (optional), `@IsOptional()`, `@IsString()` — Cloudinary folder name, defaults to `'uploads'`.
   - `transforms`: object (optional), `@IsOptional()`, `@IsObject()` — transformation parameters.

2. Configure Cloudinary in `StorageService`:
   - Use `cloudinary` npm package v2.
   - Configure with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from environment.
   - Upload method: `uploadStream()` or `upload()` with promise wrapper.
   - Supported transforms: `width`, `height`, `crop`, `format`, `quality`.

3. In `StorageService.upload(file: Express.Multer.File, folder?: string, transforms?: object)`:
   - Validate file type (allowed: image/jpeg, image/png, image/webp, application/pdf).
   - Validate file size (max 50MB).
   - Upload to Cloudinary with optional folder and transformations.
   - Return `{ url: string, public_id: string, format: string, bytes: number, width: number, height: number }`.

4. In `StorageService.delete(publicId: string)`:
   - Delete a file from Cloudinary by its public_id.
   - Return `{ success: boolean, result: string }`.

5. In `StorageController.upload()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Use `@UseInterceptors(FileInterceptor('file'))`.
   - Accept `@UploadedFile() file` and `@Body() dto: UploadFileDto`.
   - Return HTTP 201 with the upload result.

## ACCEPTANCE CRITERIA

- `POST /storage/upload` with a valid image returns HTTP 201 with `{ url, public_id, format, bytes, width, height }`.
- `POST /storage/upload` with a PDF returns HTTP 201 (if PDF is in allowed types).
- `POST /storage/upload` with a file over 50MB returns HTTP 400.
- `POST /storage/upload` with an invalid file type returns HTTP 400.
- `POST /storage/upload` without auth returns HTTP 401.
- The `url` returned is a valid Cloudinary URL.
- The file is stored in the specified folder (or default `'uploads'`).

## EDGE CASES

- Large files must use streaming to avoid memory issues.
- Cloudinary API errors must be caught and returned as HTTP 502 with `CLOUDINARY_UPLOAD_FAILED`.
- File names with special characters must be sanitized before upload.
- The file buffer should be converted to a base64 data URI or stream for Cloudinary upload.
- If Cloudinary is not configured, return HTTP 503 with `STORAGE_NOT_CONFIGURED`.

## TESTS REQUIRED

- Unit test: `StorageService.upload()` calls Cloudinary API with correct params.
- Unit test: `StorageService.upload()` handles Cloudinary errors gracefully.
- Unit test: `StorageService.delete()` calls Cloudinary destroy API.
- Integration test: `POST /storage/upload` returns 201 (mock Cloudinary if needed).

## EXPECTED OUTPUT

- `backend/src/storage/dto/upload-file.dto.ts`
- Updated `backend/src/storage/storage.service.ts` with `upload()` and `delete()` methods.
- `backend/src/storage/storage.controller.ts` with file upload endpoint.
- Cloudinary environment variables added to `.env.example`.
- All tests pass.
