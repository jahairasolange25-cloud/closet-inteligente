# Testing Rules

> Standards and requirements for testing across all layers of the application.

---

## Testing Standards

### 1. Every Change Must Be Tested
No code change may be merged without corresponding tests. This includes:
- New features (unit + integration tests)
- Bug fixes (regression test)
- Refactoring (existing tests must pass, new tests if behavior was untested)

### 2. Test Pyramid
Follow the test pyramid — prioritize unit tests, supplement with integration tests, and validate with E2E tests.
```
    /\           E2E Tests (5-10%)
   /  \          Few, critical user flows
  /    \
 / Unit \        Unit Tests (70-80%)
/________\       Fast, isolated, numerous
```

### 3. Deterministic Tests
All tests must be deterministic. They must produce the same result every time they are run with the same inputs. No reliance on:
- System time (mock dates)
- Random values (use seeded random)
- Network availability (mock HTTP)
- File system state (use temp directories)

### 4. Fast Tests
- Unit tests: should run in < 100ms each
- Integration tests: should run in < 2s each
- E2E tests: should run in < 30s each
- Full frontend test suite: < 5 minutes
- Full backend test suite: < 10 minutes
- Full AI test suite: < 15 minutes

---

## Unit Test Requirements

### Frontend (Jest + React Testing Library)

#### What to Unit Test
- **Components**: Render logic, user interactions, conditional rendering.
- **Hooks**: State changes, side effects, return values.
- **Services**: API call construction, response handling, error handling.
- **Stores**: State updates, selectors, actions.
- **Utils**: Pure functions, transformations, formatting.

#### What NOT to Unit Test
- Third-party library internals (test your usage, not their implementation).
- CSS/styling details (test behavior, not appearance).
- Framework internals (Next.js routing, etc.).

#### Testing Patterns
```typescript
// Component test
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WardrobeItem } from './WardrobeItem';

describe('WardrobeItem', () => {
  it('should display item name', () => {
    render(<WardrobeItem item={{ id: '1', name: 'Red Shirt' }} />);
    expect(screen.getByText('Red Shirt')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = jest.fn();
    render(<WardrobeItem item={{ id: '1', name: 'Red Shirt' }} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('should show loading state when isLoading is true', () => {
    render(<WardrobeItem item={null} isLoading />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('should show error state when hasError is true', () => {
    render(<WardrobeItem item={null} hasError />);
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});
```

```typescript
// Hook test
import { renderHook, act } from '@testing-library/react';
import { useWardrobe } from './useWardrobe';

describe('useWardrobe', () => {
  it('should fetch items on mount', async () => {
    const { result } = renderHook(() => useWardrobe());
    expect(result.current.isLoading).toBe(true);
    // Wait for fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual(expectedItems);
  });

  it('should handle fetch error', async () => {
    // Mock API to throw
    const { result } = renderHook(() => useWardrobe());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
```

### Backend (Jest)

#### What to Unit Test
- **Services**: Business logic, data processing, validation.
- **Guards**: Authentication and authorization logic.
- **Pipes**: Input transformation and validation.
- **Filters**: Error handling and response formatting.
- **Decorators**: Custom decorator behavior.

#### Testing Patterns
```typescript
// Service test
import { Test, TestingModule } from '@nestjs/testing';
import { WardrobeService } from './wardrobe.service';

describe('WardrobeService', () => {
  let service: WardrobeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WardrobeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WardrobeService>(WardrobeService);
  });

  describe('getItemsByUser', () => {
    it('should return items for a valid user', async () => {
      const mockItems = [{ id: '1', name: 'Shirt' }];
      mockPrisma.wardrobeItem.findMany.mockResolvedValue(mockItems);

      const result = await service.getItemsByUser('user-1');
      expect(result).toEqual(mockItems);
      expect(mockPrisma.wardrobeItem.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return empty array when user has no items', async () => {
      mockPrisma.wardrobeItem.findMany.mockResolvedValue([]);

      const result = await service.getItemsByUser('user-1');
      expect(result).toEqual([]);
    });
  });
});
```

