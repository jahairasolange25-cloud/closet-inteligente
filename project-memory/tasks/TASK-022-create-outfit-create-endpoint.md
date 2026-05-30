# TASK-022

# Create Outfit Create Endpoint (POST /outfits)

## OBJECTIVE

Implement the `POST /outfits` endpoint that allows authenticated users to create a new outfit by selecting garments from their closet. The endpoint validates that at least one upper garment and one lower garment are included, none of the garments are in `washing` state, all garments belong to the user, and a maximum of 6 garments.

## CONTEXT FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/outfits.module.ts`
- `backend/src/outfits/dto/create-outfit.dto.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/entities/garment-type.enum.ts`

## ALLOWED FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/outfits.module.ts`
- `backend/src/outfits/dto/create-outfit.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `CreateOutfitDto`:
   - `name`: string, `@IsString()`, `@IsNotEmpty()`, `@MaxLength(150)`
   - `type`: string, `@IsEnum(OutfitType)`, `@IsNotEmpty()`
   - `garment_ids`: array of strings (UUIDs), `@IsArray()`, `@ArrayMinSize(1)`, `@ArrayMaxSize(6)`, `@IsUUID('4', { each: true })`

2. Create `OutfitType` enum matching PostgreSQL values: `casual`, `formal`, `office`, `party`.

3. In `OutfitsService.create(userId: string, dto: CreateOutfitDto)`:
   - Fetch all garments by `garment_ids` that belong to the user.
   - Validate:
     - All `garment_ids` must exist and belong to the user. If any do not, throw `BadRequestException` with `SOME_GARMENTS_NOT_FOUND`.
     - None of the garments can have `state = 'washing'`. If any are in washing, throw `BadRequestException` with `GARMENT_IN_WASHING`.
     - None of the garments can be soft-deleted (filter out `deleted_at IS NOT NULL`).
     - At least one garment with `type` in `['shirt', 'dresses']` (upper body).
     - At least one garment with `type` in `['pants', 'shoes']` (lower body).
     - If upper or lower garment check fails, throw `BadRequestException` with `MISSING_UPPER_OR_LOWER_GARMENT`.
   - Insert the outfit into the `outfits` table.
   - Insert `outfit_garments` records with position based on array index (1-based).
   - Set `is_complete = true` if all validation passes.
   - Return the created outfit with its garments.

4. In `OutfitsController.create()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Body() dto: CreateOutfitDto`.
   - Return HTTP 201 with the created outfit.

## ACCEPTANCE CRITERIA

- `POST /outfits` with valid data returns HTTP 201 with full outfit including garments.
- `POST /outfits` with fewer than 1 garment returns HTTP 400.
- `POST /outfits` with more than 6 garments returns HTTP 400.
- `POST /outfits` without an upper body garment returns HTTP 400 with `MISSING_UPPER_OR_LOWER_GARMENT`.
- `POST /outfits` without a lower body garment returns HTTP 400 with `MISSING_UPPER_OR_LOWER_GARMENT`.
- `POST /outfits` with a garment in `washing` state returns HTTP 400 with `GARMENT_IN_WASHING`.
- `POST /outfits` with a non-existent garment ID returns HTTP 400 with `SOME_GARMENTS_NOT_FOUND`.
- `POST /outfits` with a garment belonging to another user returns HTTP 400 with `SOME_GARMENTS_NOT_FOUND`.
- `POST /outfits` without auth returns HTTP 401.

## EDGE CASES

- Garment IDs that are not valid UUIDs are caught by `@IsUUID()` validation.
- The `garment_ids` array must not contain duplicates (validate with `@ArrayUnique()` or in service).
- `shoes` count as lower body garments for the validation check.
- `dresses` can count as both upper and lower body garments (fulfills both requirements with a single garment).
- The outfit's `is_complete` is set to `true` only when all requirements are met; otherwise `false`.
- The position of garments in the outfit is determined by their index in the `garment_ids` array (1-based).

## TESTS REQUIRED

- Unit test: `OutfitsService.create()` validates garment ownership and state.
- Unit test: `OutfitsService.create()` throws for missing upper garment.
- Unit test: `OutfitsService.create()` throws for missing lower garment.
- Unit test: `CreateOutfitDto` validates all fields.
- Integration test: `POST /outfits` returns 201 with valid outfit.
- Integration test: `POST /outfits` returns 400 for invalid garment IDs.
- Integration test: `POST /outfits` returns 400 for garments in washing.

## EXPECTED OUTPUT

- `backend/src/outfits/dto/create-outfit.dto.ts`
- Updated `backend/src/outfits/outfits.service.ts` with `create()` method.
- Updated `backend/src/outfits/outfits.controller.ts` with `POST /outfits`.
- All tests pass.
