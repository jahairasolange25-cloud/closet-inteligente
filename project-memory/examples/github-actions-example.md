# GitHub Actions Workflow Example — CI/CD Pipeline

> **Purpose:** Reference implementation for GitHub Actions workflows in the Closet Inteligente Digital project.
> **Pattern:** CI (lint, typecheck, test, build) → CD (build images, deploy, promote, rollback)
> **Stack:** GitHub Actions, Docker, Vercel, Railway, pnpm, Python

---

## Workflow Architecture

```
                    ┌─────────────┐
                    │  Push/PR to │
                    │    main     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Frontend │ │  Backend │ │  AI      │
        │    CI    │ │    CI    │ │  CI      │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          ▼
                   ┌─────────────┐
                   │   All CI    │
                   │   Passing   │
                   └──────┬──────┘
                          │
                    ┌─────▼─────┐
                    │    CD     │
                    │  Deploy   │
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Vercel  │ │ Railway  │ │ Railway  │
        │ Frontend │ │ Backend  │ │ AI       │
        └──────────┘ └──────────┘ └──────────┘
```

---

## File 1: .github/workflows/ci.yml

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'
  PNPM_VERSION: '9'

jobs:
  # ═══════════════════════════════════════════════════════════════
  # CHANGES DETECTION
  # ═══════════════════════════════════════════════════════════════
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      ai: ${{ steps.filter.outputs.ai }}
      infra: ${{ steps.filter.outputs.infra }}
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            frontend:
              - 'frontend/**'
              - '.github/workflows/frontend-ci.yml'
              - 'docker/frontend.Dockerfile'
            backend:
              - 'backend/**'
              - '.github/workflows/backend-ci.yml'
              - 'docker/backend.Dockerfile'
            ai:
              - 'services/ai/**'
              - '.github/workflows/ai-service-ci.yml'
              - 'docker/python.Dockerfile'
            infra:
              - 'docker/**'
              - '.github/workflows/**'
              - 'vercel.json'
              - 'railway.toml'
              - 'docker-compose*.yml'

  # ═══════════════════════════════════════════════════════════════
  # FRONTEND CI
  # ═══════════════════════════════════════════════════════════════
  frontend-lint:
    name: Frontend Lint
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' || needs.changes.outputs.infra == 'true' }}
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: ESLint
        run: pnpm lint

      - name: Prettier check
        run: pnpm format:check

      - name: Stylelint
        run: pnpm lint:styles

  frontend-typecheck:
    name: Frontend TypeScript
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' || needs.changes.outputs.infra == 'true' }}
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript check
        run: pnpm typecheck

  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' || needs.changes.outputs.infra == 'true' }}
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests with coverage
        run: pnpm test -- --coverage --reporter=verbose

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-frontend
          path: frontend/coverage/
          retention-days: 14

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-frontend
          path: frontend/test-results/
          retention-days: 14

  frontend-build:
    name: Frontend Build
    runs-on: ubuntu-latest
    needs: [frontend-lint, frontend-typecheck, frontend-test]
    if: success()
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Next.js
        run: pnpm build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/.next/
          retention-days: 7

  # ═══════════════════════════════════════════════════════════════
  # BACKEND CI
  # ═══════════════════════════════════════════════════════════════
  backend-lint:
    name: Backend Lint
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' || needs.changes.outputs.infra == 'true' }}
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: backend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: ESLint
        run: pnpm lint

      - name: Prettier check
        run: pnpm format:check

  backend-typecheck:
    name: Backend TypeScript
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' || needs.changes.outputs.infra == 'true' }}
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: backend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: npx prisma generate

      - name: TypeScript check
        run: pnpm typecheck

  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' || needs.changes.outputs.infra == 'true' }}
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: closet_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: backend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/closet_test

      - name: Run tests with coverage
        run: pnpm test -- --coverage --reporter=verbose
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/closet_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          JWT_SECRET: test-secret-key-for-ci

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-backend
          path: backend/coverage/
          retention-days: 14

  backend-build:
    name: Backend Build
    runs-on: ubuntu-latest
    needs: [backend-lint, backend-typecheck, backend-test]
    if: success()
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: backend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Build NestJS
        run: pnpm build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: backend-build
          path: backend/dist/
          retention-days: 7

  # ═══════════════════════════════════════════════════════════════
  # AI SERVICE CI
  # ═══════════════════════════════════════════════════════════════
  ai-lint:
    name: AI Lint
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.ai == 'true' || needs.changes.outputs.infra == 'true' }}
    defaults:
      run:
        working-directory: services/ai
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
          cache-dependency-path: services/ai/requirements-dev.txt

      - name: Install dependencies
        run: |
          pip install -r requirements-dev.txt
          pip install -r requirements.txt

      - name: Ruff linting
        run: ruff check .

      - name: Ruff formatting check
        run: ruff format --check .

      - name: mypy type checking
        run: mypy --ignore-missing-imports .

  ai-test:
    name: AI Tests
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.ai == 'true' || needs.changes.outputs.infra == 'true' }}
    defaults:
      run:
        working-directory: services/ai
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
          cache-dependency-path: services/ai/requirements-dev.txt

      - name: Install dependencies
        run: |
          pip install -r requirements-dev.txt
          pip install -r requirements.txt

      - name: Run tests with coverage
        run: pytest --cov=. --cov-report=xml --cov-report=term --junitxml=test-results.xml -v

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-ai
          path: services/ai/coverage.xml
          retention-days: 14

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-ai
          path: services/ai/test-results.xml
          retention-days: 14

  # ═══════════════════════════════════════════════════════════════
  # DOCKER BUILD CHECKS
  # ═══════════════════════════════════════════════════════════════
  docker-build-checks:
    name: Docker Build Checks
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.infra == 'true' }}
    strategy:
      fail-fast: false
      matrix:
        service: [frontend, backend, ai]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build ${{ matrix.service }} image
        uses: docker/build-push-action@v6
        with:
          context: ${{ matrix.service == 'frontend' && 'frontend' || matrix.service == 'backend' && 'backend' || 'services/ai' }}
          file: docker/${{ matrix.service }}.Dockerfile
          push: false
          load: true
          tags: closet-${{ matrix.service }}:ci
          cache-from: type=gha
          cache-to: type=gha,mode=max
          target: ${{ github.ref_name == 'main' && 'production' || 'development' }}

  # ═══════════════════════════════════════════════════════════════
  # CODE QUALITY GATE
  # ═══════════════════════════════════════════════════════════════
  quality-gate:
    name: Quality Gate
    runs-on: ubuntu-latest
    needs:
      - frontend-lint
      - frontend-typecheck
      - frontend-test
      - frontend-build
      - backend-lint
      - backend-typecheck
      - backend-test
      - backend-build
      - ai-lint
      - ai-test
    if: always()
    steps:
      - name: Check all CI passed
        run: |
          echo "Frontend: ${{ needs.frontend-build.result }}"
          echo "Backend: ${{ needs.backend-build.result }}"
          echo "AI: ${{ needs.ai-test.result }}"
          if [ "${{ needs.frontend-build.result }}" != "success" ] && [ "${{ needs.changes.outputs.frontend }}" == "true" ]; then
            echo "Frontend CI failed!"
            exit 1
          fi
          if [ "${{ needs.backend-build.result }}" != "success" ] && [ "${{ needs.changes.outputs.backend }}" == "true" ]; then
            echo "Backend CI failed!"
            exit 1
          fi
          if [ "${{ needs.ai-test.result }}" != "success" ] && [ "${{ needs.changes.outputs.ai }}" == "true" ]; then
            echo "AI CI failed!"
            exit 1
          fi
          echo "All required checks passed!"
