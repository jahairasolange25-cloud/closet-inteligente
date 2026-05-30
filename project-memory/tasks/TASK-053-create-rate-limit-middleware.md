# TASK-053

# Create Rate Limit Middleware using Redis

## OBJECTIVE

Create a NestJS rate limit guard that uses Redis to enforce per-IP and per-user rate limits across all endpoints. The guard supports configurable limits and TTL durations, with route-specific overrides.

## CONTEXT FILES

- `backend/src/common/guards/rate-limit.guard.ts`
- `backend/src/redis/redis.service.ts`
- `backend/src/redis/redis.module.ts`
- `backend/src/app.module.ts`
- `backend/package.json` (check for @nestjs/throttler, ioredis)

## ALLOWED FILES

- `backend/src/common/guards/rate-limit.guard.ts` (create)
- `backend/src/common/decorators/rate-limit.decorator.ts` (create)
- `backend/src/app.module.ts`
- `backend/src/redis/redis.service.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `@RateLimit()` decorator:
   - Accepts `{ limit: number, ttl: number }` (ttl in milliseconds).
   - Stores metadata on the handler using `SetMetadata`.
   - Default: 60 requests per 60 seconds.

2. Create `RateLimitGuard` implementing `CanActivate`:
   - Extract client IP from `request.ip` or `request.headers['x-forwarded-for']`.
   - Extract user ID from `request.user?.id` (if authenticated).
   - Build a unique key: `rate_limit:<identifier>:<route>` where identifier is `userId` (if authenticated) or `ip`.
   - Use Redis `INCR` on the key with TTL set from the decorator (or default).
   - If count exceeds limit, throw `HttpException` with status 429 and `TOO_MANY_REQUESTS`.
   - Include headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

3. Configure in `AppModule`:
   - Register `RateLimitGuard` as a global guard.
   - Configure default limits in environment variables:
     - `RATE_LIMIT_DEFAULT_LIMIT` (default 60).
     - `RATE_LIMIT_DEFAULT_TTL` (default 60000 — 60 seconds).

4. Bypass rules:
   - Health check endpoints (`/health`) bypass rate limiting.
   - `POST /auth/login` has its own stricter rate limit (5 per 15 minutes).

## ACCEPTANCE CRITERIA

- Requests within the rate limit pass through normally.
- Request exceeding the limit returns HTTP 429 with `TOO_MANY_REQUESTS`.
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers are included.
- Rate limit is enforced per-IP for unauthenticated requests.
- Rate limit is enforced per-user-ID for authenticated requests.
- `/health` endpoint bypasses rate limiting.
- `POST /auth/login` has its own limit (5 per 15 min).
- When Redis is unavailable, rate limiting degrades gracefully (allow requests and log warning).

## EDGE CASES

- If `x-forwarded-for` header contains multiple IPs (comma-separated), use the first one.
- The TTL must be set on the first request (when key does not exist) using Redis `SETEX` or `EXPIRE`.
- Race condition: use Redis `MULTI`/`EXEC` or Lua scripting to ensure atomic increment + expire.
- Rate limit reset time is `current_time + ttl` (the time when the counter will reset).
- Redis keys must be prefixed with `rate_limit:` for namespace isolation.

## TESTS REQUIRED

- Unit test: `RateLimitGuard` increments counter and checks limit.
- Unit test: `RateLimitGuard` returns 429 when limit exceeded.
- Unit test: `RateLimitGuard` sets correct headers.
- Unit test: `RateLimitGuard` bypasses health endpoint.
- Integration test: Rapid requests return 429.
- Integration test: Rate limit resets after TTL.

## EXPECTED OUTPUT

- `backend/src/common/guards/rate-limit.guard.ts`
- `backend/src/common/decorators/rate-limit.decorator.ts`
- Updated `backend/src/app.module.ts` with global guard registration.
- All tests pass.
