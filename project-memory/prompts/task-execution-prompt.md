# Task Execution Prompt — Closet Inteligente Digital

> **Purpose:** Template for executing a specific task from the `project-memory/tasks/` directory. Use this prompt when you have been assigned a task or when you find a task file in the `tasks/` directory.

---

## 1. How to Locate the Task

### 1.1 Task File Locations
Tasks are stored in `project-memory/tasks/` and follow the naming convention:
```
tasks/<phase>-<component-id>-<kebab-case-description>.md
```

Example: `tasks/phase-2-fe-10-garment-upload-wizard.md`

### 1.2 Task Discovery Commands
```bash
# List all tasks
ls project-memory/tasks/

# Find tasks by component ID
rg "FE-10" project-memory/tasks/

# Find tasks by status
rg "Status: NOT_STARTED" project-memory/tasks/
```

### 1.3 No Task File Found?
If no task file exists for your assignment:
1. Check `ROADMAP.md` for the component ID and task description
2. Check `PROJECT_STATUS.md` for the current status of the component
3. Create a task file following the template below before starting work

---

## 2. How to Understand the Task

### 2.1 Read the Task File Thoroughly
Every task file contains these sections. Read ALL of them:

```markdown
# Task: <Title>

## Metadata
- **Task ID:** <unique identifier>
- **Component ID:** <from PROJECT_STATUS.md, e.g., FE-10>
- **Phase:** <from ROADMAP.md>
- **Estimated Hours:** <from ROADMAP.md>
- **Priority:** Critical | High | Medium | Low
- **Dependencies:** <component IDs this depends on>

## Description
<detailed description of what needs to be built>

## Acceptance Criteria
<numbered list of conditions that must be met for the task to be considered complete>

## Technical Context
<technical details, references to architecture decisions, patterns to follow>

## Files Allowed to Modify
<specific files and directories that can be changed>

## Files NOT Allowed to Modify
<files and directories that must NOT be changed>

## Test Requirements
<specific testing requirements for this task>

## Definition of Done
<checklist of everything required before marking as done>
```