### AI (pytest)

#### What to Unit Test
- **Pipeline steps**: Individual transformation or inference steps.
- **Service functions**: Input/output validation, processing logic.
- **Utility functions**: Data transformation, format conversion.
- **Schema validation**: Pydantic model validation.

#### Testing Patterns
```python
# Pipeline test
import pytest
import numpy as np
from pipelines.segmentation import Segmenter

class TestSegmenter:
    def test_segment_valid_image(self, sample_image):
        segmenter = Segmenter()
        result = segmenter.process(sample_image)
        assert result.mask is not None
        assert result.confidence > 0.5
        assert result.class_name == 'shirt'

    def test_segment_empty_image(self):
        segmenter = Segmenter()
        with pytest.raises(ValueError, match="Empty image"):
            segmenter.process(np.array([]))

    def test_segment_invalid_format(self):
        segmenter = Segmenter()
        with pytest.raises(ValueError, match="Invalid format"):
            segmenter.process("not_an_image")
```

---

## Minimum 80% Code Coverage

### Coverage Requirements
| Layer | Minimum Coverage | Target Coverage |
|-------|-----------------|-----------------|
| Frontend (components) | 80% | 90% |
| Frontend (hooks) | 85% | 95% |
| Frontend (stores) | 85% | 95% |
| Frontend (services) | 90% | 100% |
| Frontend (utils) | 90% | 100% |
| Backend (services) | 85% | 95% |
| Backend (controllers) | 80% | 90% |
| Backend (guards) | 95% | 100% |
| Backend (DTOs) | 100% | 100% |
| AI (pipelines) | 80% | 90% |
| AI (services) | 85% | 95% |
| AI (utils) | 90% | 100% |

### Coverage Exclusions
The following are excluded from coverage requirements:
- Configuration files (`tailwind.config.ts`, `next.config.js`, etc.)
- Type definitions (`.d.ts` files)
- Generated code (Prisma client, etc.)
- Third-party wrapper re-exports
- Entry points (`main.ts`, `app/page.tsx` wrappers only)

### Coverage Enforcement
- CI pipeline will FAIL if coverage drops below minimum thresholds.
- Coverage is calculated per-layer, not globally.
- New files must meet the target coverage before merging.

---

## Integration Test Requirements

### Frontend Integration Tests
- Test component interactions with stores.
- Test API service function with mocked HTTP.
- Test routing behavior.
- Use `@testing-library/react` with mocked data.

### Backend Integration Tests
- Test controllers with real (or in-memory) database.
- Test end-to-end module flow (controller -> service -> repository).
- Test authentication/authorization flows.
- Test error handling end-to-end.

### AI Integration Tests
- Test pipeline with real (or synthetic) model data.
- Test service endpoint with HTTP client.
- Test database integration (if applicable).

### Integration Test Setup
- Use test containers or in-memory databases where possible.
- Use factories for test data creation.
- Clean up test data after each test.

---

## E2E Test Requirements

### Frontend E2E Tests (Playwright or Cypress)
- Cover critical user flows:
  - User registration and login
  - Wardrobe item CRUD
  - Outfit creation
  - Virtual try-on
  - Search and filter
  - Profile management
- Run against a real (or test) backend.
- Run in CI on every PR.

### Backend E2E Tests (Jest, supertest)
- Cover all API endpoints.
- Test full request-response cycle.
- Test authentication/authorization end-to-end.
- Test error scenarios (404, 400, 401, 403, 500).
- Run against a test database.

### E2E Test Requirements
- Must be isolated (no shared state between tests).
- Must clean up test data after execution.
- Must handle test environment setup/teardown.
- Must be tagged with `@e2e` (or equivalent).

---

## Test File Location Conventions

