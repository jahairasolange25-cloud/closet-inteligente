# TASK-024

# Create Single Outfit Get Endpoint (GET /outfits/:id)

## OBJECTIVE

Implement the `GET /outfits/:id` endpoint that returns the full details of a single outfit owned by the authenticated user, including all associated garments.

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
- Any DTO files

## REQUIREMENTS

1. In `OutfitsService.findOne(userId: string, outfitId: string)`:
   - Query for an outfit with `id = outfitId`, `user_id = userId`, `deleted_at IS NULL`.
   - If not found, throw `NotFoundException` with `OUTFIT_NOT_FOUND`.
   - Eagerly load the associated garments through `outfit_garments`, ordered by `position`.
   - Return the outfit with `garments` array included.

2. In `OutfitsController.findOne()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string` (validate UUID).
   - Return HTTP 200 with the outfit.

## ACCEPTANCE CRITERIA

- `GET /outfits/:id` returns HTTP 200 with full outfit details including `garments` array.
- `GET /outfits/:id` returns garments ordered by `position`.
- `GET /outfits/:id` for non-existent outfit returns HTTP 404 with `OUTFIT_NOT_FOUND`.
- `GET /outfits/:id` for another user's outfit returns HTTP 404.
- `GET /outfits/:id` for a soft-deleted outfit returns HTTP 404.
- `GET /outfits/:id` without auth returns HTTP 401.
- `GET /outfits/:id` with invalid UUID returns HTTP 400.

## EDGE CASES

- The response must include the full garment objects, not just IDs.
- Garments that have been soft-deleted should be included in the response but marked as `deleted: true` (or simply excluded with a note — decide and document).
- The `garments` array should preserve the position order as defined in `outfit_garments`.
- If an outfit has no garments (orphaned), return an empty `garments` array.

## TESTS REQUIRED

- Unit test: `OutfitsService.findOne()` returns outfit with garments.
- Unit test: `OutfitsService.findOne()` throws `NotFoundException` for non-existent.
- Integration test: `GET /outfits/:id` returns 200 with garments.
- Integration test: `GET /outfits/:id` returns 404 for other user.
- Integration test: `GET /outfits/:id` returns 404 for soft-deleted.

## EXPECTED OUTPUT

- Updated `backend/src/outfits/outfits.service.ts` with `findOne()` method.
- Updated `backend/src/outfits/outfits.controller.ts` with `GET /outfits/:id`.
- All tests pass.
