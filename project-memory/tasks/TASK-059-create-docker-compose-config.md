# TASK-059

# Create Docker Compose Configuration

## OBJECTIVE

Create the `docker-compose.yml` file that defines and orchestrates all backend services for local development: PostgreSQL database, Redis cache, and the NestJS application. The configuration supports hot-reloading for development and optimized builds for production.

## CONTEXT FILES

- `backend/Dockerfile`
- `backend/Dockerfile.dev`
- `backend/.env`
- `backend/.env.example`
- `backend/package.json`
- `backend/nest-cli.json`

## ALLOWED FILES

- `docker-compose.yml` (create at project root)
- `docker-compose.dev.yml` (create at project root, optional override)
- `backend/Dockerfile` (create)
- `backend/Dockerfile.dev` (create)
- `backend/.dockerignore` (create)
- `.env.example` (update)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any source code files (`.ts`, `.sql`)

## REQUIREMENTS

1. Create `docker-compose.yml` with three services:

   a. **postgres**:
      - Image: `postgres:16-alpine`
      - Container name: `closet-postgres`
      - Environment: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` from `.env`
      - Ports: `5432:5432`
      - Volumes: `pgdata:/var/lib/postgresql/data` (named volume)
      - Health check: `pg_isready -U ${POSTGRES_USER}`
      - Restart: `unless-stopped`

   b. **redis**:
      - Image: `redis:7-alpine`
      - Container name: `closet-redis`
      - Ports: `6379:6379`
      - Volumes: `redisdata:/data`
      - Command: `redis-server --appendonly yes` (for persistence)
      - Health check: `redis-cli ping`
      - Restart: `unless-stopped`

   c. **backend**:
      - Build context: `./backend`
      - Dockerfile: `Dockerfile.dev` (dev) or `Dockerfile` (prod)
      - Container name: `closet-backend`
      - Ports: `3001:3001`
      - Environment: from `.env` file
      - Depends on: `postgres` (condition: service_healthy), `redis` (condition: service_healthy)
      - Volumes (dev): `./backend/src:/app/src` (hot reload)
      - Command: `npm run start:dev` (dev) or `node dist/main` (prod)

2. Create `Dockerfile.dev`:
   - Base: `node:20-alpine`
   - Install dependencies with `npm ci`
   - Expose port 3001
   - CMD: `["npm", "run", "start:dev"]`

3. Create `Dockerfile` (production):
   - Multi-stage build:
     - Stage 1 (builder): `node:20-alpine`, install deps, run `npm run build`.
     - Stage 2 (runner): `node:20-alpine`, copy `dist/` and `node_modules/`, expose 3001.
     - CMD: `["node", "dist/main"]`
   - Use `npm ci --only=production` in runner stage.

4. Named volumes:
   - `pgdata`
   - `redisdata`

5. Network:
   - All services on `closet-network` bridge network.

## ACCEPTANCE CRITERIA

- `docker compose up` starts all three services.
- `docker compose ps` shows all services as healthy.
- Backend connects to PostgreSQL and Redis.
- Backend API is accessible at `http://localhost:3001`.
- Hot-reload works in development (changing a `.ts` file restarts the backend).
- `docker compose down` stops and removes containers (but preserves volumes).
- `docker compose build --no-cache` succeeds for the production Dockerfile.

## EDGE CASES

- The backend must wait for PostgreSQL to be healthy before starting (use `condition: service_healthy` in `depends_on`).
- Sensitive environment variables must not be hardcoded in `docker-compose.yml` (use `${VAR}` syntax referencing `.env`).
- Timezone should be configurable via `TZ` environment variable (default `UTC`).
- For Apple Silicon Macs, add `platform: linux/amd64` to the postgres image if needed.
- Logging driver should be `json-file` with max size 10m and max file 3 to prevent disk bloat.

## TESTS REQUIRED

- Integration test: `docker compose up -d` starts all services.
- Integration test: `curl http://localhost:3001/health` returns 200.
- Integration test: `docker compose down -v` cleans up (test manually).

## EXPECTED OUTPUT

- `docker-compose.yml` at the project root.
- `backend/Dockerfile.dev` for development.
- `backend/Dockerfile` for production.
- `backend/.dockerignore` with `node_modules`, `dist`, `.git`.
- Updated `.env.example` with all required variables.
- All services verified running with `docker compose ps`.
