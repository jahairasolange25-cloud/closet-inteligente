# TASK-029

# Create Avatar Create Endpoint (POST /avatars)

## OBJECTIVE

Implement the `POST /avatars` endpoint that allows authenticated users to create their 3D avatar profile with body measurements. If the user already has an avatar, the existing one is soft-deactivated and a new one is created (max 1 active avatar per user).

## CONTEXT FILES

- `backend/src/avatars/avatars.controller.ts`
- `backend/src/avatars/avatars.service.ts`
- `backend/src/avatars/avatars.module.ts`
- `backend/src/avatars/dto/create-avatar.dto.ts`

## ALLOWED FILES

- `backend/src/avatars/avatars.controller.ts`
- `backend/src/avatars/avatars.service.ts`
- `backend/src/avatars/avatars.module.ts`
- `backend/src/avatars/dto/create-avatar.dto.ts` (create)
- `backend/src/avatars/entities/avatar.entity.ts` (create if needed)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `CreateAvatarDto` with all fields optional except none (but at least one should be provided):
   - `full_body_url`: string (optional), `@IsOptional()`, `@IsUrl()`, `@MaxLength(2048)`
   - `head_url`: string (optional), `@IsOptional()`, `@IsUrl()`, `@MaxLength(2048)`
   - `height_cm`: number (optional), `@IsOptional()`, `@IsNumber()`, `@Min(50)`, `@Max(300)`
   - `chest_cm`: number (optional), `@IsOptional()`, `@IsNumber()`, `@Min(10)`, `@Max(300)`
   - `waist_cm`: number (optional), `@IsOptional()`, `@IsNumber()`, `@Min(10)`, `@Max(300)`
   - `hips_cm`: number (optional), `@IsOptional()`, `@IsNumber()`, `@Min(10)`, `@Max(300)`
   - `inseam_cm`: number (optional), `@IsOptional()`, `@IsNumber()`, `@Min(10)`, `@Max(200)`
   - `shoulder_width_cm`: number (optional), `@IsOptional()`, `@IsNumber()`, `@Min(5)`, `@Max(100)`
   - `arm_length_cm`: number (optional), `@IsOptional()`, `@IsNumber()`, `@Min(10)`, `@Max(150)`
   - `leg_length_cm`: number (optional), `@IsOptional()`, `@IsNumber()`, `@Min(10)`, `@Max(150)`

2. In `AvatarsService.create(userId: string, dto: CreateAvatarDto)`:
   - Check if user already has an active avatar (`is_active = true`, `deleted_at IS NULL`).
   - If yes, set `is_active = false` on the existing avatar and create a new version record for it.
   - Insert a new avatar record with `user_id = userId`, `is_active = true`.
   - Return the newly created avatar.

3. In `AvatarsController.create()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Body() dto: CreateAvatarDto`.
   - Return HTTP 201 with the created avatar.

## ACCEPTANCE CRITERIA

- `POST /avatars` with valid measurements returns HTTP 201 with the avatar object.
- `POST /avatars` when user already has an avatar deactivates the old one and creates a new one.
- `POST /avatars` with no active avatar creates the first one.
- `POST /avatars` with invalid measurement (e.g., height_cm = 0) returns HTTP 400.
- `POST /avatars` without auth returns HTTP 401.
- Only one avatar has `is_active = true` for the user at any time.

## EDGE CASES

- Creating a new avatar when one already exists: set `is_active = false` on existing, create new with `is_active = true`.
- A version record should be created for the old avatar before deactivation so its state is preserved.
- If the user creates an avatar with no measurements at all, it is valid (avatar URL can be added later).
- Measurements should be rounded to 1 decimal place before storage.

## TESTS REQUIRED

- Unit test: `AvatarsService.create()` deactivates old avatar if exists.
- Unit test: `CreateAvatarDto` validates measurement ranges.
- Integration test: `POST /avatars` returns 201.
- Integration test: `POST /avatars` twice creates two versions, only one active.
- Integration test: `POST /avatars` returns 400 for invalid measurement.

## EXPECTED OUTPUT

- `backend/src/avatars/dto/create-avatar.dto.ts`
- `backend/src/avatars/avatars.service.ts` with `create()` method.
- `backend/src/avatars/avatars.controller.ts` with `POST /avatars`.
- All tests pass.
