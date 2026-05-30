# CI/CD Pipeline

## Overview

GitHub Actions workflows for continuous integration and deployment across all services.

---

## CI Workflows

### 1. Frontend CI

**File:** `.github/workflows/frontend-ci.yml`

```yaml
name: Frontend CI

on:
  pull_request:
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: 20
  WORKING_DIR: frontend

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm lint:styles
      - run: pnpm check-types

  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    name: Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-frontend
          path: ${{ env.WORKING_DIR }}/coverage

  build:
    name: Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: ${{ env.WORKING_DIR }}/.next

  bundle-analysis:
    name: Bundle Analysis
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm build --analyze
      - uses: actions/upload-artifact@v4
        with:
          name: bundle-report
          path: ${{ env.WORKING_DIR }}/.next/analyze
```

### 2. Backend CI

**File:** `.github/workflows/backend-ci.yml`

```yaml
name: Backend CI

on:
  pull_request:
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: 20
  WORKING_DIR: backend

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check

  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    name: Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
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
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/closet_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-backend
          path: ${{ env.WORKING_DIR }}/coverage

  build:
    name: Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  docker-build:
    name: Docker Build Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t closet-backend:ci ./backend
```

### 3. AI Service CI

**File:** `.github/workflows/ai-service-ci.yml`

```yaml
name: AI Service CI

on:
  pull_request:
    paths:
      - 'services/ai/**'
      - '.github/workflows/ai-service-ci.yml'
  push:
    branches: [main, develop]
    paths:
      - 'services/ai/**'

env:
  PYTHON_VERSION: 3.11
  WORKING_DIR: services/ai

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
      - run: pip install -r requirements-dev.txt
      - run: ruff check .
      - run: ruff format --check .
      - run: mypy --ignore-missing-imports .

  test:
    name: Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: pytest --cov=. --cov-report=xml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-ai
          path: ${{ env.WORKING_DIR }}/coverage.xml

  docker-build:
    name: Docker Build Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t closet-ai:ci ./services/ai
```

---

## CD Workflows

### 1. Deploy Frontend to Vercel

**File:** `.github/workflows/deploy-frontend.yml`

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main, staging]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name == 'main' && 'production' || 'staging' }}
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: corepack enable && corepack prepare pnpm@9 --activate
      - run: pnpm install --frozen-lockfile

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref_name == 'main' && '--prod' || '' }}
          scope: ${{ secrets.VERCEL_SCOPE }}
          working-directory: ./frontend
```

### 2. Deploy Backend to Railway

**File:** `.github/workflows/deploy-backend.yml`

```yaml
name: Deploy Backend

