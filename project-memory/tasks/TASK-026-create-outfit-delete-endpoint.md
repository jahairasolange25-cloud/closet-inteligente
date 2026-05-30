# TASK-026

# Create Outfit Delete Endpoint (DELETE /outfits/:id)

## OBJECTIVE

Implement the `DELETE /outfits/:id` endpoint that performs a soft delete on an outfit owned by the authenticated user. Sets `deleted_at` timestamp without physically removing the database row.

## CONTEXT FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`

## ALLOWED FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. In `OutfitsService.softDelete(userId: string, outfitId: string)`:
   - Query for an outfit with `id = outfitId`, `user_id = userId`, `deleted_at IS NULL`.
   - If not found, throw `NotFoundException` with `OUTFIT_NOT_FOUND`.
   - Set `deleted_at = NOW()`.
   - Return `{ success: true, deleted_at: <timestamp> }`.

2. In `OutfitsController.remove()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string` (validate UUID).
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `DELETE /outfits/:id` returns HTTP 200 with `{ success: true, deleted_at: <ISO string> }`.
- After deletion, `GET /outfits/:id` returns HTTP 404.
- After deletion, `GET /outfits` no longer includes the outfit.
- The database row still exists with `deleted_at` set.
- `DELETE /outfits/:id` for non-existent ID returns HTTP 404.
- `DELETE /outfits/:id` for another user's outfit returns HTTP 404.
- `DELETE /outfits/:id` on already soft-deleted outfit returns HTTP 404.
- `DELETE /outfits/:id` without auth returns HTTP 401.

## EDGE CASES

- Soft delete does NOT cascade to `outfit_garments` entries (they remain, as the outfit may be restored).
- Deleting an already-deleted outfit returns 404 (idempotent from user perspective).
- The `outfit_garments` join records remain in the database for potential restore.

## TESTS REQUIRED

- Unit test: `OutfitsService.softDelete()` sets `deleted_at`.
- Unit test: `OutfitsService.softDelete()` throws for non-existent outfit.
- Integration test: `DELETE /outfits/:id` returns 200.
- Integration test: After soft delete, GET returns 404.
- Integration test: Double delete returns 404.

## EXPECTED OUTPUT

- Updated `backend/src/outfits/outfits.service.ts` with `softDelete()` method.
- Updated `backend/src/outfits/outfits.controller.ts` with `DELETE /outfits/:id`.
- All tests pass.
