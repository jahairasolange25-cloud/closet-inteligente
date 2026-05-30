# TASK-004

# Create JWT Authentication Guard

## OBJECTIVE

Create a NestJS `AuthGuard` that validates JWT access tokens from incoming HTTP requests. The guard extracts the token from the `Authorization` header, verifies the signature and expiration using the configured secret, and attaches the decoded user payload to the request object for downstream use. Return 401 for missing, expired, or invalid tokens.

## CONTEXT FILES

- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/common/guards/` (existing guards directory)
- `backend/src/common/decorators/` (existing decorators)
- `backend/.env` (JWT_SECRET and JWT_REFRESH_SECRET)

## ALLOWED FILES

- `backend/src/common/guards/jwt-auth.guard.ts` (create)
- `backend/src/common/decorators/current-user.decorator.ts` (create)
- `backend/src/auth/auth.module.ts`
- `backend/src/app.module.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- Any database or migration files

## REQUIREMENTS

1. Create `JwtAuthGuard` extending NestJS `AuthGuard('jwt')`:
   - Override `canActivate()` to call `super.canActivate()` and handle errors.
   - Extract token from `Authorization: Bearer <token>` header.
   - Validate the token using `@nestjs/jwt` `JwtService.verifyAsync()`.
   - Verify that the decoded payload contains `sub` (user ID) and `email` fields.
   - If token is expired, throw `UnauthorizedException` with message `TOKEN_EXPIRED`.
   - If token is malformed or invalid, throw `UnauthorizedException` with message `INVALID_TOKEN`.
   - If no token present, throw `UnauthorizedException` with message `MISSING_TOKEN`.
   - On success, set `request.user = { id: payload.sub, email: payload.email }`.

2. Create `CurrentUser` parameter decorator:
   - Use `createParamDecorator` from `@nestjs/common`.
   - Extract `user` from `request.user`.
   - Support optional property extraction: `@CurrentUser('email')` returns only the email.
   - Default to returning the full `user` object if no property key is given.

3. Configure `JwtModule` in `AuthModule`:
   - `secret`: from `process.env.JWT_SECRET`
   - If `JWT_SECRET` is not set, throw a clear configuration error at startup (use a factory provider).

4. The guard must be globally usable by adding `@UseGuards(JwtAuthGuard)` to controllers or by registering it globally in `AppModule`.

5. Token blacklisting: the guard itself does NOT check blacklists (that is a separate logout concern), but it must be designed so that a blacklist check can be injected later (leave a comment or abstract method).

## ACCEPTANCE CRITERIA

- A valid token in `Authorization: Bearer <token>` passes the guard and sets `request.user`.
- An expired token returns HTTP 401 with `TOKEN_EXPIRED`.
- A malformed token returns HTTP 401 with `INVALID_TOKEN`.
- Missing `Authorization` header returns HTTP 401 with `MISSING_TOKEN`.
- `@CurrentUser()` in a controller parameter returns full `{ id, email }` object.
- `@CurrentUser('email')` returns only the string email.
- `@CurrentUser('id')` returns only the string UUID.

## EDGE CASES

- Token with `Bearer` missing (e.g., just the token string) must still be handled gracefully.
- Token with extra whitespace must be trimmed.
- Token signed with a different secret must fail verification.
- Token with missing `sub` field but valid signature must be rejected (require `sub`).
- `Bearer` prefix is case-insensitive per RFC 7235 but accept only `Bearer` (standard).

## TESTS REQUIRED

- Unit test: `JwtAuthGuard` returns true for a valid JWT.
- Unit test: `JwtAuthGuard` throws `UnauthorizedException` for expired JWT.
- Unit test: `JwtAuthGuard` throws `UnauthorizedException` for malformed JWT.
- Unit test: `JwtAuthGuard` throws `UnauthorizedException` for missing header.
- Unit test: `CurrentUser` decorator returns the full user object.
- Unit test: `CurrentUser('email')` returns only the email string.
- Integration test: Protected route returns 200 with valid token.
- Integration test: Protected route returns 401 without token.

## EXPECTED OUTPUT

- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/common/decorators/current-user.decorator.ts`
- Updated `backend/src/auth/auth.module.ts` with JwtModule configuration.
- All tests pass.
