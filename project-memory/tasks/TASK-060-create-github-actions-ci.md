# TASK-060

# Create GitHub Actions CI Workflow

## OBJECTIVE

Create a GitHub Actions CI workflow that automatically runs on pull requests and pushes to the main branch. The workflow performs linting, type checking, unit tests, integration tests, and builds the Docker image.

## CONTEXT FILES

- `.github/workflows/ci.yml`
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/nest-cli.json`
- `backend/.eslintrc.js` (or `.eslintrc.json`)

## ALLOWED FILES

- `.github/workflows/ci.yml` (create)
- `.github/workflows/cd.yml` (create if needed for deployment)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any source code files (`.ts`, `.sql`)

## REQUIREMENTS

1. Create `.github/workflows/ci.yml`:

   **Trigger:**
   - On push to `main` branch.
   - On pull request to `main` branch.
   - On push to `develop` branch (optional, for pre-merge checks).

   **Jobs:**

   a. **lint**:
      - Runs on `ubuntu-latest`.
      - Steps:
        - Checkout code.
        - Setup Node.js 20 with `npm` caching.
        - `npm ci` in `backend/`.
        - Run `npm run lint` (or `npx eslint src/`).
      - Fail if any lint errors.

   b. **typecheck**:
      - Runs on `ubuntu-latest`.
      - Steps:
        - Checkout code.
        - Setup Node.js 20 with caching.
        - `npm ci` in `backend/`.
        - Run `npx tsc --noEmit` (or `npm run typecheck`).
      - Fail if any type errors.

   c. **test**:
      - Runs on `ubuntu-latest`.
      - Services:
        - PostgreSQL 16 (use `services.postgres` with env vars).
        - Redis 7 (use `services.redis`).
      - Steps:
        - Checkout code.
        - Setup Node.js 20 with caching.
        - `npm ci` in `backend/`.
        - Set environment variables for test DB and Redis.
        - Run `npm run test` (unit tests).
        - Run `npm run test:e2e` (integration tests, if configured).
      - Upload test coverage artifacts (if coverage report is generated).

   d. **build**:
      - Runs on `ubuntu-latest`.
      - Steps:
        - Checkout code.
        - Setup Node.js 20 with caching.
        - `npm ci` in `backend/`.
        - Run `npm run build`.
        - Verify `dist/` directory exists.
      - Fail if build fails.

   e. **docker-build** (optional, for pushes to main):
      - Runs on push to `main`.
      - Steps:
        - Checkout code.
        - Set up Docker Buildx.
        - Build Docker image using `backend/Dockerfile`.
        - Tag with `closet-backend:latest` and `closet-backend:${{ github.sha }}`.

2. Environment variables:
   - Use GitHub Secrets for sensitive values:
     - `DATABASE_URL` for test DB.
     - `JWT_SECRET` for tests.
     - `REDIS_URL` for test Redis.
   - Use `secrets.CI_DATABASE_URL` convention.

3. Caching:
   - Cache `node_modules` using `actions/cache` with `npm` hash.
   - Cache Next.js build output if frontend CI is added later.

4. Notifications:
   - On failure, add a comment to the PR (optional, use `actions/github-script`).

## ACCEPTANCE CRITERIA

- Pushing to a branch triggers the CI workflow.
- The workflow shows 4 successful jobs: lint, typecheck, test, build.
- Lint job fails if there are ESLint errors.
- Typecheck job fails if there are TypeScript errors.
- Test job fails if any unit or integration test fails.
- Build job produces a `dist/` directory.
- The entire workflow completes in under 10 minutes.
- Pull request checks show the CI status.

## EDGE CASES

- Workflow should only run if files in `backend/` have changed (use `paths` filter or `paths-filter` action).
- If `npm ci` fails due to lockfile mismatch, the workflow provides a clear error.
- PostgreSQL service container must have a database created for tests (use `--health-cmd` to wait for readiness).
- Redis service container must be healthy before tests run.
- Secrets must not appear in workflow logs (GitHub Actions masks them automatically).
- The `test` job should use `strategy.fail-fast: false` to see all failures.

## TESTS REQUIRED

- Manual verification: Push a branch and verify CI runs on GitHub.
- Manual verification: Introduce a lint error and verify job fails.
- Manual verification: Introduce a type error and verify job fails.
- Manual verification: Introduce a test failure and verify job fails.
- Manual verification: Push to main without errors and verify docker-build runs.

## EXPECTED OUTPUT

- `.github/workflows/ci.yml` with all required jobs.
- The workflow is triggered on push/PR.
- All CI jobs pass on a clean branch.
- CI status badges can be added to the repository README (optional, document).
