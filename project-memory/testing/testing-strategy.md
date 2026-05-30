# Testing Strategy — Closet Inteligente Digital

## 1. Overall Testing Philosophy

Testing is a first-class engineering concern. Every feature must be verified at multiple levels of the test pyramid before it is considered complete. The team follows these principles:

- **Shift-left testing**: Write tests as early as possible in the development cycle. Unit tests are written during or immediately after implementation.
- **Determinism**: Tests must be repeatable. No flaky tests. Randomised data uses fixed seeds, network calls are mocked, and time-sensitive code is pinned.
- **Isolation**: Unit tests never touch the network, the filesystem (beyond tempdirs), or a real database unless explicitly marked as integration tests.
- **Behaviour-driven naming**: Test names describe the scenario and the expected outcome. Use `describe`/`it` (or `describe`/`test`) blocks that read like specifications.
- **Fail fast**: The CI pipeline stops on the first test failure. Developers are expected to run the affected test suite locally before pushing.
- **Ownership**: Each microservice/subsystem owns its tests. The CI matrix runs them independently.

## 2. Test Pyramid

```
            /\
           /  \
          /    \
         / E2E  \         <5% of total tests
        /--------\
       /          \
      / Integration \     <20% of total tests
     /--------------\
    /                \
   /   Unit Tests     \    >75% of total tests
  /--------------------\
```

| Layer               | Scope                              | Speed      | Tool(s)                            |
|---------------------|-------------------------------------|------------|------------------------------------|
| Unit (JS/TS)        | Functions, hooks, stores, services  | ms         | Jest, React Testing Library        |
| Unit (Python)       | AI pipeline stages, scoring fns    | ms         | pytest                             |
| Integration (Nest)  | Controller + guards + pipes + DB   | <1 s       | Jest + supertest + Testcontainers  |
| Integration (React) | Full pages with mocked API         | <2 s       | Jest + MSW                         |
| E2E                 | Critical user journeys             | 10–60 s    | Playwright                         |
| Performance         | Auth, garment pipeline, rec engine | variable   | k6, Locust                         |
| Security            | Auth, injection, upload            | variable   | OWASP ZAP, manual review           |
| Accessibility       | Component tree                     | 1–2 s      | jest-axe, Playwright Axe           |

## 3. Unit Testing Strategy

### 3.1 JavaScript / TypeScript (Jest)

**Framework**: Jest 29+ with `@swc/jest` or `ts-jest`.

**Configuration file**: `jest.config.ts` at the root of each workspace package.

**Validation rules**:
- Every non-trivial exported function must have at least one unit test.
- Pure utility functions (e.g. `formatCurrency`, `validateEmail`) are tested with exhaustive input boundaries (null, undefined, empty string, malformed, valid).
- React components are tested with `@testing-library/react`. Test behaviour, not implementation.
- Zustand stores are tested by calling store actions directly and asserting on `getState()`.

**Coverage reporters**: `["text", "lcov", "html"]`.

**Example Jest config**:
```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    './src/features/auth/**': { branches: 90, functions: 90, lines: 90, statements: 90 },
    './src/features/garments/**': { branches: 90, functions: 90, lines: 90, statements: 90 },
    './src/features/recommendations/**': { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
};

export default config;
```

### 3.2 Python (pytest)

**Framework**: pytest 8+ with plugins listed below.

**Required plugins**:
- `pytest-cov` — coverage reporting
- `pytest-mock` — mocking via `mocker` fixture
- `pytest-xdist` — parallel execution
- `pytest-asyncio` — async test support

**Configuration** (`pyproject.toml`):
```toml
[tool.pytest.ini_options]
minversion = "8.0"
testpaths = ["tests"]
python_files = ["test_*.py"]
asyncio_mode = "auto"
addopts = "-v --tb=short --cov=src --cov-report=term --cov-report=xml"

[tool.coverage.run]
source = ["src"]
omit = ["tests/*", "**/__init__.py"]

[tool.coverage.report]
show_missing = true
fail_under = 80
```

**Validation rules**:
- Every function in `src/pipeline/` must have a corresponding test in `tests/pipeline/`.
- Functions that invoke a PyTorch model must be tested with mock model objects (not real inference) in unit tests.
- Pure scoring/rules functions are tested with table-driven parametrisation (`@pytest.mark.parametrize`).
- File I/O functions must use `tmp_path` fixture.

## 4. Integration Testing Strategy

### 4.1 Backend (NestJS + supertest)

**Scope**: Controller endpoints, guards, interceptors, pipes, filters, database round-trips.