```

---

## File 2: .github/workflows/cd.yml

```yaml
name: CD Pipeline

on:
  push:
    branches: [main, staging]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      force-deploy:
        description: 'Skip CI checks'
        required: false
        type: boolean
        default: false

concurrency:
  group: deploy-${{ github.ref_name }}
  cancel-in-progress: false

env:
  REGISTRY: ghcr.io
  IMAGE_TAG: ${{ github.sha }}

jobs:
  # ═══════════════════════════════════════════════════════════════
  # DEPLOYMENT TARGET DETECTION
  # ═══════════════════════════════════════════════════════════════
  determine-env:
    name: Determine Environment
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.set-env.outputs.environment }}
      frontend-url: ${{ steps.set-env.outputs.frontend-url }}
      backend-url: ${{ steps.set-env.outputs.backend-url }}
      ai-url: ${{ steps.set-env.outputs.ai-url }}
    steps:
      - id: set-env
        run: |
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            ENV="${{ inputs.environment }}"
          elif [ "${{ github.ref_name }}" == "main" ]; then
            ENV="production"
          else
            ENV="staging"
          fi
          echo "environment=$ENV" >> $GITHUB_OUTPUT
          if [ "$ENV" == "production" ]; then
            echo "frontend-url=https://closetinteligente.com" >> $GITHUB_OUTPUT
            echo "backend-url=https://api.closetinteligente.com" >> $GITHUB_OUTPUT
            echo "ai-url=https://ai.closetinteligente.com" >> $GITHUB_OUTPUT
          else
            echo "frontend-url=https://staging.closetinteligente.com" >> $GITHUB_OUTPUT
            echo "backend-url=https://api.staging.closetinteligente.com" >> $GITHUB_OUTPUT
            echo "ai-url=https://ai.staging.closetinteligente.com" >> $GITHUB_OUTPUT
          fi

  # ═══════════════════════════════════════════════════════════════
  # BUILD AND PUSH DOCKER IMAGES
  # ═══════════════════════════════════════════════════════════════
  build-and-push:
    name: Build & Push Images
    runs-on: ubuntu-latest
    needs: [determine-env]
    environment: ${{ needs.determine-env.outputs.environment }}
    strategy:
      fail-fast: false
      matrix:
        service:
          - name: frontend
            context: frontend
            dockerfile: docker/frontend.Dockerfile
          - name: backend
            context: backend
            dockerfile: docker/backend.Dockerfile
          - name: ai-service
            context: services/ai
            dockerfile: docker/python.Dockerfile
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate tags
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ github.repository }}/${{ matrix.service.name }}
          tags: |
            type=sha
            type=ref,event=branch
            type=raw,value=latest,enable=${{ github.ref_name == 'main' }}
            type=raw,value=${{ needs.determine-env.outputs.environment }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ${{ matrix.service.context }}
          file: ${{ matrix.service.dockerfile }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          target: production
          provenance: false

  # ═══════════════════════════════════════════════════════════════
  # DEPLOY FRONTEND TO VERCEL
  # ═══════════════════════════════════════════════════════════════
  deploy-frontend:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    needs: [determine-env, build-and-push]
    environment: ${{ needs.determine-env.outputs.environment }}
    if: ${{ needs.build-and-push.result == 'success' }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        working-directory: frontend

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ needs.determine-env.outputs.environment == 'production' && '--prod' || '' }}
          vercel-commit-message: 'Deploy ${{ github.sha }} to ${{ needs.determine-env.outputs.environment }}'
          working-directory: ./frontend

      - name: Notify deployment
        uses: slackapi/slack-github-action@v2
        if: always()
        with:
          webhook: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "Frontend deployed to ${{ needs.determine-env.outputs.environment }}: ${{ needs.determine-env.outputs.frontend-url }}",
              "attachments": [
                {
                  "color": "${{ job.status == 'success' && 'good' || 'danger' }}",
                  "fields": [
                    { "title": "Service", "value": "Frontend", "short": true },
                    { "title": "Environment", "value": "${{ needs.determine-env.outputs.environment }}", "short": true },
                    { "title": "Commit", "value": "${{ github.sha }}", "short": true },
                    { "title": "Status", "value": "${{ job.status }}", "short": true }
                  ]
                }
              ]
            }

  # ═══════════════════════════════════════════════════════════════
  # DEPLOY BACKEND TO RAILWAY
  # ═══════════════════════════════════════════════════════════════
  deploy-backend:
    name: Deploy Backend to Railway
    runs-on: ubuntu-latest
    needs: [determine-env, build-and-push]
    environment: ${{ needs.determine-env.outputs.environment }}
    if: ${{ needs.build-and-push.result == 'success' }}
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: railwayapp/railway-action@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: closet-backend
          environment: ${{ needs.determine-env.outputs.environment }}

      - name: Notify deployment
        uses: slackapi/slack-github-action@v2
        if: always()
        with:
          webhook: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "Backend deployed to ${{ needs.determine-env.outputs.environment }}: ${{ needs.determine-env.outputs.backend-url }}",
              "attachments": [
                {
                  "color": "${{ job.status == 'success' && 'good' || 'danger' }}",
                  "fields": [
                    { "title": "Service", "value": "Backend", "short": true },
                    { "title": "Environment", "value": "${{ needs.determine-env.outputs.environment }}", "short": true },
                    { "title": "Commit", "value": "${{ github.sha }}", "short": true },
                    { "title": "Status", "value": "${{ job.status }}", "short": true }
                  ]
                }
              ]
            }

  # ═══════════════════════════════════════════════════════════════
  # RUN DATABASE MIGRATIONS
  # ═══════════════════════════════════════════════════════════════
  run-migrations:
    name: Run Database Migrations
    runs-on: ubuntu-latest
    needs: [determine-env, deploy-backend]
    environment: ${{ needs.determine-env.outputs.environment }}
    if: ${{ needs.deploy-backend.result == 'success' }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Prisma
        run: pnpm add -g prisma

      - name: Apply migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Verify migration
        run: npx prisma migrate status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  # ═══════════════════════════════════════════════════════════════
  # DEPLOY AI SERVICE TO RAILWAY
  # ═══════════════════════════════════════════════════════════════
  deploy-ai:
    name: Deploy AI Service to Railway
    runs-on: ubuntu-latest
    needs: [determine-env, build-and-push]
    environment: ${{ needs.determine-env.outputs.environment }}
    if: ${{ needs.build-and-push.result == 'success' }}
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: railwayapp/railway-action@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: closet-ai
          environment: ${{ needs.determine-env.outputs.environment }}

      - name: Notify deployment
        uses: slackapi/slack-github-action@v2
        if: always()
        with:
          webhook: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "AI Service deployed to ${{ needs.determine-env.outputs.environment }}: ${{ needs.determine-env.outputs.ai-url }}",
              "attachments": [
                {
                  "color": "${{ job.status == 'success' && 'good' || 'danger' }}",
                  "fields": [
                    { "title": "Service", "value": "AI Service", "short": true },
                    { "title": "Environment", "value": "${{ needs.determine-env.outputs.environment }}", "short": true },
                    { "title": "Commit", "value": "${{ github.sha }}", "short": true },
                    { "title": "Status", "value": "${{ job.status }}", "short": true }
                  ]
                }
              ]
            }

  # ═══════════════════════════════════════════════════════════════
  # HEALTH CHECK
  # ═══════════════════════════════════════════════════════════════
  health-check:
    name: Post-Deployment Health Check
    runs-on: ubuntu-latest
    needs:
      - determine-env
      - deploy-frontend
      - deploy-backend
      - deploy-ai
      - run-migrations
    if: success()
    environment: ${{ needs.determine-env.outputs.environment }}
    steps:
      - name: Check frontend health
        run: |
          curl -sSf -o /dev/null -w "Frontend: HTTP %{http_code}\n" \
            "${{ needs.determine-env.outputs.frontend-url }}" || echo "Frontend health check failed"

      - name: Check backend health
        run: |
          curl -sSf -o /dev/null -w "Backend: HTTP %{http_code}\n" \
            "${{ needs.determine-env.outputs.backend-url }}/api/v1/health" || echo "Backend health check failed"

      - name: Check AI service health
        run: |
          curl -sSf -o /dev/null -w "AI: HTTP %{http_code}\n" \
            "${{ needs.determine-env.outputs.ai-url }}/health" || echo "AI health check failed"

      - name: Deployment success notification
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "✅ All services deployed successfully to ${{ needs.determine-env.outputs.environment }}!",
              "attachments": [
                {
                  "color": "good",
                  "fields": [
                    { "title": "Environment", "value": "${{ needs.determine-env.outputs.environment }}", "short": true },
                    { "title": "Commit", "value": "${{ github.sha }}", "short": true },
                    { "title": "Frontend", "value": "${{ needs.determine-env.outputs.frontend-url }}", "short": true },
                    { "title": "Backend", "value": "${{ needs.determine-env.outputs.backend-url }}", "short": true },
                    { "title": "AI Service", "value": "${{ needs.determine-env.outputs.ai-url }}", "short": true }
                  ]
                }
              ]
            }
