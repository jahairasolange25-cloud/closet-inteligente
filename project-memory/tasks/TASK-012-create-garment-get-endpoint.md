# TASK-012

# Create Single Garment Get Endpoint (GET /garments/:id)

## OBJECTIVE

Implement the `GET /garments/:id` endpoint that returns the full details of a single garment owned by the authenticated user. The endpoint must verify ownership and return 404 if the garment does not exist or 403 if the garment belongs to another user.

## CONTEXT FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/garments.module.ts`

## ALLOWED FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any DTO files
- Any database migration files

## REQUIREMENTS

1. In `GarmentsService.findOne(userId: string, garmentId: string)`:
   - Query the database for a garment with `id = garmentId`, `user_id = userId`, and `deleted_at IS NULL`.
   - If not found, throw `NotFoundException` with message `GARMENT_NOT_FOUND`.
   - If the garment exists but `user_id` does not match `userId`, this is handled by the query itself (since both conditions are in WHERE).
   - Return the full garment entity.

2. In `GarmentsController.findOne()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string`.
   - Validate that `id` is a valid UUID (use `@ParseUUIDPipe()` or a custom pipe).
   - Call `GarmentsService.findOne(userId, id)`.
   - Return HTTP 200 with the garment details.

3. The response must include all garment fields.

## ACCEPTANCE CRITERIA

- `GET /garments/:id` with a valid owned garment ID returns HTTP 200 with full garment details.
- `GET /garments/:id` with a non-existent UUID returns HTTP 404 with `GARMENT_NOT_FOUND`.
- `GET /garments/:id` with a garment owned by a different user returns HTTP 404 (not 403, to avoid revealing the existence of other users' garments).
- `GET /garments/:id` with a soft-deleted garment returns HTTP 404.
- `GET /garments/:id` without auth returns HTTP 401.
- `GET /garments/:id` with an invalid UUID format returns HTTP 400.

## EDGE CASES

- The `id` parameter must be validated as a proper UUID v4 format before querying (use `ParseUUIDPipe`).
- Garment ownership must be verified in the query itself, not by fetching then comparing in application code (avoid race condition).
- Soft-deleted garments must return 404 even though they exist in the database.
- The response must not include `user_id` if the API design hides it (or include it, but be consistent with the create endpoint).

## TESTS REQUIRED

- Unit test: `GarmentsService.findOne()` returns garment when userId matches.
- Unit test: `GarmentsService.findOne()` throws `NotFoundException` when not found.
- Unit test: `GarmentsService.findOne()` throws `NotFoundException` for soft-deleted garment.
- Integration test: `GET /garments/:id` returns 200 with owned garment.
- Integration test: `GET /garments/:id` returns 404 for non-existent ID.
- Integration test: `GET /garments/:id` returns 404 for other user's garment.
- Integration test: `GET /garments/:id` returns 401 without auth.

## EXPECTED OUTPUT

- Updated `backend/src/garments/garments.service.ts` with `findOne()` method.
- Updated `backend/src/garments/garments.controller.ts` with `GET /garments/:id`.
- All tests pass.
