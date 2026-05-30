# TASK-010

# Create Garment Create Endpoint (POST /garments)

## OBJECTIVE

Implement the `POST /garments` endpoint that allows authenticated users to add a new garment to their virtual closet. The endpoint accepts garment details, validates input, auto-sets the state to `available`, and returns the created garment with HTTP 201.

## CONTEXT FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/garments.module.ts`
- `backend/src/garments/dto/create-garment.dto.ts`
- `backend/src/garments/entities/garment.entity.ts`
- `backend/src/users/users.service.ts`

## ALLOWED FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/garments.module.ts`
- `backend/src/garments/dto/create-garment.dto.ts` (create)
- `backend/src/garments/entities/garment.entity.ts` (create if needed)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files
- `backend/src/auth/` (except auth.module.ts for imports)

## REQUIREMENTS

1. Create `CreateGarmentDto` with:
   - `name`: string, `@IsString()`, `@IsNotEmpty()`, `@MaxLength(100)`
   - `type`: string (garment_type enum), `@IsEnum(GarmentType)`, `@IsNotEmpty()`
   - `brand`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(100)`
   - `size`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(50)`
   - `color`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(50)`
   - `season`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(50)`

2. Create `GarmentType` enum/constant file (shared if not exists):
   - Values matching the PostgreSQL enum: `shirt`, `pants`, `shoes`, `jackets`, `accessories`, `dresses`, `sportswear`, `formalwear`.

3. In `GarmentsService.create(userId: string, dto: CreateGarmentDto)`:
   - Build a garment object with `user_id = userId`, `state = 'available'`, `usage_count = 0`.
   - Insert into the database.
   - Return the created garment entity.

4. In `GarmentsController.create()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Body() dto: CreateGarmentDto`.
   - Inject user via `@CurrentUser('id')`.
   - Return HTTP 201 with the created garment.

## ACCEPTANCE CRITERIA

- `POST /garments` with valid data returns HTTP 201 with the full garment object.
- `POST /garments` without `name` returns HTTP 400.
- `POST /garments` with `name` longer than 100 characters returns HTTP 400.
- `POST /garments` without `type` returns HTTP 400.
- `POST /garments` with invalid `type` value returns HTTP 400.
- The created garment has `state` set to `'available'` and `usage_count` set to `0`.
- The created garment has an auto-generated UUID `id`.
- The response includes all fields except `user_id` (or includes it, consistent with API design).
- `POST /garments` without authentication returns HTTP 401.

## EDGE CASES

- `name` with only whitespace must be rejected (use `@IsNotEmpty` after trim).
- `brand`, `size`, `color`, `season` are optional; if not provided, they must be `NULL` in the database.
- All string fields must be trimmed before storage.
- The `type` enum validation must be case-sensitive (lowercase only, matching the DB enum).
- Concurrent create calls must not duplicate (handled by application logic, not DB constraint).

## TESTS REQUIRED

- Unit test: `GarmentsService.create()` calls repository with correct data.
- Unit test: `CreateGarmentDto` validates all fields correctly.
- Integration test: `POST /garments` returns 201 with valid garment.
- Integration test: `POST /garments` returns 400 for missing name.
- Integration test: `POST /garments` returns 400 for invalid type.
- Integration test: `POST /garments` returns 401 without auth.

## EXPECTED OUTPUT

- `backend/src/garments/dto/create-garment.dto.ts`
- `backend/src/garments/entities/garment.entity.ts` (if needed)
- Updated `backend/src/garments/garments.service.ts` with `create()` method.
- Updated `backend/src/garments/garments.controller.ts` with `POST /garments`.
- All tests pass.