on:
  push:
    branches: [main, staging]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    name: Deploy Backend
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name == 'main' && 'production' || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - name: Build and Push Docker Image
        run: |
          docker build -t closet-backend:${{ github.sha }} ./backend
          docker tag closet-backend:${{ github.sha }} \
            registry.railway.app/closet-backend:${{ github.ref_name == 'main' && 'latest' || 'staging' }}
          echo "${{ secrets.RAILWAY_DOCKER_PASSWORD }}" | \
            docker login registry.railway.app -u "${{ secrets.RAILWAY_DOCKER_USERNAME }}" --password-stdin
          docker push registry.railway.app/closet-backend:${{ github.ref_name == 'main' && 'latest' || 'staging' }}

      - name: Deploy to Railway
        uses: railwayapp/railway-action@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: closet-backend
          environment: ${{ github.ref_name == 'main' && 'production' || 'staging' }}

  migrate:
    name: Run Database Migrations
    runs-on: ubuntu-latest
    needs: deploy
    environment: ${{ github.ref_name == 'main' && 'production' || 'staging' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g prisma
      - run: prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 3. Deploy AI Service to Railway/Render

**File:** `.github/workflows/deploy-ai-service.yml`

```yaml
name: Deploy AI Service

on:
  push:
    branches: [main, staging]
    paths:
      - 'services/ai/**'
      - '.github/workflows/deploy-ai-service.yml'

jobs:
  deploy:
    name: Deploy AI Service
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name == 'main' && 'production' || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - name: Build and Push Docker Image
        run: |
          docker build -t closet-ai:${{ github.sha }} ./services/ai
          docker tag closet-ai:${{ github.sha }} \
            registry.railway.app/closet-ai:${{ github.ref_name == 'main' && 'latest' || 'staging' }}
          echo "${{ secrets.RAILWAY_DOCKER_PASSWORD }}" | \
            docker login registry.railway.app -u "${{ secrets.RAILWAY_DOCKER_USERNAME }}" --password-stdin
          docker push registry.railway.app/closet-ai:${{ github.ref_name == 'main' && 'latest' || 'staging' }}

      - name: Deploy to Railway
        uses: railwayapp/railway-action@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: closet-ai
          environment: ${{ github.ref_name == 'main' && 'production' || 'staging' }}
```

---

## Environment Promotion

```
develop ──► staging ──► main (production)
  PR         auto-deploy    auto-deploy
           on staging    on main push
              branch
```

| Environment | Branch | Auto-deploy | URL |
|-------------|--------|-------------|-----|
| Development | `develop` | No (manual) | dev.closetinteligente.com |
| Staging | `staging` | Yes | staging.closetinteligente.com |
| Production | `main` | Yes (after checks) | closetinteligente.com |

---

## Rollback Strategy

### Frontend (Vercel)

```bash
# Rollback to previous deployment
vercel rollback closetinteligente.com --token $VERCEL_TOKEN

# Or via GitHub
gh workflow run rollback.yml -f environment=production -f commit=previous-sha
```

### Backend (Railway)

```yaml
name: Rollback Backend

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to rollback'
        required: true
        type: choice
        options: [production, staging]
      target-version:
        description: 'Docker image tag to rollback to'
        required: true
        type: string

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - name: Rollback Railway Deployment
        uses: railwayapp/railway-action@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: closet-backend
          environment: ${{ inputs.environment }}
          image: registry.railway.app/closet-backend:${{ inputs.target-version }}

      - name: Revert Database Migration
        if: inputs.environment == 'production'
        run: npx prisma migrate resolve --rolled-back
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Secrets Management

### GitHub Actions Secrets

| Secret | Used By | Description |
|--------|---------|-------------|
| `VERCEL_TOKEN` | Frontend deploy | Vercel API token |
| `VERCEL_ORG_ID` | Frontend deploy | Vercel team ID |
| `VERCEL_PROJECT_ID` | Frontend deploy | Vercel project ID |
| `VERCEL_SCOPE` | Frontend deploy | Vercel scope |
| `RAILWAY_TOKEN` | Backend/AI deploy | Railway API token |
| `RAILWAY_DOCKER_USERNAME` | Backend/AI deploy | Railway registry user |
| `RAILWAY_DOCKER_PASSWORD` | Backend/AI deploy | Railway registry password |
| `DATABASE_URL` | Migration | PostgreSQL connection string |
| `DOCKERHUB_USERNAME` | Docker build | Docker Hub user |
| `DOCKERHUB_TOKEN` | Docker build | Docker Hub token |
| `SONAR_TOKEN` | Quality gate | SonarCloud token |

### Environment-Specific Variables

```yaml
# In GitHub Environments
# Production environment:
#   DATABASE_URL: postgresql://... 
#   NEXT_PUBLIC_API_URL: https://api.closetinteligente.com/v1
#   NEXT_PUBLIC_WS_URL: wss://api.closetinteligente.com/ws

# Staging environment:
#   DATABASE_URL: postgresql://staging...
#   NEXT_PUBLIC_API_URL: https://api.staging.closetinteligente.com/v1
#   NEXT_PUBLIC_WS_URL: wss://api.staging.closetinteligente.com/ws
```

---

## Status Badges

```markdown
[![Frontend CI](https://github.com/closet-inteligente/app/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/closet-inteligente/app/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/closet-inteligente/app/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/closet-inteligente/app/actions/workflows/backend-ci.yml)
[![AI Service CI](https://github.com/closet-inteligente/app/actions/workflows/ai-service-ci.yml/badge.svg)](https://github.com/closet-inteligente/app/actions/workflows/ai-service-ci.yml)
[![Deploy Frontend](https://github.com/closet-inteligente/app/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/closet-inteligente/app/actions/workflows/deploy-frontend.yml)
```

---

## Required Status Checks

| Branch | Required Checks |
|--------|----------------|
| `main` | Frontend CI (lint, typecheck, test, build), Backend CI (lint, typecheck, test, build) |
| `staging` | Frontend CI (lint, typecheck, test, build), Backend CI (lint, typecheck, test, build) |
| Pull requests | All CI checks must pass, code review approval required |