**Approach**:
- Use `Test.createTestingModule()` from `@nestjs/testing`.
- Spin up a real PostgreSQL via Testcontainers (or a dedicated test DB via Docker Compose).
- Run migrations (`npm run migration:run`) before each test suite.
- Truncate all tables in `afterEach` (never drop and re-create).
- Use `supertest` to send real HTTP requests.

**Test matrix**:
| Endpoint type     | Coverage expectation | Notes                        |
| ----------------- | -------------------- | ----------------------------- |
| Auth              | 100% of routes       | Login, register, refresh, MFA |
| Garments          | 100% of routes       | CRUD, upload, search          |
| Outfits           | 100% of routes       | CRUD, recommend               |
| Avatar            | 100% of routes       | Upload, retrieve, delete      |
| Calendar          | 100% of routes       | CRUD, range query             |
| Notifications     | 100% of routes       | List, mark-read, bulk         |
| Analytics         | All read paths       | Dashboard, export             |
| Admin             | All sensitive paths  | User management               |

### 4.2 Frontend (Jest + MSW)

**Scope**: Full page renders with mocked server responses, form submissions, navigation flows.

**Approach**:
- `msw` (Mock Service Worker) intercepts all `fetch`/`axios` calls at the network level.
- Each page integration test creates a standalone MSW server that responds with fixture data.
- The `QueryClient` is created fresh per test with `new QueryClient()` and wrapped in a `QueryClientProvider`.
- User interactions are simulated with `@testing-library/user-event` (not `fireEvent`).

## 5. E2E Testing Strategy (Playwright)

**Coverage**: Only critical user journeys (see `e2e-testing.md`).

**Browser targets**: Chromium (primary), Firefox (smoke), WebKit (smoke).

**Environment**:
- A preview deployment or a local `docker compose up` that includes the full stack.
- Seeds the database with test accounts, garments, and outfit templates before the run.

**Runners**:
- Playwright Test Runner with `fullyParallel: true` for spec files that have no shared state.
- Serial mode (`test.describe.serial`) for journeys that build on each other (e.g. register → upload → recommend).

**Retries**: 2 retries on CI, 0 locally (`retries: process.env.CI ? 2 : 0`).

## 6. Testing Environment Setup

### 6.1 Local development

| Tool         | Command                    | Watches? |
| ------------ | -------------------------- | -------- |
| Jest (FE)    | `npm test -- --watch`      | Yes      |
| Jest (BE)    | `npm run test:watch`       | Yes      |
| pytest       | `pytest-watch`             | Yes      |
| Playwright   | `npm run e2e -- --ui`      | No       |
| All unit     | `npm run test:all`         | No       |
| All integ    | `npm run test:integration` | No       |

### 6.2 CI (GitHub Actions)

The workflow `.github/workflows/test.yml`:

