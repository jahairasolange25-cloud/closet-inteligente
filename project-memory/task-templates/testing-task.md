# Testing Task Template

## TASK_ID: `TEST-<TASK_ID>`

> **Title**: <TITLE>
>
> **Objective**: <OBJECTIVE — one clear sentence describing what testing gap is being addressed>

---

## CONTEXT FILES

```
# Example:
src/modules/wardrobe/wardrobe.service.ts
src/modules/wardrobe/wardrobe.controller.ts
src/modules/wardrobe/dto/create-wardrobe.dto.ts
src/modules/wardrobe/__tests__/wardrobe.service.spec.ts
vitest.config.ts (or jest.config.ts)
```

**Guidance**: Include the source files under test, any existing test files (to understand patterns), and the test config file.

---

## ALLOWED FILES

```
src/modules/wardrobe/__tests__/
src/modules/wardrobe/wardrobe.service.ts  (if minor refactoring for testability)
```

---

## FORBIDDEN FILES

```
src/modules/auth/__tests__/
src/modules/payments/__tests__/
vitest.config.ts
```

---

## REQUIREMENTS

```
- [ ] Achieve >= 90% branch coverage on `wardrobe.service.ts`
- [ ] Achieve >= 85% line coverage on `wardrobe.controller.ts`
- [ ] All existing tests must continue to pass
- [ ] No `it.skip` or `describe.skip` — every test must run
- [ ] Use dependency injection — mock Prisma/Supabase client, never hit a real database
- [ ] Test file must mirror source file structure: `wardrobe.service.ts` → `wardrobe.service.spec.ts`
```

**Guidance on test coverage**:
- Target: unit tests: 90%+ branch coverage, integration tests: 70%+ line coverage on critical paths.
- Use Vitest's `coverage.threshold` in config to enforce minimums. The CI pipeline should fail if coverage drops.
- Don't chase 100% — skip DTOs, pure config exports, and trivially delegated methods.
- Write tests for error paths first (they are usually untested), then happy paths.

**Guidance on test types**:
- **Unit tests** (`*.spec.ts`): Test a single class/module in isolation. Mock all external dependencies (DB, Redis, Cloudinary, AI pipeline client).
- **Integration tests** (`*.test.ts` or `*.e2e-spec.ts`): Test a request → response flow through controller + service + mock DB. Use `@nestjs/testing` `Test.createTestingModule`.
- **E2E tests** (`test/e2e/`): Spin up the full app (or Docker Compose) and test real HTTP calls. Use `supertest`.
- **Component tests** (frontend `*.test.tsx`): Test a single React component with RTL. Mock API calls at the service layer.

**Guidance on mocking**:
- Backend: Use `vitest.mock` (or `jest.mock`) for modules. For Prisma, use `mockDeep` from `prisma-mock`.
- Frontend: Mock API client modules with `vi.mock('@/lib/api/...')`. Mock Zustand stores by calling `setState` directly.
- AI: Mock model inference with fixture outputs. Never load real models in CI.
- Never mock what you don't own (stdlib, third-party libraries) unless necessary — wrap them in an adapter instead.

---

## ACCEPTANCE CRITERIA

```
GIVEN the test suite is run
WHEN coverage is computed
THEN wardrobe.service.ts branch coverage >= 90%
AND wardrobe.controller.ts line coverage >= 85%
AND 0 tests are skipped

GIVEN a test modifies the mocked Prisma client
WHEN the test succeeds
THEN no real database connection is attempted
AND no data is persisted

GIVEN all tests are passing
WHEN `npm run test -- --coverage` runs
THEN exit code is 0
AND coverage report is generated in `coverage/`
```

---

## EDGE CASES

```
- [ ] Test file imports the real database module → must fail lint or review
- [ ] Flaky test (depends on timing, randomness, or ordering) → must use `vi.useFakeTimers` or seeded RNG
- [ ] Async test that does not await → caught by `eslint-plugin-vitest` `no-standalone-expect`
```

---

## TESTS REQUIRED

```
src/modules/wardrobe/__tests__/wardrobe.service.spec.ts
  - "createItem: inserts item via prisma.wardrobeItem.create"
  - "createItem: throws when category is invalid"
  - "createItem: throws when wardrobe not found (404)"
  - "getItemsByWardrobeId: returns paginated items"
  - "getItemsByWardrobeId: filters by category"
  - "getItemsByWardrobeId: returns empty array for no matches"
  - "getItemsByWardrobeId: clamps pageSize to 100"
  - "updateItem: updates item fields"
  - "updateItem: throws when item does not exist (404)"
  - "deleteItem: soft-deletes item (sets deletedAt)"
  - "deleteItem: hard-deletes item older than 30 days"

src/modules/wardrobe/__tests__/wardrobe.controller.spec.ts
  - "POST /wardrobe/:id/items returns 201 with created item"
  - "POST /wardrobe/:id/items returns 400 for invalid DTO"
  - "POST /wardrobe/:id/items returns 404 for missing wardrobe"
  - "GET /wardrobe/:id/items returns 200 with paginated response"
```

---

## EXPECTED OUTPUT

```
FILES CREATED:
  - src/modules/wardrobe/__tests__/wardrobe.service.spec.ts
  - src/modules/wardrobe/__tests__/wardrobe.controller.spec.ts

FILES MODIFIED:
  - (none — unless minor refactoring for testability)

Coverage results:
  wardrobe.service.ts   lines: 95%, branches: 92%
  wardrobe.controller.ts lines: 88%, branches: 86%

All tests pass: npm run test -- --coverage
```

---

## Example: Well-Formed Testing Task

```
TASK_ID: TEST-0012
TITLE: Write unit tests for outfit generation pipeline
OBJECTIVE: Achieve 85% branch coverage on the outfit generation pipeline steps with mocked model inference.

CONTEXT FILES:
  ai/pipelines/outfit_generator/steps/detect_items.py
  ai/pipelines/outfit_generator/steps/classify_textures.py
  ai/pipelines/outfit_generator/steps/color_compatibility.py
  ai/pipelines/outfit_generator/pipeline.py
  ai/pipelines/outfit_generator/schemas.py
  ai/test_fixtures/

ALLOWED FILES:
  ai/pipelines/outfit_generator/steps/
  ai/pipelines/outfit_generator/pipeline.py
  ai/pipelines/outfit_generator/tests/

FORBIDDEN FILES:
  ai/pipelines/outfit_generator/config.yaml
  ai/training/

REQUIREMENTS:
  - [ ] detect_items.py: 90% branch coverage
  - [ ] classify_textures.py: 85% branch coverage
  - [ ] color_compatibility.py: 90% branch coverage
  - [ ] pipeline.py: 80% branch coverage
  - [ ] Model inference calls mocked — no real model loaded in CI
  - [ ] All tests use fixtures from ai/test_fixtures/

TESTS REQUIRED:
  ai/pipelines/outfit_generator/tests/test_detect_items.py
  ai/pipelines/outfit_generator/tests/test_classify_textures.py
  ai/pipelines/outfit_generator/tests/test_color_compatibility.py
  ai/pipelines/outfit_generator/tests/test_pipeline.py

EXPECTED OUTPUT:
  FILES CREATED:
    - ai/pipelines/outfit_generator/tests/test_detect_items.py
    - ai/pipelines/outfit_generator/tests/test_classify_textures.py
    - ai/pipelines/outfit_generator/tests/test_color_compatibility.py
    - ai/pipelines/outfit_generator/tests/test_pipeline.py
  All pass, coverage thresholds met.
```
