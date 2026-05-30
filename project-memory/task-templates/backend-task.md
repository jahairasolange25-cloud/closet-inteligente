# Backend Task Template

## TASK_ID: `BACK-<TASK_ID>`

> **Title**: <TITLE>
>
> **Objective**: <OBJECTIVE — one clear sentence describing what this task accomplishes>

---

## CONTEXT FILES

List every file the agent must read before starting. Be specific with relative paths from project root.

```
# Example:
src/modules/wardrobe/wardrobe.service.ts
src/modules/wardrobe/wardrobe.controller.ts
src/modules/wardrobe/wardrobe.module.ts
src/common/interfaces/wardrobe.interface.ts
```

**Guidance**: Include files that define the module's contract (DTOs, interfaces), its service/controller layer, relevant Prisma/Supabase schema files, and any shared decorators/guards. When in doubt, include the parent module file.

---

## ALLOWED FILES

Files the agent may modify.

```
src/modules/wardrobe/
src/common/interfaces/wardrobe.*
```

**Guidance**: Keep the scope tight. List directories or glob patterns. Never allow sweeping top-level directories unless the task genuinely affects the entire module.

---

## FORBIDDEN FILES

Files the agent must NOT touch.

```
src/modules/auth/
src/modules/payments/
src/common/decorators/
*.config.ts
```

**Guidance**: Protect orthogonal modules, shared config that would cause cascading changes, and any file the agent does not have context to modify safely.

---

## REQUIREMENTS

Bullet-list of functional and non-functional requirements.

```
- [ ] Expose `GET /wardrobe/:id/items` endpoint returning paginated wardrobe items
- [ ] Items must be filterable by `category` query param (shoes, tops, bottoms, accessories)
- [ ] Response must include `totalCount`, `page`, `pageSize` in the envelope
- [ ] Each item must include `imageUrl`, `category`, `brand`, `color`, `lastWorn`
- [ ] Endpoint must be authenticated via `@UseGuards(JwtAuthGuard)`
- [ ] Cache responses for 60 seconds using Redis — use `CacheInterceptor` from `@nestjs/cache-manager`
```

**Guidance**: Start with the contract (route, method, shape), then layer on auth, caching, validation, and error handling. Every requirement should be independently verifiable. Use checkboxes `- [ ]` so they can be ticked off during review.

---

## ACCEPTANCE CRITERIA

Concrete, testable pass/fail conditions.

```
GIVEN a logged-in user with wardrobe items across 3 categories
WHEN they call GET /wardrobe/:id/items?category=tops&page=1&pageSize=10
THEN the response status is 200
AND the body contains:
  - data: array of items all having category === "tops"
  - totalCount: number matching count of tops items
  - page: 1
  - pageSize: 10
AND each item object contains: id, imageUrl, category, brand, color, lastWorn
AND the response includes x-cache header (HIT or MISS)

GIVEN the same request is repeated within 60 seconds
WHEN the user calls the endpoint again
THEN the response is served from cache (x-cache: HIT)
AND the response time is < 50ms
```

**Guidance**: Write 3-5 scenarios covering happy path, empty state, error state, and cache behaviour. Use GIVEN/WHEN/THEN structure.

---

## EDGE CASES

Situations that must be handled correctly.

```
- [ ] ?category=INVALID returns 400 with descriptive error message
- [ ] Wardrobe belongs to another user → 403 Forbidden
- [ ] Wardrobe ID is not a valid UUID → 400 Bad Request
- [ ] pageSize > 100 → clamp to 100 and return a warning header
- [ ] No items match the filter → data: [], totalCount: 0, 200 OK
```

**Guidance**: Think about malformed input, authorization boundaries, resource limits, and degenerate data states.

---

## TESTS REQUIRED

Specify exact files and test-case names.