```yaml
name: Test

on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint

  unit-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:frontend:ci

  unit-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: closet_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:backend:ci

  unit-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-cov pytest-mock pytest-asyncio
      - run: pytest --cov=src --cov-report=xml

  e2e:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: docker compose up -d --wait
      - run: npm run test:e2e:ci
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 7. Test Data Management

| Environment  | Data source                                   | Reset mechanism                    |
| ------------ | --------------------------------------------- | ---------------------------------- |
| Unit (FE)    | Factories, inline fixtures                    | Fresh per `beforeEach`             |
| Unit (AI)    | `tests/fixtures/` sample images, CSVs         | None (read-only)                   |
| Integ (BE)   | Factories (see factories doc) + seed scripts  | `TRUNCATE ... CASCADE` per suite   |
| E2E          | Dedicated seed script run before all tests     | `docker compose down -v` on teardown |

**Seed data directory structure**:
```
project-memory/testing/seeds/
├── users.json
├── garments.json
├── outfits.json
├── calendar-events.json
├── notifications.json
└── analytics.json
```

## 8. Mocking Strategy

### 8.1 Frontend (Jest + MSW)

| Concern              | Tool             | Notes                                                        |
| -------------------- | ---------------- | ------------------------------------------------------------ |
| HTTP requests        | MSW              | All network calls intercepted at the Service Worker level    |
| Module imports       | `jest.mock()`    | Used only for native modules or third-party SDKs (e.g. Firebase) |
| Timers               | `jest.useFakeTimers()` | For polling, debounce, throttle                         |
| IntersectionObserver | Manual mock in `jest.setup.ts` | |

**Global mocks** (`jest.setup.ts`):
```ts
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});
```

### 8.2 Backend (Jest)

| Concern              | Tool                                | Notes                              |
| -------------------- | ----------------------------------- | ---------------------------------- |
| Repository           | `MockRepository` from custom factory | See backend-testing.md             |
| External API         | `nock` or MSW                       | For Supabase / Redis client calls  |
| File upload          | `multer` memory storage             | Use `Buffer.from('fake-image')`    |
| JWT verify           | Manual mock or real secret          | Prefer real JWT with test secret   |
| Time                 | `jest.useFakeTimers()`              | For TOTP / rate-limit windows      |

### 8.3 AI (pytest)

| Concern                 | Tool              | Notes                                           |
| ----------------------- | ----------------- | ------------------------------------------------ |
| PyTorch model           | `unittest.mock.MagicMock` | Wrap in a mock that returns fixed tensors    |
| OpenCV image read       | `mocker.patch`    | Return a fixed `np.ndarray`                      |
| File system             | `tmp_path`        | Read/write to temp dir                          |
| Hugging Face pipeline   | `mocker.patch`    | Return canned classification dict               |
| MediaPipe pose detector | `mocker.patch`    | Return mock landmarks                           |

## 9. Fixture Management

**Directory convention**: `tests/__fixtures__/` (same-level as test files) or `tests/fixtures/` (shared).

**Fixture types**:

1. **Serialised objects** — JSON files with the exact shape the API returns.
2. **Binary fixtures** — small PNG/JPEG images (1–10 KB) stored in `tests/fixtures/images/`.
3. **Factory functions** — Reusable generators (see `test-data-factories.md`).
4. **Database seeds** — SQL or JSON files loaded via TypeORM migrations.

**Guidelines**:
- Avoid fixtures that are 100+ lines of JSON. Prefer factories that produce the same shape with fewer lines.
- Binary fixtures must be committed with Git LFS or stored under a size limit (100 KB).
- Every fixture must have a corresponding "edge case" variant (empty, null, malformed, extremely long string).

## 10. Continuous Testing in CI

**Triggers**:
- Every push to an open PR.
- Every merge to `main` (smoke tests only).

**Stages** (blocking pipeline):

```
┌─────────┐   ┌──────────────┐   ┌────────────┐   ┌──────┐
│  Lint   │ → │ Unit (all)   │ → │ Integration│ → │ E2E  │
├─────────┤   ├──────────────┤   ├────────────┤   ├──────┤
│ ESLint  │   │ FE + BE + AI │   │ FE + BE    │   │      │
└─────────┘   └──────────────┘   └────────────┘   └──────┘
```

**Performance gate** (non-blocking, informational):
- Runs once daily on `main`.
- Uses k6 for auth + recommendation endpoints.
- Reports to a Grafana dashboard.

**Flaky test policy**:
- A test that fails non-deterministically three times in CI is quarantined under `[Flaky]` tag.
- The owning team must fix or delete it within one sprint.

## 11. Coverage Targets

| Area                        | Threshold | Enforcement |
| --------------------------- | --------- | ----------- |
| Overall (global)            | 80%       | CI fail     |
| Auth (backend + frontend)   | 90%       | CI fail     |
| Garment pipeline (BE + AI)  | 90%       | CI fail     |
| Recommendation engine (AI)  | 90%       | CI fail     |
| Avatar module               | 85%       | CI warn     |
| Calendar module             | 80%       | CI fail     |
| Notifications module        | 80%       | CI warn     |
| Analytics / Export          | 75%       | CI warn     |
| Admin pages                 | 70%       | CI warn     |
| UI shared components        | 85%       | CI fail     |

**Excluded from coverage**:
- Generated code (`graphql.ts`, `prisma/client`, `typeorm migrations`)
- Storybook stories
- Configuration files
- `*/.d.ts` declaration files

## 12. Test Tagging and Classification

**Frontend (Jest)**:
```ts
test('login form submits', () => { ... });
test.skip('[Flaky] animation timing', () => { ... });
test('[Accessibility] button has aria-label', () => { ... });
test('[Performance] list renders 10k items under 100ms', () => { ... });
test('[Security] input sanitises HTML', () => { ... });
```

**Backend (Jest)**:
```ts
describe('[Auth] AuthService', () => { ... });
describe('[Garments] GarmentService', () => { ... });
describe('[Integration] GET /api/garments', () => { ... });
describe('[WebSocket] EventsGateway', () => { ... });
```

**Python (pytest markers)**:
```python
@pytest.mark.unit
def test_color_extraction(): ...

@pytest.mark.integration
def test_full_pipeline(): ...

@pytest.mark.slow
def test_model_inference_performance(): ...

