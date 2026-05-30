# TASK-055

# Create Global Exception Filter

## OBJECTIVE

Create a NestJS global exception filter that catches all unhandled exceptions and returns a consistent JSON error response format. This ensures all API errors follow the same structure regardless of where they originate.

## CONTEXT FILES

- `backend/src/common/filters/global-exception.filter.ts`
- `backend/src/app.module.ts`

## ALLOWED FILES

- `backend/src/common/filters/global-exception.filter.ts` (create)
- `backend/src/app.module.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `GlobalExceptionFilter` implementing `ExceptionFilter`:
   - Catch all exceptions using `@Catch()` (no specific exception type — catch everything).
   - For each exception, build a consistent response:

   ```json
   {
     "status": 400,
     "code": "VALIDATION_ERROR",
     "message": "Validation failed",
     "details": [
       { "field": "email", "message": "email must be an email", "code": "IS_EMAIL" }
     ],
     "timestamp": "2026-05-25T12:00:00.000Z",
     "path": "/auth/register"
   }
   ```

2. Handle specific exception types:
   - `HttpException`: Extract status, message, and response. Use the `code` from the response if available, otherwise derive from status.
   - `BadRequestException` (validation errors): Format validation errors from class-validator into the `details` array with `field`, `message`, `code`.
   - `UnauthorizedException`: Return `{ status: 401, code: "UNAUTHORIZED", message }`.
   - `NotFoundException`: Return `{ status: 404, code: "NOT_FOUND", message }`.
   - `ConflictException`: Return `{ status: 409, code: "CONFLICT", message }`.
   - `ThrottlerException` (rate limit): Return `{ status: 429, code: "TOO_MANY_REQUESTS", message: "Too many requests" }`.
   - Validation errors from `ValidationPipe`: Parse the nested error structure into `details`.
   - Unknown errors (5xx): Return `{ status: 500, code: "INTERNAL_ERROR", message: "An unexpected error occurred" }`. Log the original error. Never expose internal error details in production.

3. In `AppModule`:
   - Register the filter globally using `APP_FILTER`.

4. Logging:
   - Log all errors with stack traces (use NestJS Logger).
   - Log level: `warn` for 4xx, `error` for 5xx.

## ACCEPTANCE CRITERIA

- `BadRequestException` returns `{ status: 400, code: "BAD_REQUEST", message, details: [...] }`.
- `UnauthorizedException` returns `{ status: 401, code: "UNAUTHORIZED", message }`.
- `NotFoundException` returns `{ status: 404, code: "NOT_FOUND", message }`.
- `ConflictException` returns `{ status: 409, code: "CONFLICT", message }`.
- Rate limit errors return `{ status: 429, code: "TOO_MANY_REQUESTS", message }`.
- Unknown errors return `{ status: 500, code: "INTERNAL_ERROR", message: "An unexpected error occurred" }`.
- Validation errors from DTOs include `details` array with field-level errors.
- Timestamp is ISO 8601 format.
- Path reflects the original request URL.
- Internal error details are not exposed in production (`NODE_ENV=production`).

## EDGE CASES

- If the original exception has a custom response object, merge it with the standard format.
- GraphQL errors (if applicable) should be handled separately by the GraphQL plugin.
- WebSocket exceptions should use a different format (not handled by this HTTP filter).
- The filter must not break if `response` has unexpected properties.
- In development mode (`NODE_ENV=development`), include the stack trace in the error response.

## TESTS REQUIRED

- Unit test: `GlobalExceptionFilter` formats HttpException correctly.
- Unit test: `GlobalExceptionFilter` formats validation errors with details array.
- Unit test: `GlobalExceptionFilter` hides internal details in production.
- Integration test: Invalid request returns consistent error format.
- Integration test: Rate limited request returns 429 format.

## EXPECTED OUTPUT

- `backend/src/common/filters/global-exception.filter.ts`
- Updated `backend/src/app.module.ts` with global filter registration.
- All tests pass.