### Frontend
```
frontend/src/
├── components/UserProfile/
│   ├── UserProfile.tsx
│   ├── UserProfile.test.tsx       # Unit test
│   └── UserProfile.integration.test.tsx  # Integration test
├── hooks/
│   ├── useUserProfile.ts
│   └── useUserProfile.test.ts     # Hook test
├── stores/
│   ├── wardrobeStore.ts
│   └── wardrobeStore.test.ts      # Store test
├── services/
│   ├── wardrobeService.ts
│   └── wardrobeService.test.ts    # Service test
└── utils/
    ├── formatDate.ts
    └── formatDate.test.ts         # Util test
```

### Backend
```
backend/src/modules/wardrobe/
├── services/
│   ├── wardrobe.service.ts
│   └── wardrobe.service.spec.ts    # Unit test
├── controllers/
│   ├── wardrobe.controller.ts
│   └── wardrobe.controller.spec.ts # Unit test

backend/test/
├── wardrobe.e2e-spec.ts            # E2E test
└── app.e2e-spec.ts                 # App-level E2E test
```

### AI (Python)
```
python/
├── pipelines/
│   ├── segmentation/
│   │   ├── segmenter.py
│   │   └── test_segmenter.py       # Unit test
├── services/
│   ├── routers/
│   │   ├── wardrobe.py
│   │   └── test_wardrobe.py        # Integration test
├── tests/
│   ├── conftest.py                  # Shared fixtures
│   └── test_pipeline.py             # Pipeline E2E test
```

---

## Test Naming Conventions

### Test Files
- **Frontend**: `<filename>.test.tsx` or `<filename>.test.ts`
- **Backend**: `<filename>.spec.ts` or `<filename>.e2e-spec.ts`
- **AI Python**: `test_<filename>.py`

### Test Cases
- **Jest**: `it('should [expected behavior] when [condition]')`
- **pytest**: `def test_[behavior]_when_[condition]():`

### Test Groups
- **Jest**: `describe('[Class/Function]')` or `describe('[Feature]')`
- **pytest**: `class Test[Class]:`

### Test Tags/Labels
- `@smoke` — Critical path tests (run first in CI)
- `@regression` — Tests that verify no regressions
- `@e2e` — End-to-end tests (run separately from unit tests)
- `@slow` — Tests that take > 1 second (run in separate CI job)
- `@flaky` — Known flaky tests (must be fixed within 2 weeks)

---

## Mock/Stub/Fake Rules

### When to Mock
1. **External services**: API calls, databases, message queues.
2. **I/O operations**: File system, network, system clock.
3. **Non-deterministic operations**: Random values, UUID generation.
4. **Expensive operations**: AI model inference, image processing.
5. **Side effects**: Logging, analytics, metrics.

### What NOT to Mock
1. **Pure functions**: Test them directly.
2. **Simple data structures**: Use real objects.
3. **Framework internals**: Mock your code, not the framework.
4. **Third-party library internals**: Mock the interface, not the implementation.

### Mocking Patterns

#### Frontend
```typescript
// Mock a service
jest.mock('../../services/wardrobeService', () => ({
  fetchWardrobeItems: jest.fn(),
}));

// Mock a hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', name: 'Test' }, isAuthenticated: true }),
}));
```

#### Backend
```typescript
// Mock a repository/provider
const module = await Test.createTestingModule({
  providers: [
    WardrobeService,
    { provide: PrismaService, useValue: mockPrisma },
  ],
}).compile();
```

#### AI (Python)
```python
# Mock with unittest.mock
from unittest.mock import Mock, patch
from pipelines.segmenter import Segmenter

@patch('pipelines.segmenter.Segmenter.load_model')
def test_segmenter(mock_load_model):
    mock_load_model.return_value = Mock()
    segmenter = Segmenter()
    ...
```

