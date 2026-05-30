# TASK-002

# Create User Registration Endpoint (POST /auth/register)

## OBJECTIVE

Implement the `POST /auth/register` endpoint that allows new users to create an account. The endpoint accepts email, password, and full name; validates input; hashes the password with bcrypt; inserts the user into the database; and returns a JWT access/refresh token pair.

## CONTEXT FILES

- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/users.module.ts`
- `backend/src/database/database.module.ts`
- `backend/package.json` (check for bcrypt, @nestjs/jwt, class-validator)

## ALLOWED FILES

- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/dto/` (any new DTO)
- `backend/src/users/users.service.ts`
- `backend/src/users/users.module.ts`
- `backend/src/common/decorators/` (if needed)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any migration or database schema files
- Any configuration files (`.env`, `docker-compose.yml`)

## REQUIREMENTS

1. Create `RegisterDto` with:
   - `email`: string, decorated with `@IsEmail()`, `@IsNotEmpty()`, `@MaxLength(255)`
   - `password`: string, decorated with `@IsString()`, `@MinLength(8)`, `@MaxLength(128)`, `@Matches(/(?=.*[A-Z])(?=.*\d)/, { message: 'Password must contain at least one uppercase letter and one number' })`
   - `full_name`: string, decorated with `@IsString()`, `@IsNotEmpty()`, `@MinLength(2)`, `@MaxLength(150)`

2. In `AuthService.register()`:
   - Check if a user with the given email already exists by calling `UsersService.findByEmail()`
   - If exists, throw `ConflictException` (HTTP 409) with message `EMAIL_ALREADY_REGISTERED`
   - Hash the password using `bcrypt.hash(password, 12)` salt rounds
   - Call `UsersService.create({ email, password_hash, full_name })` to persist the user
   - Generate a JWT access token (payload: `{ sub: user.id, email: user.email }`, expires in 15 minutes)
   - Generate a JWT refresh token (payload: `{ sub: user.id, type: 'refresh' }`, expires in 7 days)
   - Return `{ access_token, refresh_token, user: { id, email, full_name } }`

3. In `AuthController.register()`:
   - Accept `@Body() registerDto: RegisterDto`
   - Return `201 Created` with the token and user payload
   - Do NOT return the `password_hash` in any response

4. Configure the `AuthModule` to import `UsersModule` and `JwtModule` (from `@nestjs/jwt`).

5. Configure `JwtModule` with:
   - `secret`: from `process.env.JWT_SECRET` (fallback: throw error if missing)
   - `signOptions: { expiresIn: '15m' }` (access token default)

## ACCEPTANCE CRITERIA

- `POST /auth/register` with valid data returns HTTP 201 with `{ access_token, refresh_token, user: { id, email, full_name } }`.
- `POST /auth/register` with invalid email returns HTTP 400 with validation error.
- `POST /auth/register` with password shorter than 8 characters returns HTTP 400.
- `POST /auth/register` with password missing uppercase letter returns HTTP 400.
- `POST /auth/register` with password missing number returns HTTP 400.
- `POST /auth/register` with duplicate email returns HTTP 409 with code `EMAIL_ALREADY_REGISTERED`.
- The `password_hash` column in the database stores a bcrypt hash (starts with `$2b$`).
- The response object never contains `password_hash`.

## EDGE CASES

- Email must be trimmed before validation and storage.
- Email must be stored in original case but compared case-insensitively in the duplicate check.
- Full name with leading/trailing spaces should be trimmed.
- Password must never appear in logs (use class-validator's `@Transform` or a custom pipe to sanitize).
- Refresh token must use a separate secret or a distinct `type` field in payload to prevent using an access token as a refresh token.

## TESTS REQUIRED

- Unit test: `AuthService.register()` calls `UsersService.findByEmail()` exactly once.
- Unit test: `AuthService.register()` throws `ConflictException` when email exists.
- Unit test: `AuthService.register()` returns object with `access_token` and `refresh_token`.
- Unit test: `RegisterDto` fails validation for missing email, invalid email, short password, weak password.
- Integration test: Full request-response cycle with supertest, verify 201 response.
- Integration test: Duplicate registration returns 409.

## EXPECTED OUTPUT

- `backend/src/auth/dto/register.dto.ts` with validation decorators.
- `backend/src/auth/auth.service.ts` with `register()` method implemented.
- `backend/src/auth/auth.controller.ts` with `register()` route handler.
- All tests pass (`npm run test -- --testPathPattern=auth`).