### 2.2 Cross-Reference with Memory System
- **ROADMAP.md**: Verify the task belongs to the current phase and confirm estimated hours
- **PROJECT_STATUS.md**: Verify the component is not already DONE or BLOCKED
- **DECISIONS/**: Read ADRs that apply to this component
- **COMPONENTS/**: Read component specification if one exists
- **CORE/**: Read architecture, naming conventions, data-model, and coding-standards

### 2.3 Clarify Ambiguities
If the task description is ambiguous:
1. Note the ambiguity in your reasoning
2. Explain your interpretation
3. Proceed with the most reasonable interpretation and flag it in your session log

---

## 3. How to Identify Allowed/Forbidden Files

### 3.1 Rules of Thumb
**Allowed to modify:**
- Source files within the component's scope (e.g., `apps/web/components/garments/` for FE-07)
- Test files for the component
- Memory system files (PROJECT_STATUS.md, CHANGELOG.md, etc.)
- Configuration files directly related to the component (e.g., adding a route)

**NOT allowed to modify (without explicit task permission):**
- Files belonging to other components
- Core infrastructure files (Docker, CI/CD configs)
- Root configuration files (tsconfig.json, package.json) unless a dependency is needed
- Other people's component specs or ADRs
- Files outside the `apps/`, `services/`, `packages/`, `project-memory/` directories

### 3.2 Scope Enforcement
```
TASK SCOPE: <component-id>
ALLOWED PATHS:
- apps/web/src/modules/<component>/
- apps/api/src/modules/<component>/
- services/ai/<component>/
- project-memory/ (for updates)

FORBIDDEN PATHS:
- apps/web/src/modules/<other-component>/
- apps/api/src/modules/<other-component>/
- docker/
- .github/
- packages/
```

### 3.3 Exception Process
If you need to modify a file outside the allowed scope:
1. Justify why it's necessary
2. Check if it violates any ADR
3. Note it in your session log
4. Flag it in the PR description

---

## 4. How to Write Tests

### 4.1 Test Requirements by Layer

**Frontend (Jest + React Testing Library):**
- Every new component: render test, interaction test, edge case test
- Every new hook: return value test, state change test, cleanup test
- Every new store: initial state test, action test, persistence test
- Coverage target: ≥70% components, ≥85% hooks/stores

**Backend (Jest + supertest):**
- Every new service method: happy path test, error path test, edge case test
- Every new controller: status code test, response body test, validation error test
- Every new guard: authorized test, unauthorized test, malformed token test
- Coverage target: ≥90% services, ≥80% controllers

**Python AI (pytest):**
- Every new model class: initialization test, inference test, error handling test
- Every new API endpoint: valid request test, invalid request test, timeout test
- Coverage target: ≥80%

### 4.2 Test File Location
```
Frontend:  co-located with component (*.spec.tsx) or in __tests__/ directory
Backend:   co-located with source (*.spec.ts) or in module's __tests__/ directory
Python:    services/ai/tests/test_<module>.py
E2E:       apps/web/e2e/ or apps/api/test/
```

### 4.3 Test Patterns to Follow

**Frontend Component Test Pattern:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GarmentCard } from './garment-card';
import { createMockGarment } from '@/test/factories/garment.factory';

describe('GarmentCard', () => {
  it('renders garment name and image', () => {
    const garment = createMockGarment({ name: 'Blue Shirt' });
    render(<GarmentCard garment={garment} onSelect={jest.fn()} />);
    expect(screen.getByText('Blue Shirt')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Blue Shirt');
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = jest.fn();
    const garment = createMockGarment();
    render(<GarmentCard garment={garment} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(garment.id);
  });

  it('displays loading skeleton when isLoading is true', () => {
    const { container } = render(<GarmentCard isLoading onSelect={jest.fn()} />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when garment is null', () => {
    render(<GarmentCard garment={null} onSelect={jest.fn()} />);
    expect(screen.getByText(/no garment/i)).toBeInTheDocument();
  });
});
```

**Backend Service Test Pattern:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GarmentService } from './garment.service';
import { GarmentEntity } from './entities/garment.entity';
import { createMock } from '@golevelup/ts-jest';

describe('GarmentService', () => {
  let service: GarmentService;
  let repository: jest.Mocked<Repository<GarmentEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GarmentService,
        {
          provide: getRepositoryToken(GarmentEntity),
          useValue: createMock<Repository<GarmentEntity>>(),
        },
      ],
    }).compile();

    service = module.get<GarmentService>(GarmentService);
    repository = module.get(getRepositoryToken(GarmentEntity));
  });

  describe('findAll', () => {
    it('should return paginated garments for a user', async () => {
      const garments = [createMockGarment()];
      repository.findAndCount.mockResolvedValue([garments, 1]);

      const result = await service.findAll('user-1', { page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return empty list when no garments exist', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll('user-1', { page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should throw NotFoundException when garment not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

**Python FastAPI Test Pattern:**
```python
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_detect_garments_success():
    with open("test_assets/shirt.jpg", "rb") as f:
        response = client.post(
            "/api/v1/detect",
            files={"image": ("shirt.jpg", f, "image/jpeg")},
        )
    assert response.status_code == 200
    data = response.json()
    assert "garment_type" in data
    assert "confidence" in data
    assert data["confidence"] > 0.5

def test_detect_garments_invalid_file():
    response = client.post(
        "/api/v1/detect",
        files={"image": ("test.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 422
    assert "detail" in response.json()

def test_detect_garments_no_file():
    response = client.post("/api/v1/detect")
    assert response.status_code == 422
```

### 4.4 Test Data Factories
Use Faker.js (TypeScript) or Faker (Python) for generating test data:
```typescript
// test/factories/garment.factory.ts
import { faker } from '@faker-js/faker';
import { IGarment } from '@/types/garment.types';
import { EGarmentType, EGarmentState } from '@/types/enums';

export function createMockGarment(overrides?: Partial<IGarment>): IGarment {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    name: faker.commerce.productName(),
    garmentType: faker.helpers.enumValue(EGarmentType),
    garmentState: EGarmentState.Active,
    brand: faker.company.name(),
    size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL']),
    color: faker.color.human(),
    imageUrl: faker.image.url(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
```

### 4.5 Mocking Guidelines
- **External services (Cloudinary, Supabase, Redis):** Always mock in unit tests
- **Repository layer:** Mock using `@golevelup/ts-jest` `createMock` or manual mocks
- **AI model inference:** Mock with predefined return values; test actual model only in integration tests
- **Socket.IO:** Mock with `socket.io-client` mock or `TestClient`
- **Third-party APIs (OpenWeatherMap, Google Calendar):** Mock with `nock` or `jest.spyOn`
- **File system:** Mock with `mock-fs` or `memfs`
- **Never mock:** The class/function under test itself

---

## 5. How to Verify Acceptance Criteria

### 5.1 Acceptance Criteria Verification Checklist
For each acceptance criterion in the task definition:

```
ACCEPTANCE CRITERION: <criterion text>
VERIFICATION METHOD: Unit test | Integration test | E2E test | Manual check
TEST FILE (if applicable): <path to test file>
PASSING: Yes | No | Not yet tested
```

### 5.2 Verification Commands
```bash
# Frontend tests
cd apps/web && npm run test -- --coverage

# Backend tests
cd apps/api && npm run test -- --coverage

# Python tests
cd services/ai && pytest --cov=.

# E2E tests (requires services running)
cd apps/web && npm run test:e2e

# Lint and typecheck (all services)
cd apps/web && npm run lint && npm run typecheck
cd apps/api && npm run lint && npm run typecheck
cd services/ai && ruff check . && mypy .

# Build check
cd apps/web && npm run build
cd apps/api && npm run build
```

### 5.3 Coverage Thresholds
| Layer | Minimum Coverage | Command to Check |
|---|---|---|
| Frontend components | ≥70% | `npm run test -- --coverage --collectCoverageFrom='components/**/*.tsx'` |
| Frontend hooks/stores | ≥85% | `npm run test -- --coverage --collectCoverageFrom='{hooks,stores}/**/*.ts'` |
| Backend services | ≥90% | `npm run test -- --coverage --collectCoverageFrom='**/*.service.ts'` |
| Backend controllers | ≥80% | `npm run test -- --coverage --collectCoverageFrom='**/*.controller.ts'` |
| Python AI | ≥80% | `pytest --cov=. --cov-fail-under=80` |
| Overall | ≥80% | `npm run test -- --coverage` |

