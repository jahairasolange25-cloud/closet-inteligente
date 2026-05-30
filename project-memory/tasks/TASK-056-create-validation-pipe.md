# TASK-056

# Create Global Validation Pipe with Custom Error Messages

## OBJECTIVE

Create a global NestJS validation pipe that validates incoming request bodies and query parameters using class-validator decorators. The pipe provides custom, user-friendly error messages tailored to the platform's domain.

## CONTEXT FILES

- `backend/src/common/pipes/global-validation.pipe.ts`
- `backend/src/app.module.ts`
- `backend/package.json` (check for class-validator, class-transformer)

## ALLOWED FILES

- `backend/src/common/pipes/global-validation.pipe.ts` (create)
- `backend/src/app.module.ts`
- `backend/src/common/exceptions/validation-error.exception.ts` (create if needed)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `GlobalValidationPipe` extending `ValidationPipe` (from `@nestjs/common`):
   - Configuration:
     - `whitelist: true` — strip unknown properties.
     - `forbidNonWhitelisted: true` — throw error if unknown properties are sent.
     - `transform: true` — auto-transform types (string to number, etc.).
     - `transformOptions: { enableImplicitConversion: false }` — explicit conversion only.
     - `disableErrorMessages: false` (controlled by `NODE_ENV`).
     - `validationError: { target: false, value: false }` — clean error output.

2. Custom error message factory:
   - Override `exceptionFactory` to map validation errors to domain-specific messages:
     - `isEmail`: `"The email format is invalid"`.
     - `isNotEmpty`: `"{field} is required"`.
     - `minLength`: `"{field} must be at least {constraints[0]} characters"`.
     - `maxLength`: `"{field} must not exceed {constraints[0]} characters"`.
     - `isEnum`: `"Invalid value for {field}. Allowed values: {constraints[0].join(', ')}"`.
     - `isUUID`: `"Invalid UUID format for {field}"`.
     - `arrayMinSize`: `"At least {constraints[0]} items required in {field}"`.
     - `arrayMaxSize`: `"Maximum {constraints[0]} items allowed in {field}"`.
     - `isUrl`: `"Invalid URL format for {field}"`.
     - Default: `"Validation failed for {field}"`.

3. In `AppModule`:
   - Register the pipe globally using `APP_PIPE`.

4. Whitelist handling:
   - If `forbidNonWhitelisted: true`, return error with code `UNKNOWN_FIELD` and the unknown field name.
   - Example: `{ status: 400, code: "UNKNOWN_FIELD", message: "Unknown field 'invalidField' is not allowed" }`.

## ACCEPTANCE CRITERIA

- A request with missing required field returns `{ status: 400, details: [{ field: "email", message: "email is required" }] }`.
- A request with invalid email returns `{ status: 400, details: [{ field: "email", message: "The email format is invalid" }] }`.
- A request with short password returns `{ status: 400, details: [{ field: "password", message: "password must be at least 8 characters" }] }`.
- A request with extra unknown field returns `{ status: 400, code: "UNKNOWN_FIELD", message: "Unknown field 'extraField' is not allowed" }`.
- A request with invalid UUID returns `{ status: 400, details: [{ field: "id", message: "Invalid UUID format for id" }] }`.
- All validation error responses follow the format defined in TASK-055.
- Type transformation works (string "123" becomes number 123).

## EDGE CASES

- Nested validation (arrays of objects) should produce flattened or nested error messages.
- Error messages must use the field name as defined in the DTO, not the internal property name.
- In production (`NODE_ENV=production`), disable detailed error messages but still show field names.
- Unknown field rejection must be clear so the frontend developer can identify the issue.

## TESTS REQUIRED

- Unit test: Pipe transforms types correctly (string to number).
- Unit test: Pipe strips unknown fields.
- Unit test: Pipe rejects unknown fields with `UNKNOWN_FIELD`.
- Unit test: Custom error messages match expected format.
- Integration test: POST /auth/register with invalid email returns correct error.

## EXPECTED OUTPUT

- `backend/src/common/pipes/global-validation.pipe.ts`
- Updated `backend/src/app.module.ts` with global pipe registration.
- All tests pass.
