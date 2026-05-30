# TASK-003

# Create User Login Endpoint (POST /auth/login)

## OBJECTIVE

Implement the `POST /auth/login` endpoint that authenticates existing users by verifying their email and password against stored credentials. On success, return a JWT access/refresh token pair. Implement rate limiting to prevent brute-force attacks.

## CONTEXT FILES

- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/users/users.service.ts`
- `backend/src/common/guards/throttler.guard.ts` (if exists) or `backend/src/common/guards/throttle.decorator.ts`
- `backend/package.json` (check for @nestjs/throttler, ioredis)
- `backend/src/app.module.ts`

## ALLOWED FILES

- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/common/guards/throttle.decorator.ts` (create if needed)
- `backend/src/app.module.ts` (only to register ThrottlerModule)
- `backend/src/auth/auth.module.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files
- `backend/src/users/users.service.ts` (do not modify)

## REQUIREMENTS

1. Create `LoginDto` with:
   - `email`: string, `@IsEmail()`, `@IsNotEmpty()`
   - `password`: string, `@IsString()`, `@IsNotEmpty()`

2. In `AuthService.login()`:
   - Retrieve user by email using `UsersService.findByEmail()`
   - If user not found, throw `UnauthorizedException` (HTTP 401) with message `INVALID_CREDENTIALS`
   - If user is soft-deleted (`deleted_at` is not null), throw `UnauthorizedException` with message `ACCOUNT_DISABLED`
   - Compare password using `bcrypt.compare(password, user.password_hash)`
   - If password does not match, throw `UnauthorizedException` with message `INVALID_CREDENTIALS`
   - Generate JWT access token (payload: `{ sub: user.id, email: user.email }`, expires in 15 minutes)
   - Generate JWT refresh token (payload: `{ sub: user.id, type: 'refresh' }`, expires in 7 days)
   - Return `{ access_token, refresh_token, user: { id, email, full_name } }`

3. In `AuthController.login()`:
   - Accept `@Body() loginDto: LoginDto`
   - Return HTTP 200 with tokens
   - Apply `@Throttle({ default: { limit: 5, ttl: 900000 } })` (5 requests per 15 minutes) on this endpoint

4. Register `ThrottlerModule` in `AppModule`:
   - Use `@nestjs/throttler` with Redis store
   - Global limit: 60 requests per minute
   - Override for `/auth/login` to 5 per 15 minutes via `@Throttle()` decorator or route-specific configuration

## ACCEPTANCE CRITERIA

- `POST /auth/login` with valid credentials returns HTTP 200 with `{ access_token, refresh_token, user }`.
- `POST /auth/login` with wrong password returns HTTP 401 with code `INVALID_CREDENTIALS`.
- `POST /auth/login` with non-existent email returns HTTP 401 with code `INVALID_CREDENTIALS` (same message to avoid user enumeration).
- `POST /auth/login` for soft-deleted account returns HTTP 401 with code `ACCOUNT_DISABLED`.
- Exceeding 5 attempts in 15 minutes returns HTTP 429 with `TooManyRequests`.
- The response message for invalid credentials is identical regardless of whether the email exists or the password is wrong.

## EDGE CASES

- Login attempt timing must be constant-time: always compute bcrypt hash comparison even if user does not exist (to prevent timing attacks).
- Use `bcrypt.compare()` which is already constant-time, but ensure the code path does not short-circuit.
- Rate limit must be per-IP + per-email combination to prevent distributed brute-force.
- After successful login, reset the rate limit counter for that IP+email.
- If Redis is unavailable, rate limiter should degrade gracefully (allow requests) rather than block all logins.

## TESTS REQUIRED

- Unit test: `AuthService.login()` returns tokens for valid credentials.
- Unit test: `AuthService.login()` throws `UnauthorizedException` for invalid email.
- Unit test: `AuthService.login()` throws `UnauthorizedException` for wrong password.
- Unit test: `AuthService.login()` throws `UnauthorizedException` for deleted account.
- Integration test: Full login flow with supertest, verify cookie/token in response.
- Integration test: Rate limit exceeded returns 429.
- Integration test: Verify rate limit resets after successful login.

## EXPECTED OUTPUT

- `backend/src/auth/dto/login.dto.ts` with validation decorators.
- `backend/src/auth/auth.service.ts` with `login()` method implemented.
- `backend/src/auth/auth.controller.ts` with `login()` route handler and throttle decorator.
- `backend/src/app.module.ts` (or `backend/src/auth/auth.module.ts`) with ThrottlerModule configuration.
- All tests pass.