---

## 6. Implementation Workflow

### 6.1 Step-by-Step Process

```
STEP 1: READ AND UNDERSTAND
├── Read task file completely
├── Read relevant memory files (PROJECT_STATUS, ROADMAP, ADRs, components)
├── Read existing source code in the affected area
└── Identify allowed/forbidden files

STEP 2: PLAN
├── Define implementation approach
├── List files to create
├── List files to modify
├── Design test strategy
└── Identify risks and edge cases

STEP 3: IMPLEMENT
├── Create/modify source files (smallest viable change)
├── Run lint + typecheck after each logical change
├── Write tests (TDD preferred: test first, then implement)
└── Run tests to verify

STEP 4: VERIFY
├── Run full test suite
├── Run lint + typecheck + build
├── Verify all acceptance criteria met
├── Check test coverage meets thresholds
└── Perform manual verification for UI changes

STEP 5: UPDATE MEMORY
├── Update PROJECT_STATUS.md (component status)
├── Update CHANGELOG.md (add Unreleased entry)
├── Write session log (AGENT-LOGS/)
├── Create ADR if architectural decision was made
└── Update component spec if one exists

STEP 6: COMMIT AND PR
├── Stage relevant files (source, tests, memory)
├── Commit with conventional commit message
├── Push branch
├── Create PR with description template
└── Mark task as complete in task tracking
```

### 6.2 Commit Message Format
```
type(scope): subject

Body explaining WHAT and WHY (not HOW).

Memory files updated:
- PROJECT_STATUS.md: <what changed>
- CHANGELOG.md: <what changed>

Closes #<issue-number>
```

**Types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `build`

**Examples:**
```
feat(garment): implement upload endpoint with CV preprocessing

Adds POST /api/v1/garments/upload with multer + Cloudinary pipeline.
Integrates Python CV service for garment segmentation and attribute extraction.

Memory files updated:
- PROJECT_STATUS.md: garment service → IN_PROGRESS
- CHANGELOG.md: added under Unreleased

Closes #42
```

### 6.3 Branch Creation
```bash
git checkout -b feat/<scope>/<kebab-case-description>
# or
git checkout -b fix/<scope>/<kebab-case-description>
```

---

## 7. Self-Review Checklist

Before submitting your work, verify ALL of the following:

### 7.1 Code Quality
- [ ] Code compiles without errors (`npm run build` / `nest build` / `tsc --noEmit`)
- [ ] Linting passes (`npm run lint` / `ruff check .`)
- [ ] Type checking passes (`npm run typecheck` / `mypy .`)
- [ ] No `console.log` / `debugger` statements left in code
- [ ] No commented-out code
- [ ] No `any` types (without approved exception)
- [ ] No magic numbers (all constants named)
- [ ] No TODO/FIXME without a linked GitHub Issue

### 7.2 Correctness
- [ ] Code implements the exact behavior described in the task
- [ ] All acceptance criteria are met
- [ ] Error states are handled (not swallowed)
- [ ] Edge cases handled (empty state, null values, network errors)
- [ ] Input validation is present where user data enters the system
- [ ] Business logic is correct (no off-by-one, incorrect comparisons)

### 7.3 Testing
- [ ] New code has tests (unit + integration where applicable)
- [ ] All existing tests still pass
- [ ] Test coverage meets thresholds (≥80%)
- [ ] Bug fixes include a regression test
- [ ] Tests are deterministic (no flaky tests)
- [ ] Mock files are properly set up and cleaned up