```
src/modules/wardrobe/__tests__/wardrobe.controller.spec.ts
  - "GET /wardrobe/:id/items returns paginated items"
  - "GET /wardrobe/:id/items returns 403 for unauthorized access"
  - "GET /wardrobe/:id/items clamps pageSize to 100"

src/modules/wardrobe/__tests__/wardrobe.service.spec.ts
  - "findItemsByWardrobe filters by category"
  - "findItemsByWardrobe returns empty array when no matches"
```

**Guidance**: Be explicit about file paths and test descriptions. Prefer service-level unit tests plus controller-level integration tests.

---

## EXPECTED OUTPUT

Describe what a successful implementation looks like at the filesystem level.

```
After completion the following changes should exist:

FILES CREATED:
  - (none)

FILES MODIFIED:
  - src/modules/wardrobe/wardrobe.controller.ts    (+20 lines)
  - src/modules/wardrobe/wardrobe.service.ts       (+35 lines)
  - src/modules/wardrobe/__tests__/wardrobe.controller.spec.ts  (new, +80 lines)
  - src/modules/wardrobe/__tests__/wardrobe.service.spec.ts     (new, +60 lines)

All tests pass: npm run test -- --testPathPattern=wardrobe
Lint passes: npm run lint
```

**Guidance**: Helps the agent self-verify and helps the reviewer confirm nothing was missed. Always include the verification commands.

---

## Example: Well-Formed Backend Task

```
TASK_ID: BACK-0042
TITLE: Add outfit generation history endpoint
OBJECTIVE: Expose a paginated, filterable history endpoint for previously generated outfit combinations.

CONTEXT FILES:
  src/modules/outfit/outfit.service.ts
  src/modules/outfit/outfit.controller.ts
  src/modules/outfit/outfit.module.ts
  src/modules/outfit/dto/create-outfit.dto.ts
  src/modules/outfit/interfaces/outfit.interface.ts
  prisma/schema.prisma (outfit_generation table)

ALLOWED FILES:
  src/modules/outfit/

FORBIDDEN FILES:
  src/modules/generation/
  src/modules/wardrobe/
  src/common/config/

REQUIREMENTS:
  - [ ] GET /outfit/history?page=1&pageSize=20 returns outfit generations ordered by createdAt DESC
  - [ ] Filter by ?status=(pending|completed|failed)
  - [ ] Filter by ?fromDate and ?toDate (ISO 8601)
  - [ ] Response envelope: { data: OutfitGeneration[], totalCount, page, pageSize }
  - [ ] Authenticated — user can only see their own history
  - [ ] Cache with Redis, TTL 30 seconds

ACCEPTANCE CRITERIA:
  GIVEN a user with 50 outfit generations
  WHEN they call GET /outfit/history?page=1&pageSize=10
  THEN status is 200
  AND data.length === 10
  AND totalCount === 50
  AND results are ordered by createdAt DESC

  GIVEN the user has 3 failed generations
  WHEN they call GET /outfit/history?status=failed
  THEN data.length === 3
  AND every item has status === "failed"

EDGE CASES:
  - [ ] page=0 or page=1 treated as first page
  - [ ] pageSize <= 0 treated as default (20)
  - [ ] fromDate > toDate returns 400
  - [ ] No history → data: [], totalCount: 0

TESTS REQUIRED:
  src/modules/outfit/__tests__/outfit-history.service.spec.ts
    - "returns paginated results ordered by createdAt DESC"
    - "filters by status"
    - "filters by date range"
    - "returns empty result when no history exists"
  src/modules/outfit/__tests__/outfit-history.controller.spec.ts
    - "GET /outfit/history returns 200 with correct envelope shape"
    - "GET /outfit/history returns 401 without auth token"

EXPECTED OUTPUT:
  FILES MODIFIED:
    - src/modules/outfit/outfit.controller.ts
    - src/modules/outfit/outfit.service.ts
  FILES CREATED:
    - src/modules/outfit/__tests__/outfit-history.service.spec.ts
    - src/modules/outfit/__tests__/outfit-history.controller.spec.ts
  Tests pass, lint passes.
```
