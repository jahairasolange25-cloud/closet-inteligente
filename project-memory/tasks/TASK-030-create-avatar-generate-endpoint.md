# TASK-030

# Create Avatar Generate Endpoint (POST /avatars/:id/generate)

## OBJECTIVE

Implement the `POST /avatars/:id/generate` endpoint that accepts a video upload for avatar generation. The video is processed by the AI pipeline to create a 3D avatar model. This endpoint triggers an asynchronous generation process.

## CONTEXT FILES

- `backend/src/avatars/avatars.controller.ts`
- `backend/src/avatars/avatars.service.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/pipeline/pipeline.service.ts`

## ALLOWED FILES

- `backend/src/avatars/avatars.controller.ts`
- `backend/src/avatars/avatars.service.ts`
- `backend/src/avatars/dto/generate-avatar.dto.ts` (create)
- `backend/src/storage/storage.service.ts`
- `backend/src/pipeline/pipeline.service.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `GenerateAvatarDto`:
   - `video`: file (multipart upload), validated as video type.

2. Configure file upload:
   - Use `@UseInterceptors(FileInterceptor('video'))`.
   - Allowed MIME types: `video/mp4`, `video/quicktime`, `video/x-msvideo`.
   - Max file size: 200 MB.
   - Reject invalid types with `INVALID_VIDEO_TYPE`.
   - Reject oversized with `VIDEO_TOO_LARGE`.

3. In `AvatarsService.generate(userId: string, avatarId: string, file: Express.Multer.File)`:
   - Verify the avatar exists and belongs to the user, and is active.
   - If not found or not active, throw `NotFoundException` with `AVATAR_NOT_FOUND`.
   - Store the video temporarily via `StorageService.uploadTemp()`.
   - Generate a generation ID (UUID).
   - Store generation metadata in Redis: `{ generation_id, avatar_id, user_id, status: 'pending', created_at }`.
   - Trigger the AI pipeline for avatar generation (emit event or queue job).
   - Return `{ generation_id, status: 'pending' }`.

4. In `AvatarsController.generate()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string` and `@UploadedFile() file`.
   - Return HTTP 201 with generation ID.

## ACCEPTANCE CRITERIA

- `POST /avatars/:id/generate` with a valid MP4 returns HTTP 201 with `{ generation_id, status: 'pending' }`.
- `POST /avatars/:id/generate` with an invalid file type returns HTTP 400 with `INVALID_VIDEO_TYPE`.
- `POST /avatars/:id/generate` with a file over 200MB returns HTTP 400 with `VIDEO_TOO_LARGE`.
- `POST /avatars/:id/generate` for a non-existent avatar returns HTTP 404.
- `POST /avatars/:id/generate` for a deactivated avatar returns HTTP 404.
- `POST /avatars/:id/generate` without auth returns HTTP 401.

## EDGE CASES

- Video file processing is async; the endpoint must return immediately with pending status.
- Only active avatars can be generated (deactivated avatars return 404).
- Large video files (up to 200MB) must be handled with streaming to temp storage, not kept in memory.
- The video file must be deleted from temp storage after processing (cleanup responsibility of the pipeline).

## TESTS REQUIRED

- Unit test: `AvatarsService.generate()` creates generation record.
- Integration test: `POST /avatars/:id/generate` with video returns 201.
- Integration test: `POST /avatars/:id/generate` with invalid type returns 400.
- Integration test: `POST /avatars/:id/generate` for non-existent avatar returns 404.

## EXPECTED OUTPUT

- `backend/src/avatars/dto/generate-avatar.dto.ts`
- Updated `backend/src/avatars/avatars.service.ts` with `generate()` method.
- Updated `backend/src/avatars/avatars.controller.ts` with `POST /avatars/:id/generate`.
- All tests pass.