### Stub vs Mock vs Fake
| Type | Purpose | When to Use |
|------|---------|-------------|
| **Stub** | Returns predefined values | When you need a specific return value |
| **Mock** | Verifies behavior (was it called?) | When you need to verify interactions |
| **Fake** | Lightweight implementation | When a real implementation is too complex (e.g., in-memory DB) |

---

## Snapshot Testing Rules

### When to Use Snapshots
- **UI components**: Capture the rendered output to detect unintended changes.
- **API responses**: Capture the response shape to detect contract changes.
- **Config files**: Capture the generated configuration to detect changes.

### When NOT to Use Snapshots
- **Large files**: Snapshots > 100 lines are hard to review.
- **Frequently changing content**: Dates, timestamps, random values.
- **Third-party output**: CSS class names generated by CSS-in-JS libraries.
- **Internationalized content**: Text that changes with locale.

### Snapshot Best Practices
1. Keep snapshots small and focused.
2. Review snapshot diffs carefully before updating.
3. Do not blindly update snapshots (`--updateSnapshot` without review).
4. Commit snapshots alongside the code changes.
5. If a snapshot test is flaky, replace it with a regular assertion.

### Snapshot Update Process
1. Run tests to confirm the snapshot fails.
2. Visually verify the change is intentional.
3. Update the snapshot: `jest --updateSnapshot`.
4. Commit the updated snapshot with the code change.

---

## Test Data Management

### Test Data Principles
1. **Isolated**: Each test gets its own data. No sharing between tests.
2. **Deterministic**: Data must produce the same result every time.
3. **Minimal**: Use the minimum data needed for the test.
4. **Explicit**: Data should be defined in the test, not inherited from a shared fixture.

### Factories
Use factory functions for creating test data:

```typescript
// Frontend factory
function createMockWardrobeItem(overrides: Partial<WardrobeItem> = {}): WardrobeItem {
  return {
    id: 'test-id',
    name: 'Test Item',
    category: 'top',
    color: 'red',
    imageUrl: '/test.jpg',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}
```

```python
# Python factory
def create_mock_clothing_item(**overrides) -> ClothingItem:
    data = {
        'id': 'test-id',
        'name': 'Test Item',
        'category': 'top',
        'color': 'red',
        'image_url': '/test.jpg',
    }
    data.update(overrides)
    return ClothingItem(**data)
```

### Fixtures
Use fixtures for test setup/teardown:

```python
# pytest fixture
@pytest.fixture
def sample_image():
    return np.zeros((224, 224, 3), dtype=np.uint8)

@pytest.fixture
def sample_clothing_item():
    return create_mock_clothing_item()
```

### Test Data Cleanup
- Unit tests: No cleanup needed (all mocked).
- Integration tests: Clean up created data in `afterEach`/`teardown`.
- E2E tests: Clean up in `afterAll`/`teardown_module`.
- Database tests: Use transactions that rollback after each test.

---

## Test Isolation Requirements

### Isolation Levels
| Level | Description | Used For |
|-------|-------------|----------|
| **Function-level** | Each test function is independent | Unit tests |
| **Module-level** | Tests in a file share setup/teardown | Integration tests |
| **Suite-level** | All tests in a suite share setup | E2E tests (carefully) |

### Isolation Rules
1. **No shared mutable state**: Each test must set up its own state.
2. **No test ordering dependencies**: Tests must run in any order.
3. **No test pollution**: One test must not affect another.
4. **Cleanup is mandatory**: Every test must clean up what it created.
5. **Parallel safety**: Tests must be safe to run in parallel (use unique data).

### Violations
If tests fail when run in a different order or in parallel:
1. Identify the shared state.
2. Isolate it (unique data per test, reset state in `beforeEach`).
3. Add a test that explicitly tests ordering (to prevent regression).

---

## CI Test Execution

### CI Test Pipeline
```
1. Lint check
2. Type check
3. Unit tests (fast)
4. Integration tests (slower)
5. Build check
6. E2E tests (slowest, run in parallel)
7. Coverage report
```

