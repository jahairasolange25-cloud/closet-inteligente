# TASK-013

# Create Garment Update Endpoint (PATCH /garments/:id)

## OBJECTIVE

Implement the `PATCH /garments/:id` endpoint that allows authenticated users to update specific fields of their own garments. Supported updatable fields: name, state, brand, size, color, season. The endpoint must validate ownership and return the updated garment.

## CONTEXT FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/dto/update-garment.dto.ts`
- `backend/src/garments/garments.module.ts`

## ALLOWED FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/dto/update-garment.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `UpdateGarmentDto` with all fields optional:
   - `name`: string (optional), `@IsOptional()`, `@IsString()`, `@IsNotEmpty()`, `@MaxLength(100)`
   - `state`: string (optional), `@IsOptional()`, `@IsEnum(GarmentState)`
   - `brand`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(100)`
   - `size`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(50)`
   - `color`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(50)`
   - `season`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(50)`

2. In `GarmentsService.update(userId: string, garmentId: string, dto: UpdateGarmentDto)`:
   - Verify the garment exists and belongs to the user by querying with `id = garmentId`, `user_id = userId`, `deleted_at IS NULL`.
   - If not found, throw `NotFoundException` with `GARMENT_NOT_FOUND`.
   - Filter the DTO to only include defined fields (remove undefined values).
   - Build a dynamic UPDATE query to update only the provided fields.
   - Set `updated_at = NOW()` (the trigger will handle this, but ensure it's triggered).
   - Return the updated garment by re-fetching it (or use RETURNING clause).

3. In `GarmentsController.update()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string` (validate UUID) and `@Body() dto: UpdateGarmentDto`.
   - Call `GarmentsService.update(userId, id, dto)`.
   - Return HTTP 200 with the updated garment.

## ACCEPTANCE CRITERIA

- `PATCH /garments/:id` with valid fields returns HTTP 200 with the updated garment.
- `PATCH /garments/:id` with only `name` updates only the name, other fields remain unchanged.
- `PATCH /garments/:id` with `state` set to `'repair'` works and returns updated state.
- `PATCH /garments/:id` with an empty body returns the current garment unchanged.
- `PATCH /garments/:id` with a non-existent ID returns HTTP 404.
- `PATCH /garments/:id` with another user's garment ID returns HTTP 404.
- `PATCH /garments/:id` with invalid `state` value returns HTTP 400.
- `PATCH /garments/:id` without auth returns HTTP 401.

## EDGE CASES

- Only the allowed fields (`name`, `state`, `brand`, `size`, `color`, `season`) can be updated; any extra fields in the body must be ignored or rejected with 400.
- `state` must be a valid `GarmentState` enum value.
- `name` must not be empty even in update (if provided).
- The garment's `type` cannot be changed after creation (not included in DTO).
- `usage_count` and `last_used_at` are automatically managed and cannot be manually updated.
- `image_url` and `thumbnail_url` are managed by the upload pipeline and cannot be manually updated.

## TESTS REQUIRED

- Unit test: `GarmentsService.update()` updates only provided fields.
- Unit test: `GarmentsService.update()` throws `NotFoundException` for non-existent garment.
- Unit test: `UpdateGarmentDto` rejects invalid state values.
- Integration test: `PATCH /garments/:id` updates name.
- Integration test: `PATCH /garments/:id` partial update preserves other fields.
- Integration test: `PATCH /garments/:id` with empty body returns unchanged.
- Integration test: `PATCH /garments/:id` returns 404 for other user's garment.

## EXPECTED OUTPUT

- `backend/src/garments/dto/update-garment.dto.ts`
- Updated `backend/src/garments/garments.service.ts` with `update()` method.
- Updated `backend/src/garments/garments.controller.ts` with `PATCH /garments/:id`.
- All tests pass.
