# TASK-006

# Create User Profile Endpoints (GET /auth/me and PATCH /auth/me)

## OBJECTIVE

Implement `GET /auth/me` to return the authenticated user's profile and `PATCH /auth/me` to update profile fields (full_name, avatar_url). Both endpoints are protected by the JWT authentication guard.

## CONTEXT FILES

- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/update-profile.dto.ts`
- `backend/src/users/users.service.ts`
- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/common/decorators/current-user.decorator.ts`

## ALLOWED FILES

- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/update-profile.dto.ts` (create)
- `backend/src/users/users.service.ts` (if extending with `updateProfile()` method)
- `backend/src/users/users.module.ts` (if needed)
- `backend/src/auth/auth.module.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files
- `backend/src/common/guards/`

## REQUIREMENTS

1. Create `UpdateProfileDto` with:
   - `full_name`: string (optional), decorated with `@IsOptional()`, `@IsString()`, `@MinLength(2)`, `@MaxLength(150)`
   - `avatar_url`: string (optional), decorated with `@IsOptional()`, `@IsUrl()`, `@MaxLength(2048)`

2. In `AuthService.getProfile(userId: string)`:
   - Call `UsersService.findById(userId)`.
   - If user not found, throw `NotFoundException` with `USER_NOT_FOUND`.
   - Return `{ id, email, full_name, avatar_url, created_at }`.
   - Never return `password_hash` or `deleted_at`.

3. In `AuthService.updateProfile(userId: string, dto: UpdateProfileDto)`:
   - Call `UsersService.updateProfile(userId, dto)` which performs the database update.
   - Return the updated user profile (re-fetch from DB to confirm).

4. In `UsersService`:
   - Add `updateProfile(id: string, data: { full_name?: string; avatar_url?: string })` that:
     - Filters out `undefined` values to avoid overwriting with NULL.
     - Builds a dynamic UPDATE query/SQL.
     - Returns the updated user.

5. In `AuthController`:
   - `GET /auth/me`: Use `@UseGuards(JwtAuthGuard)`, inject user via `@CurrentUser()`, call `AuthService.getProfile(user.id)`.
   - `PATCH /auth/me`: Use `@UseGuards(JwtAuthGuard)`, inject user via `@CurrentUser()`, accept `@Body() dto: UpdateProfileDto`, call `AuthService.updateProfile(user.id, dto)`.

## ACCEPTANCE CRITERIA

- `GET /auth/me` without a token returns HTTP 401.
- `GET /auth/me` with a valid token returns HTTP 200 with `{ id, email, full_name, avatar_url, created_at }`.
- `PATCH /auth/me` with a valid `full_name` returns HTTP 200 with the updated profile.
- `PATCH /auth/me` with a valid `avatar_url` returns HTTP 200 with the updated profile.
- `PATCH /auth/me` with both fields updates both.
- `PATCH /auth/me` with an empty body does nothing and returns the current profile.
- `PATCH /auth/me` with an invalid URL returns HTTP 400.
- `PATCH /auth/me` with a `full_name` shorter than 2 characters returns HTTP 400.

## EDGE CASES

- `PATCH /auth/me` must only update fields that are provided; if `full_name` is not in the request, do not overwrite it.
- The `avatar_url` field must be a valid URL (use `@IsUrl()` with `require_tld: true`).
- `full_name` with only whitespace must be rejected (use `@IsNotEmpty()` after `@IsOptional()` on the same field with a custom validator group).
- If the user was deleted between fetching the profile and updating, the update should throw `NotFoundException`.
- `avatar_url` should be sanitized against XSS (though storing URLs in the database should be safe, use URL validation).

## TESTS REQUIRED

- Unit test: `AuthService.getProfile()` returns user data without password_hash.
- Unit test: `AuthService.getProfile()` throws `NotFoundException` for missing user.
- Unit test: `AuthService.updateProfile()` updates only provided fields.
- Unit test: `UpdateProfileDto` accepts valid data, rejects invalid.
- Integration test: `GET /auth/me` with token returns 200.
- Integration test: `GET /auth/me` without token returns 401.
- Integration test: `PATCH /auth/me` updates full_name.
- Integration test: `PATCH /auth/me` partial update preserves other fields.

## EXPECTED OUTPUT

- `backend/src/auth/dto/update-profile.dto.ts`
- Updated `backend/src/auth/auth.service.ts` with `getProfile()` and `updateProfile()`.
- Updated `backend/src/auth/auth.controller.ts` with `GET /auth/me` and `PATCH /auth/me`.
- Updated `backend/src/users/users.service.ts` with `updateProfile()` method.
- All tests pass.