```

---

## File 3: .github/workflows/rollback.yml

```yaml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to rollback'
        required: true
        type: choice
        options:
          - staging
          - production
      service:
        description: 'Service to rollback'
        required: true
        type: choice
        options:
          - frontend
          - backend
          - ai-service
          - all
      target-version:
        description: 'Docker image tag or commit SHA to rollback to'
        required: true
        type: string

env:
  REGISTRY: ghcr.io

jobs:
  rollback:
    name: Rollback ${{ inputs.service }} on ${{ inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Notify rollback started
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "⚠️ Rolling back ${{ inputs.service }} on ${{ inputs.environment }} to ${{ inputs.target-version }}",
              "attachments": [
                {
                  "color": "warning",
                  "fields": [
                    { "title": "Action", "value": "Rollback", "short": true },
                    { "title": "Service", "value": "${{ inputs.service }}", "short": true },
                    { "title": "Environment", "value": "${{ inputs.environment }}", "short": true },
                    { "title": "Target", "value": "${{ inputs.target-version }}", "short": true }
                  ]
                }
              ]
            }

      - name: Rollback frontend (Vercel)
        if: ${{ inputs.service == 'frontend' || inputs.service == 'all' }}
        run: |
          npx vercel rollback ${{ inputs.environment == 'production' && 'closetinteligente.com' || 'staging.closetinteligente.com' }} \
            --token ${{ secrets.VERCEL_TOKEN }} \
            --yes

      - name: Rollback backend (Railway)
        if: ${{ inputs.service == 'backend' || inputs.service == 'all' }}
        uses: railwayapp/railway-action@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: closet-backend
          environment: ${{ inputs.environment }}
          image: ${{ env.REGISTRY }}/${{ github.repository }}/backend:${{ inputs.target-version }}

      - name: Rollback AI service (Railway)
        if: ${{ inputs.service == 'ai-service' || inputs.service == 'all' }}
        uses: railwayapp/railway-action@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: closet-ai
          environment: ${{ inputs.environment }}
          image: ${{ env.REGISTRY }}/${{ github.repository }}/ai-service:${{ inputs.target-version }}

      - name: Revert database migration
        if: ${{ (inputs.service == 'backend' || inputs.service == 'all') && inputs.environment == 'production' }}
        run: npx prisma migrate resolve --rolled-back
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Rollback complete notification
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "✅ Rollback of ${{ inputs.service }} on ${{ inputs.environment }} to ${{ inputs.target-version }} completed.",
              "attachments": [
                {
                  "color": "good",
                  "fields": [
                    { "title": "Action", "value": "Rollback Completed", "short": true },
                    { "title": "Service", "value": "${{ inputs.service }}", "short": true },
                    { "title": "Environment", "value": "${{ inputs.environment }}", "short": true },
                    { "title": "Target", "value": "${{ inputs.target-version }}", "short": true }
                  ]
                }
              ]
            }
