# TASK-011

# Create Garment List Endpoint (GET /garments)

## OBJECTIVE

Implement the `GET /garments` endpoint that returns a paginated, filterable, sortable, and searchable list of the authenticated user's garments. The endpoint supports query parameters for page, limit, type, state, color, season, sort by, sort order, and search keyword.

## CONTEXT FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/dto/query-garments.dto.ts`
- `backend/src/garments/garments.module.ts`

## ALLOWED FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/dto/query-garments.dto.ts` (create)
- `backend/src/common/dto/pagination.dto.ts` (create if not exists)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `QueryGarmentsDto` extending a reusable `PaginationDto`:
   - `page`: number (optional, default 1), `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Type(() => Number)`
   - `limit`: number (optional, default 20, max 100), `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(100)`, `@Type(() => Number)`
   - `type`: string (optional), `@IsOptional()`, `@IsEnum(GarmentType)`
   - `state`: string (optional), `@IsOptional()`, `@IsEnum(GarmentState)`
   - `color`: string (optional), `@IsOptional()`, `@IsString()`
   - `season`: string (optional), `@IsOptional()`, `@IsString()`
   - `sortBy`: string (optional, default 'created_at'), `@IsOptional()`, `@IsIn(['created_at', 'usage_count', 'last_used_at', 'name'])`
   - `sortOrder`: string (optional, default 'desc'), `@IsOptional()`, `@IsIn(['asc', 'desc'])`
   - `search`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(100)`

2. Create `PaginationDto` base class:
   - `page` and `limit` fields with same validation.
   - A `getSkip()` method that returns `(page - 1) * limit`.
   - Can be reused across all list endpoints.

3. In `GarmentsService.findAll(userId: string, query: QueryGarmentsDto)`:
   - Build a dynamic database query:
     - WHERE `user_id = userId` AND `deleted_at IS NULL`
     - If `type` provided, add `AND type = :type`
     - If `state` provided, add `AND state = :state`
     - If `color` provided, add `AND color = :color`
     - If `season` provided, add `AND season = :season`
     - If `search` provided, add full-text search condition using the GIN index (match against name and brand)
   - Apply sorting: `ORDER BY <sortBy> <sortOrder>`, with a secondary sort by `id` for determinism.
   - Apply pagination: `LIMIT :limit OFFSET :skip`.
   - Execute a count query (same filters, no pagination) for total count.
   - Return `{ data: Garment[], meta: { total, page, limit, totalPages } }`.

4. In `GarmentsController.findAll()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Query() query: QueryGarmentsDto`.
   - Pass `userId` from `@CurrentUser('id')`.
   - Return HTTP 200 with paginated response.

## ACCEPTANCE CRITERIA

- `GET /garments` returns HTTP 200 with `{ data: [...], meta: { total, page, limit, totalPages } }`.
- `GET /garments?page=1&limit=10` returns at most 10 items.
- `GET /garments?type=shirt` returns only shirts.
- `GET /garments?state=available` returns only available garments.
- `GET /garments?sortBy=usage_count&sortOrder=desc` returns most used first.
- `GET /garments?search=summer` returns garments with "summer" in name or brand.
- `GET /garments?type=invalid` returns HTTP 400.
- `GET /garments` without auth returns HTTP 401.
- `GET /garments` for a user with no garments returns `{ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }`.

## EDGE CASES

- `page` or `limit` as strings in query must be transformed to numbers (use `@Type(() => Number)` from class-transformer).
- Negative values for `page` or `limit` must return 400.
- `limit` exceeding 100 must be capped to 100 or return 400.
- `search` with special SQL characters must be parameterized (prevent SQL injection).
- Soft-deleted garments must never appear in results.
- When `sortBy` is `last_used_at` and many items are NULL, they should appear at the end regardless of sort order.

## TESTS REQUIRED

- Unit test: `GarmentsService.findAll()` builds correct query for each filter.
- Unit test: `QueryGarmentsDto` validates with defaults.
- Integration test: Full list with pagination, verify meta object.
- Integration test: Filter by type, state, color, season.
- Integration test: Sort by each supported field.
- Integration test: Search returns matching results.
- Integration test: Empty list returns zero total.

## EXPECTED OUTPUT

- `backend/src/common/dto/pagination.dto.ts`
- `backend/src/garments/dto/query-garments.dto.ts`
- Updated `backend/src/garments/garments.service.ts` with `findAll()` method.
- Updated `backend/src/garments/garments.controller.ts` with `GET /garments`.
- All tests pass.