### Test Execution Order
1. **Smoke tests** run first (fail fast).
2. **Unit tests** run next (fast, catch basic issues).
3. **Integration tests** run after unit tests pass.
4. **E2E tests** run last (slow, comprehensive).
5. **Coverage check** runs after all tests pass.

### Parallel Execution
- Unit tests: Run in parallel (Jest `--maxWorkers=50%`).
- Integration tests: Run sequentially (database contention).
- E2E tests: Run in parallel by spec file.

### CI Variables
| Variable | Purpose |
|----------|---------|
| `CI=true` | Disables interactive features |
| `NODE_ENV=test` | Test environment configuration |
| `DATABASE_URL` | Test database connection string |
| `SKIP_E2E` | Set to skip E2E tests for quick CI runs |

---

## Flaky Test Handling

### Definition
A flaky test is a test that passes and fails intermittently without code changes.

### Detection
- Test fails in CI but passes locally.
- Test fails intermittently on the same commit.
- Test fails only in specific environments.

### Response to Flaky Tests
1. **Investigate immediately**: Flaky tests erode trust in the test suite.
2. **Tag as `@flaky`**: Tag the test and create a task to fix it.
3. **Fix within 2 weeks**: Flaky tests must be fixed within 2 weeks.
4. **If not fixable in 2 weeks**: Remove the test and replace with a more stable one.

### Common Causes of Flaky Tests
1. **Timing issues**: Async operations without proper waits.
2. **Shared state**: Tests modifying shared data.
3. **Order dependencies**: Tests relying on a specific execution order.
4. **Environment dependencies**: Tests relying on specific environment conditions.
5. **Network dependencies**: Tests making real network calls.
6. **Race conditions**: Concurrent operations without proper synchronization.

### Fixing Flaky Tests
1. Add proper waits/retries for async operations.
2. Isolate test data (unique per test).
3. Remove shared state (reset in `beforeEach`).
4. Mock external dependencies.
5. Use deterministic data (seeded random, fixed timestamps).

---

## Test File Template

### Frontend Component Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

// Mock dependencies
jest.mock('../../hooks/useMyHook', () => ({
  useMyHook: () => ({ data: mockData, isLoading: false, error: null }),
}));

const defaultProps = {
  // Default props here
};

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<MyComponent {...defaultProps} />);
    expect(screen.getByTestId('my-component')).toBeInTheDocument();
  });

  // ... more tests
});
```

### Backend Service Test Template
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        // Mock providers here
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return expected result', async () => {
      // Test here
    });
  });
});
```

### AI Pipeline Test Template
```python
import pytest
from pipelines.my_pipeline import MyPipeline

class TestMyPipeline:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.pipeline = MyPipeline()

    def test_process_valid_input(self, sample_input):
        result = self.pipeline.process(sample_input)
        assert result is not None
        assert isinstance(result, dict)

    def test_process_empty_input(self):
        with pytest.raises(ValueError):
            self.pipeline.process(None)
```

---

## Testing Tools and Libraries

### Frontend
| Tool | Purpose |
|------|---------|
| Jest | Test runner and assertions |
| React Testing Library | Component rendering and interaction |
| user-event | Simulating user interactions |
| msw (Mock Service Worker) | HTTP request mocking |
| jest-axe | Accessibility testing |
| @testing-library/jest-dom | DOM-specific matchers |

### Backend
| Tool | Purpose |
|------|---------|
| Jest | Test runner and assertions |
| @nestjs/testing | NestJS module testing utilities |
| supertest | HTTP integration testing |
| msw (Mock Service Worker) | HTTP request mocking |
| faker.js | Generating test data |

### AI (Python)
| Tool | Purpose |
|------|---------|
| pytest | Test runner |
| pytest-cov | Coverage reporting |
| pytest-mock | Mocking utilities |
| pytest-xdist | Parallel test execution |
| factory_boy | Test data factories |
| hypothesis | Property-based testing |
