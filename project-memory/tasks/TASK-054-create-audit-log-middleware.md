# TASK-054

# Create Audit Log Interceptor

## OBJECTIVE

Create a NestJS interceptor that logs all API requests and responses for audit purposes. The interceptor captures request details (method, URL, user, IP), response status, execution time, and writes structured audit logs.

## CONTEXT FILES

- `backend/src/common/interceptors/audit-log.interceptor.ts`
- `backend/src/redis/redis.service.ts`
- `backend/src/app.module.ts`

## ALLOWED FILES

- `backend/src/common/interceptors/audit-log.interceptor.ts` (create)
- `backend/src/redis/redis.service.ts`
- `backend/src/app.module.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `AuditLogInterceptor` implementing `NestInterceptor`:
   - On request:
     - Record start time (`Date.now()`).
     - Capture: HTTP method, URL, query params, request body (sanitized), user ID (if authenticated), IP address, User-Agent.
   - On response:
     - Calculate execution time.
     - Capture: HTTP status code, response body (truncated to 1000 chars).
   - Structure the log entry:
     ```json
     {
       "timestamp": "ISO string",
       "method": "POST",
       "url": "/auth/login",
       "status": 200,
       "execution_ms": 145,
       "user_id": "uuid or null",
       "ip": "127.0.0.1",
       "user_agent": "Mozilla/...",
       "body": { "email": "user@example.com", "password": "***" },
       "response": { "access_token": "***" }
     }
     ```

2. Sanitization rules:
   - Mask password fields: replace with `"***"`.
   - Mask tokens: replace with `"***"`.
   - Truncate large request bodies (>10KB).
   - Never log raw file uploads.

3. Log destination:
   - Write to a structured log file (`logs/audit-<date>.jsonl`) — one JSON object per line.
   - Also publish to Redis list `audit:log` for real-time consumption (if Redis available).
   - In production, logs are consumed by an external SIEM (document this).

4. Exclude from audit logging:
   - Health check endpoints (`/health`).
   - WebSocket upgrade requests.
   - Static file requests.

5. Configure in `AppModule`:
   - Apply the interceptor globally.

## ACCEPTANCE CRITERIA

- Every API request is logged with the structured format.
- Password fields are masked as `"***"`.
- Token fields are masked as `"***"`.
- Execution time is measured in milliseconds.
- `/health` endpoint is not logged.
- The log file is created in the `logs/` directory.
- If the log file cannot be written, the request still succeeds (graceful degradation).

## EDGE CASES

- File upload requests should log the filename and size, but not the file content.
- Requests with extremely large bodies (>10KB) should truncate the logged body.
- User ID will be null for unauthenticated requests.
- IP address should respect `x-forwarded-for` header when behind a proxy.
- The log file should rotate daily (handled by the logging system, not the interceptor).

## TESTS REQUIRED

- Unit test: `AuditLogInterceptor` logs request with correct structure.
- Unit test: `AuditLogInterceptor` masks password fields.
- Unit test: `AuditLogInterceptor` skips health endpoint.
- Integration test: Request generates audit log entry.

## EXPECTED OUTPUT

- `backend/src/common/interceptors/audit-log.interceptor.ts`
- Updated `backend/src/app.module.ts` with global interceptor.
- All tests pass.