@pytest.mark.security
def test_sanitize_filename(): ...
```

**Custom Jest reporter** for tagging: `jest-tags` or manual `testNamePattern` in CI.

**CI execution groups**:

| Command                  | Pattern                                  |
| ------------------------ | ---------------------------------------- |
| `test:quick`             | `--testNamePattern "^(?!.*\[Slow\].*)"`  |
| `test:security`          | `--testNamePattern "\[Security\]"`       |
| `test:accessibility`     | `--testNamePattern "\[Accessibility\]"`  |
| `test:slow`              | `--testNamePattern "\[Slow\]"`           |

## 13. Performance Testing Approach

### 13.1 Model inference (AI)

- **Tool**: Custom `pytest-benchmark` fixtures or simple `time.perf_counter`.
- **Tests**:
  - Time to detect garments in a 640×480 image (< 500 ms).
  - Time to extract measurements from a 30-second video (< 10 s).
  - Time to generate 10 outfit recommendations (< 1 s).
- **Baseline**: Recorded in `tests/performance/baseline.json`. CI warns if run exceeds baseline by >20%.

### 13.2 API endpoints (k6)

**Script location**: `performance/k6/`.

| Scenario           | Endpoint                                           | Target    |
| ------------------ | -------------------------------------------------- | --------- |
| Auth login         | `POST /api/auth/login`                             | < 500 ms  |
| Garment upload     | `POST /api/garments` (multipart)                   | < 2 s     |
| Recommendation     | `GET /api/outfits/recommend`                       | < 1 s     |
| Avatar generation  | `POST /api/avatar/generate`                        | < 10 s    |
| Dashboard          | `GET /api/analytics/dashboard`                     | < 800 ms  |

**k6 options**:
```js
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // ramp-up
    { duration: '1m', target: 50 },    // steady
    { duration: '30s', target: 0 },    // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    'http_req_duration{expected_response:true}': ['p(95)<1000'],
  },
};
```

## 14. Security Testing Approach

### 14.1 Automated (SAST / DAST)

| Tool              | Scope                 | Frequency     |
| ----------------- | --------------------- | ------------- |
| ESLint plugin     | React security rules  | Every PR      |
| `eslint-plugin-security` | Node.js backend  | Every PR      |
| Bandit (Python)   | AI service code       | Every PR      |
| OWASP ZAP (DAST)  | Staging deployment    | Weekly        |
| `npm audit`       | Dependencies          | Every PR      |
| `pip audit`       | Python dependencies   | Every PR      |
| Trivy (container) | Docker images         | Weekly        |

### 14.2 Manual test checklist

- [ ] JWT token expiration is enforced.
- [ ] Refresh tokens are rotated and old tokens invalidated.
- [ ] Rate limiting applied to `/auth/login` (5 attempts per minute per IP).
- [ ] File upload validates MIME type, magic bytes, maximum dimensions, and size (max 10 MB).
- [ ] SQL injection is prevented (TypeORM parameterised queries).
- [ ] XSS prevention (React default escaping, `dangerouslySetInnerHTML` not used).
- [ ] No secrets or API keys committed (pre-commit hook with `git-secrets`).
- [ ] CORS allows only known origins.
- [ ] Helmet.js headers present (`X-Content-Type-Options`, `X-Frame-Options`, etc.).
- [ ] Input validation on all user-supplied fields (class-validator/class-transformer).
- [ ] Admin routes check role-based access (RBAC).
- [ ] Supabase RL policies restrict row-level access to owning user.

### 14.3 Vulnerability testing in CI

Add a `security` job to the test workflow:

```yaml
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm audit --audit-level=high
    - run: pip install bandit
    - run: bandit -r src/ -f json -o bandit-report.json

    - name: Trivy scan
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        format: 'sarif'
        output: 'trivy-results.sarif'
```

## 15. Accessibility Testing Approach

### 15.1 Standards

All interfaces must conform to **WCAG 2.1 AA**.

### 15.2 Automated checks

**Per component** (jest-axe):
- Every reusable component has a `[Accessibility]` test that renders the component and calls `expect(await axe(container)).toHaveNoViolations()`.

**Per page** (Playwright + `@axe-core/playwright`):
- Every critical journey page is scanned after load.

**CI integration**:
```ts
import AxeBuilder from '@axe-core/playwright';

test('dashboard page has no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});
```

### 15.3 Manual checklist

- [ ] All images have meaningful `alt` text (or `aria-hidden` for decorative).
- [ ] Colour contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text.
- [ ] Focus indicators visible on all interactive elements.
- [ ] Keyboard navigation flows match visual order.
- [ ] Form errors are announced by screen readers (`aria-live`, `aria-describedby`).
- [ ] Loading states are announced (`aria-busy`, `role="alert"`).
- [ ] Touch targets are at least 44×44 px.
- [ ] Heading hierarchy is logical (h1 → h2 → h3, no skips).
- [ ] Landmarks (`<nav>`, `<main>`, `<aside>`) present and correctly labelled.
- [ ] Motion preference respected (`prefers-reduced-motion` disables animations).
