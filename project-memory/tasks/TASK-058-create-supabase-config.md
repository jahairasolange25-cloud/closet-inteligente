# TASK-058

# Create Supabase Client Configuration for Backend

## OBJECTIVE

Create the Supabase client configuration for the backend to handle authentication, database connections, and real-time subscriptions. The configuration supports both service-role (admin) and anon (public) clients.

## CONTEXT FILES

- `backend/src/supabase/supabase.module.ts`
- `backend/src/supabase/supabase.service.ts`
- `backend/.env`
- `backend/package.json` (check for @supabase/supabase-js)

## ALLOWED FILES

- `backend/src/supabase/supabase.module.ts`
- `backend/src/supabase/supabase.service.ts`
- `backend/.env`
- `backend/src/app.module.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `SupabaseService`:
   - Inject configuration from environment:
     - `SUPABASE_URL` (required)
     - `SUPABASE_ANON_KEY` (required)
     - `SUPABASE_SERVICE_ROLE_KEY` (required for admin operations)
   - Create two Supabase clients:

     a. `publicClient`: Created with `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
        - Used for operations that respect RLS.
        - Include `auth` configuration.

     b. `adminClient`: Created with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
        - Used for operations that bypass RLS (server-to-server).
        - Include `auth` configuration with `autoRefreshToken: false` and `persistSession: false`.

   - Both clients should use the default region (no custom `db` schema).

2. Methods:
   - `getPublicClient()`: Returns the anon client.
   - `getAdminClient()`: Returns the service-role client.
   - `getClient(useAdmin?: boolean)`: Returns the appropriate client based on flag.

3. Create `SupabaseModule`:
   - A global module (`@Global()`) that provides `SupabaseService`.
   - Export `SupabaseService` so other modules can use it.

4. Health check:
   - Add a method `healthCheck()` that tries a simple query (e.g., `SELECT 1`) using the admin client.
   - Returns `{ connected: true, latency_ms: number }` or throws if not connected.

## ACCEPTANCE CRITERIA

- `SupabaseService.getPublicClient()` returns a Supabase client with anon key.
- `SupabaseService.getAdminClient()` returns a Supabase client with service role key.
- The admin client can bypass RLS (used for backend operations).
- The public client uses RLS (used for user-scoped operations).
- `SupabaseService.healthCheck()` returns connection status.
- The module is global and can be injected into any other module.
- If environment variables are missing, the service logs a clear configuration error at startup.

## EDGE CASES

- If `SUPABASE_URL` or `SUPABASE_ANON_KEY` is missing, throw `ConfigError` at module initialization.
- The service role key must never be exposed to the frontend (ensure it is only used server-side).
- Both clients should be lazy-initialized (create on first use, not at module load) to handle startup timing.
- If Supabase is unreachable, `healthCheck()` should return `{ connected: false, error: message }` rather than throwing.
- The service must handle token refresh gracefully for the public client.

## TESTS REQUIRED

- Unit test: `SupabaseService` creates both clients with correct keys.
- Unit test: `SupabaseService.healthCheck()` returns connected status.
- Unit test: Missing env vars throw configuration error.
- Integration test: Admin client can query database.

## EXPECTED OUTPUT

- `backend/src/supabase/supabase.service.ts`
- `backend/src/supabase/supabase.module.ts`
- Updated `backend/.env` with Supabase configuration variables.
- All tests pass.
