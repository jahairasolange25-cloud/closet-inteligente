# TASK-014

# Create Garment Delete Endpoint (DELETE /garments/:id)

## OBJECTIVE

Implement the `DELETE /garments/:id` endpoint that performs a soft delete on a garment owned by the authenticated user. Instead of removing the row from the database, it sets the `deleted_at` timestamp to the current time. This preserves data for analytics, recovery, and undo operations.

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

1. In `GarmentsService.softDelete(userId: string, garmentId: string)`:
   - Query for a garment with `id = garmentId`, `user_id = userId`, `deleted_at IS NULL`.
   - If not found, throw `NotFoundException` with message `GARMENT_NOT_FOUND`.
   - Set `deleted_at = NOW()` on the garment row.
   - Do NOT physically delete the row.
   - Return `{ success: true, deleted_at: <timestamp> }`.

2. In `GarmentsController.remove()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string` (validate UUID).
   - Call `GarmentsService.softDelete(userId, id)`.
   - Return HTTP 200 with `{ success: true, deleted_at: <ISO timestamp> }`.

3. Ensure that the soft-deleted garment:
   - Is no longer returned by `GET /garments` (list) or `GET /garments/:id` (single).
   - Is still present in the database (verify with direct SQL).
   - Can potentially be restored by setting `deleted_at = NULL` (future feature, not required now).

## ACCEPTANCE CRITERIA

- `DELETE /garments/:id` returns HTTP 200 with `{ success: true, deleted_at: <ISO string> }`.
- After deletion, `GET /garments/:id` returns HTTP 404.
- After deletion, `GET /garments` no longer includes the garment.
- The database row still exists with `deleted_at` set (verify via direct DB query).
- `DELETE /garments/:id` with a non-existent ID returns HTTP 404.
- `DELETE /garments/:id` with another user's garment returns HTTP 404.
- `DELETE /garments/:id` on an already soft-deleted garment returns HTTP 404.
- `DELETE /garments/:id` without auth returns HTTP 401.
- Calling `DELETE /garments/:id` twice returns HTTP 404 the second time.

## EDGE CASES

- Soft delete must be idempotent from the user's perspective: deleting an already-deleted garment returns 404.
- The `deleted_at` timestamp must be set to the current server time using `NOW()`.
- No cascade soft delete is needed (outfits referencing the garment are handled separately).
- The `updated_at` trigger should NOT be prevented from firing on soft delete.
- Soft-deleted garments should still count toward storage limits (or should they? they are not visible but still stored).

## TESTS REQUIRED

- Unit test: `GarmentsService.softDelete()` sets `deleted_at` on the garment.
- Unit test: `GarmentsService.softDelete()` throws `NotFoundException` for non-existent garment.
- Unit test: `GarmentsService.softDelete()` throws `NotFoundException` for already deleted.
- Integration test: `DELETE /garments/:id` returns 200 and soft-deletes.
- Integration test: After soft delete, GET endpoints return 404.
- Integration test: Direct DB query confirms row still exists with `deleted_at` set.
- Integration test: Double delete returns 404.

## EXPECTED OUTPUT

- Updated `backend/src/garments/garments.service.ts` with `softDelete()` method.
- Updated `backend/src/garments/garments.controller.ts` with `DELETE /garments/:id`.
- All tests pass.