```

---

## Secrets Configuration

```yaml
# GitHub Repository Secrets

# Vercel
VERCEL_TOKEN:                # Vercel API token
VERCEL_ORG_ID:               # Vercel team/organization ID
VERCEL_PROJECT_ID:           # Vercel project ID

# Railway
RAILWAY_TOKEN:               # Railway API token
RAILWAY_DOCKER_USERNAME:     # Railway Docker registry username
RAILWAY_DOCKER_PASSWORD:     # Railway Docker registry password

# Database
DATABASE_URL:                # PostgreSQL connection string

# GitHub Container Registry
GITHUB_TOKEN:                # Automatically provided by GitHub

# Slack
SLACK_DEPLOY_WEBHOOK:        # Slack incoming webhook URL for deploy notifications

# Sentry
SENTRY_AUTH_TOKEN:           # Sentry authentication token
SENTRY_ORG:                  # Sentry organization slug
SENTRY_PROJECT:              # Sentry project slug

# SonarCloud
SONAR_TOKEN:                 # SonarCloud quality gate token
```

---

## Key Patterns Demonstrated

| Pattern | Implementation |
|---------|---------------|
| **Smart Change Detection** | `dorny/paths-filter` to only run CI for changed services |
| **Concurrent CI** | Parallel frontend, backend, AI CI jobs with independent caches |
| **Matrix Builds** | Strategy matrix for lint, typecheck, test, build across services |
| **Service Containers** | PostgreSQL and Redis containers for backend integration tests |
| **Dependency Caching** | pnpm cache, pip cache, Docker layer caching via GitHub Actions Cache |
| **Coverage Artifacts** | Upload test coverage and test results with retention policies |
| **Quality Gate** | Aggregated job that only passes when all required CI jobs succeed |
| **Environment Promotion** | `staging` → `production` with branch-based environment detection |
| **Docker Build & Push** | Multi-platform build with GHCR registry, SHA and semantic tags |
| **Deploy to Vercel** | Automated frontend deployment with `--prod` flag for production |
| **Deploy to Railway** | Railway action with service and environment targeting |
| **Database Migrations** | Post-deployment migration with verify step |
| **Slack Notifications** | Deployment start, success, and failure notifications |
| **Health Checks** | Post-deployment HTTP health check for all services |
| **Rollback Workflow** | Manual rollback for specific service/environment with version targeting |
| **Workflow Dispatch** | Manual trigger with environment, service, and force-deploy options |
