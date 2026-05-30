# TASK-025

# Create Outfit Update Endpoint (PATCH /outfits/:id)

## OBJECTIVE

Implement the `PATCH /outfits/:id` endpoint that allows authenticated users to update an existing outfit's name, type, or garment list. The version counter is incremented on every update to support optimistic concurrency control.

## CONTEXT FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/dto/update-outfit.dto.ts`

## ALLOWED FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/dto/update-outfit.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `UpdateOutfitDto` with all fields optional:
   - `name`: string (optional), `@IsOptional()`, `@IsString()`, `@IsNotEmpty()`, `@MaxLength(150)`
   - `type`: string (optional), `@IsOptional()`, `@IsEnum(OutfitType)`
   - `garment_ids`: array of UUIDs (optional), `@IsOptional()`, `@IsArray()`, `@ArrayMinSize(1)`, `@ArrayMaxSize(6)`, `@IsUUID('4', { each: true })`
   - `expected_version`: number (optional, for optimistic locking), `@IsOptional()`, `@IsInt()`, `@Min(1)`

2. In `OutfitsService.update(userId: string, outfitId: string, dto: UpdateOutfitDto)`:
   - Verify the outfit exists and belongs to the user.
   - If `expected_version` is provided, check that it matches the current `version`; if not, throw `ConflictException` with `VERSION_MISMATCH`.
   - Increment `version = version + 1`.
   - If `garment_ids` is provided:
     - Validate garments (same rules as create: ownership, state, upper+lower).
     - Delete existing `outfit_garments` entries.
     - Insert new `outfit_garments` entries with updated positions.
   - Update name and/or type if provided.
   - Recalculate `is_complete` based on the updated garment set.
   - Return the updated outfit.

3. In `OutfitsController.update()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string` and `@Body() dto: UpdateOutfitDto`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `PATCH /outfits/:id` with name update returns HTTP 200 with updated name.
- `PATCH /outfits/:id` with type update changes the type.
- `PATCH /outfits/:id` with new `garment_ids` replaces garments.
- `PATCH /outfits/:id` increments `version` by 1.
- `PATCH /outfits/:id` with wrong `expected_version` returns HTTP 409 with `VERSION_MISMATCH`.
- `PATCH /outfits/:id` with empty body returns the current outfit unchanged but increments version.
- `PATCH /outfits/:id` for non-existent outfit returns HTTP 404.
- `PATCH /outfits/:id` for another user's outfit returns HTTP 404.

## EDGE CASES

- Optimistic locking: if `expected_version` is provided and mismatches, reject with 409.
- If `expected_version` is not provided, proceed without version check (for simple updates).
- Replacing garments triggers the same validation as create (upper+lower, no washing, ownership).
- `version` always increments on any update, even if only `name` changes.
- If the update removes all garments, set `is_complete = false`.

## TESTS REQUIRED

- Unit test: `OutfitsService.update()` increments version.
- Unit test: `OutfitsService.update()` rejects version mismatch.
- Unit test: `OutfitsService.update()` replaces garments when garment_ids provided.
- Integration test: `PATCH /outfits/:id` updates name.
- Integration test: `PATCH /outfits/:id` version conflict returns 409.

## EXPECTED OUTPUT

- `backend/src/outfits/dto/update-outfit.dto.ts`
- Updated `backend/src/outfits/outfits.service.ts` with `update()` method.
- Updated `backend/src/outfits/outfits.controller.ts` with `PATCH /outfits/:id`.
- All tests pass.
