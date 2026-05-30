# TASK-005

# Create JWT Refresh Endpoint (POST /auth/refresh)

## OBJECTIVE

Implement the `POST /auth/refresh` endpoint that accepts a valid refresh token, validates it, issues a new JWT access/refresh token pair, and rotates the refresh token by invalidating the old one. This enables users to maintain sessions without re-authenticating.

## CONTEXT FILES

- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/refresh.dto.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/redis/redis.service.ts` (if exists)

## ALLOWED FILES

- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/refresh.dto.ts` (create)
- `backend/src/auth/auth.module.ts`
- `backend/src/redis/redis.service.ts` (if modifying for token storage)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files
- `backend/src/users/users.service.ts`

## REQUIREMENTS

1. Create `RefreshDto` with:
   - `refresh_token`: string, `@IsString()`, `@IsNotEmpty()`

2. In `AuthService.refresh()`:
   - Receive `refresh_token` string from the DTO.
   - Verify the token using `JwtService.verifyAsync()` with `JWT_REFRESH_SECRET` environment variable.
   - Validate that the payload has `type: 'refresh'` (to prevent using an access token as a refresh token).
   - Extract `sub` (user ID) from payload.
   - Check if the user still exists and is not soft-deleted (call `UsersService.findById()`).
   - If user not found or deleted, throw `UnauthorizedException` with `INVALID_REFRESH_TOKEN`.
   - Check if the refresh token has been blacklisted/revoked in Redis (key: `blacklist:refresh:<token_hash>`).
   - If blacklisted, throw `UnauthorizedException` with `TOKEN_REVOKED`.
   - Add the old refresh token to the Redis blacklist with TTL matching the token's original expiration.
   - Generate a new JWT access token (15 minutes) and a new refresh token (7 days).
   - Return `{ access_token, refresh_token, user: { id, email, full_name } }`.

3. In `AuthController.refresh()`:
   - Accept `@Body() refreshDto: RefreshDto`.
   - Return HTTP 200 with the new token pair.

4. Token rotation logic:
   - After successful refresh, the old refresh token is invalidated (added to blacklist).
   - The new refresh token is returned; the client must store it.
   - If a blacklisted token is reused, all tokens for that user should be revoked (potential token theft detection).

## ACCEPTANCE CRITERIA

- `POST /auth/refresh` with a valid refresh token returns HTTP 200 with new `access_token`, `refresh_token`, and `user`.
- The old refresh token becomes invalid and returns HTTP 401 with `TOKEN_REVOKED` if reused.
- `POST /auth/refresh` with an expired refresh token returns HTTP 401 with `TOKEN_EXPIRED`.
- `POST /auth/refresh` with an access token (not a refresh token) returns HTTP 401 with `INVALID_REFRESH_TOKEN`.
- `POST /auth/refresh` with a malformed token returns HTTP 401 with `INVALID_TOKEN`.

## EDGE CASES

- Refresh token must use a separate `JWT_REFRESH_SECRET` from the access token secret.
- If `JWT_REFRESH_SECRET` is not set, use `JWT_SECRET` but log a warning in development.
- The Redis blacklist must set a TTL equal to the remaining lifetime of the old refresh token to prevent unbounded growth.
- Token theft detection: if a blacklisted token is presented, invalidate ALL refresh tokens for that user by incrementing a `token_version` counter in Redis.
- Refresh token must be hashed before storing in blacklist (store `SHA256(token)` not the raw token).

## TESTS REQUIRED

- Unit test: `AuthService.refresh()` returns a new token pair for valid refresh token.
- Unit test: `AuthService.refresh()` throws `UnauthorizedException` for expired token.
- Unit test: `AuthService.refresh()` throws `UnauthorizedException` for access token.
- Unit test: `AuthService.refresh()` throws `UnauthorizedException` for blacklisted token.
- Unit test: Old token is added to blacklist after successful refresh.
- Integration test: Full refresh cycle with supertest.
- Integration test: Reuse of old refresh token after refresh returns 401.

## EXPECTED OUTPUT

- `backend/src/auth/dto/refresh.dto.ts` with validation.
- Updated `backend/src/auth/auth.service.ts` with `refresh()` method.
- Updated `backend/src/auth/auth.controller.ts` with `POST /auth/refresh` handler.
- All tests pass.