### 7.4 Security
- [ ] No secrets, keys, or credentials in code
- [ ] All user inputs are validated and sanitized
- [ ] SQL queries are parameterized (no string interpolation)
- [ ] Permissions/authorization is checked for protected operations
- [ ] No sensitive data is logged or exposed in error messages

### 7.5 Performance
- [ ] No N+1 query patterns (watch for TypeORM lazy loading)
- [ ] Lists are paginated where there could be many results
- [ ] Images use Next.js Image component with proper sizing
- [ ] Heavy components are lazy-loaded with `next/dynamic`
- [ ] Expensive computations are memoized where appropriate

### 7.6 Documentation
- [ ] Public APIs have TSDoc/JSDoc comments
- [ ] Complex logic has inline comments explaining WHY
- [ ] Component follows naming conventions
- [ ] Code is self-documenting (descriptive names, small functions)

### 7.7 Memory System
- [ ] PROJECT_STATUS.md updated with correct component status
- [ ] CHANGELOG.md updated under [Unreleased]
- [ ] AGENT-LOGS/session-<date>--<agent-id>.md written
- [ ] ADR created if new architectural decision was made
- [ ] Component spec updated if one exists

### 7.8 Git/PR Readiness
- [ ] Branch name follows convention
- [ ] Commit messages follow conventional commit format
- [ ] PR description follows the template
- [ ] PR size ≤400 lines changed (excluding lockfiles, auto-generated files)
- [ ] Branch is up to date with main
- [ ] No merge conflicts

---

## 8. Commit and PR Creation Instructions

### 8.1 Creating a Commit
```bash
# Stage specific files (never use git add . or git add -A)
git add apps/web/components/garments/garment-card.tsx
git add apps/web/components/garments/garment-card.spec.tsx
git add project-memory/PROJECT_STATUS.md
git add project-memory/CHANGELOG.md

# Commit with conventional message
git commit -m "feat(garment): implement garment card component

Adds GarmentCard component with image, name, brand, and wear count display.
Includes loading skeleton, empty state, and error state variants.

Memory files updated:
- PROJECT_STATUS.md: FE-07 → IN_PROGRESS
- CHANGELOG.md: added under Unreleased

Closes #45"
```

### 8.2 Creating a PR
```bash
# Push branch
git push -u origin feat/garment/garment-card

# Create PR (using gh CLI)
gh pr create \
  --title "feat(garment): implement garment card component" \
  --body "$(cat << 'EOF'
## Summary
Implements the GarmentCard component for the wardrobe grid view.

## Changes
### Frontend
- apps/web/components/garments/garment-card.tsx: new card component
- apps/web/components/garments/garment-card.spec.tsx: unit tests
- apps/web/components/garments/garment-card.stories.tsx: Storybook stories

## Testing
- [x] Unit tests for render, interaction, loading, empty, error states
- [x] All existing tests pass
- [x] Manual testing on desktop and mobile viewports

## Memory System Updates
- [x] PROJECT_STATUS.md updated
- [x] CHANGELOG.md updated

Closes #45
EOF
)"
```

### 8.3 PR Template Structure
```markdown
## Summary
<2-3 sentences explaining what this PR does and why>

## Changes
### Frontend
- <file path>: <change description>

### Backend
- <file path>: <change description>

### AI / CV
- <file path>: <change description>

### Infrastructure
- <file path>: <change description>

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Memory System Updates
- [ ] PROJECT_STATUS.md updated
- [ ] CHANGELOG.md updated
- [ ] ADR created/updated (if applicable)
- [ ] Component spec updated (if applicable)

## Screenshots (if UI change)
<drag and drop screenshots here>

## Related Issues
Closes #<issue-number>
```

### 8.4 PR Merge Requirements
- [ ] At least one approval (human for AI PRs)
- [ ] All CI checks pass
- [ ] No merge conflicts
- [ ] PR description is complete
- [ ] Memory files updated
- [ ] Use **squash merge** for feature branches
- [ ] Delete branch after merge

---

## 9. Task Completion Template

After the task is complete, update the task file status:

```markdown
## Execution Log
- **Agent:** <agent-id>
- **Date:** YYYY-MM-DD
- **Status:** DONE | IN_PROGRESS | BLOCKED | FAILED
- **Actual Hours:** <hours spent>
- **PR URL:** <link to PR>

## Deviations from Plan
- <any changes from the original plan, with justification>

## Issues Encountered
- <any issues, surprises, or lessons learned>

## Notes for Future Agents
- <anything future agents should know about this component>
```
