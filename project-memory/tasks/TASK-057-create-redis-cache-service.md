# TASK-057

# Create Redis Cache Service with TTL Configuration

## OBJECTIVE

Create a Redis cache service abstracting common caching operations with configurable TTL. The service supports get, set, delete, and cache-aside pattern with automatic serialization/deserialization of JSON data.

## CONTEXT FILES

- `backend/src/redis/redis.service.ts`
- `backend/src/redis/redis.module.ts`
- `backend/.env`
- `backend/package.json` (check for ioredis, @nestjs/bull)

## ALLOWED FILES

- `backend/src/redis/redis.service.ts`
- `backend/src/redis/redis.module.ts`
- `backend/.env` (add Redis config)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `RedisService`:
   - Implement `OnModuleInit` and `OnModuleDestroy` for lifecycle management.
   - Connect to Redis using `ioredis` with configuration from environment:
     - `REDIS_HOST` (default: `'localhost'`)
     - `REDIS_PORT` (default: `6379`)
     - `REDIS_PASSWORD` (default: none)
     - `REDIS_DB` (default: `0`)
     - `REDIS_KEY_PREFIX` (default: `'closet:'`)

2. Methods:

   a. `get<T>(key: string): Promise<T | null>`:
      - Get value from Redis, parse JSON and return.
      - Return `null` if key does not exist.

   b. `set(key: string, value: any, ttl?: number): Promise<void>`:
      - Serialize value to JSON.
      - Store in Redis with optional TTL in seconds.
      - If no TTL provided, use a default of 300 seconds (5 minutes).

   c. `delete(key: string): Promise<void>`:
      - Delete a single key.

   d. `deletePattern(pattern: string): Promise<void>`:
      - Use `SCAN` to find keys matching pattern and delete them.
      - Example: `deletePattern('garments:*')` clears all garment cache entries.

   e. `getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>`:
      - Cache-aside pattern: try `get()`, if null, call `factory()`, store result via `set()`, return result.
      - If `factory()` throws, do NOT cache the error.

   f. `increment(key: string, ttl?: number): Promise<number>`:
      - Atomic increment with EXPIRE for rate limiting.

   g. `exists(key: string): Promise<boolean>`.

3. Key naming convention:
   - Prepend `REDIS_KEY_PREFIX` to all keys.
   - Use colon-separated namespaces: `{prefix}:garments:{userId}:list`, `{prefix}:garments:{userId}:{garmentId}`.

4. Error handling:
   - If Redis is unreachable, all methods should degrade gracefully:
     - `get()` returns `null`.
     - `set()` logs a warning and returns.
     - `delete()` logs a warning.
     - `getOrSet()` calls `factory()` and returns its result (no caching).
   - Do NOT throw errors when Redis is down (the application should still function).

## ACCEPTANCE CRITERIA

- `RedisService.get()` returns parsed value for existing key.
- `RedisService.get()` returns `null` for non-existing key.
- `RedisService.set()` stores serialized JSON with TTL.
- `RedisService.delete()` removes key.
- `RedisService.deletePattern()` removes keys matching pattern.
- `RedisService.getOrSet()` caches factory result and returns cached value on subsequent calls.
- `RedisService.getOrSet()` calls factory again after TTL expires.
- `RedisService.increment()` atomically increments and sets expiry.
- All methods gracefully handle Redis connection errors.
- Keys are namespaced with `REDIS_KEY_PREFIX`.

## EDGE CASES

- TTL must be in seconds (not milliseconds).
- If `ttl = 0`, the key should persist indefinitely (no expiry).
- Serialization must handle `null` and `undefined` values.
- `get()` returning `null` vs `null` stored as value: differentiate with a special flag if needed.
- Concurrent `getOrSet()` calls for the same key should not call `factory()` multiple times (use a mutex or deduplication — optional for MVP, document as known limitation).

## TESTS REQUIRED

- Unit test: `RedisService.set()` and `get()` round-trip correctly.
- Unit test: `RedisService.get()` returns null for missing key.
- Unit test: `RedisService.getOrSet()` caches and returns factory result.
- Unit test: `RedisService.getOrSet()` bypasses cache when Redis is down.
- Unit test: `RedisService.deletePattern()` works with glob patterns.
- Integration test: Full Redis operation cycle with actual Redis.

## EXPECTED OUTPUT

- `backend/src/redis/redis.service.ts`
- Updated `backend/src/redis/redis.module.ts`
- Updated `backend/.env` with Redis configuration variables.
- Environment variables documented in `.env.example`.
- All tests pass.
