# TASK-015

# Create Garment Search Endpoint (GET /garments/search)

## OBJECTIVE

Implement the `GET /garments/search` endpoint that performs full-text search on garment names and brands using the PostgreSQL GIN index. The endpoint returns ranked results sorted by relevance, with support for the same filters and pagination as the list endpoint.

## CONTEXT FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/dto/search-garments.dto.ts`
- `backend/src/garments/dto/query-garments.dto.ts`

## ALLOWED FILES

- `backend/src/garments/garments.controller.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/dto/search-garments.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `SearchGarmentsDto`:
   - Extend `PaginationDto` (reuse page, limit).
   - `q`: string, `@IsString()`, `@IsNotEmpty()`, `@MaxLength(100)` — the search query.
   - `type`: string (optional), `@IsOptional()`, `@IsEnum(GarmentType)`
   - `state`: string (optional), `@IsOptional()`, `@IsEnum(GarmentState)`
   - `color`: string (optional), `@IsOptional()`, `@IsString()`
   - `season`: string (optional), `@IsOptional()`, `@IsString()`

2. In `GarmentsService.search(userId: string, dto: SearchGarmentsDto)`:
   - Build a query that uses PostgreSQL full-text search:
     - `WHERE user_id = :userId AND deleted_at IS NULL`
     - `AND to_tsvector('spanish', name || ' ' || COALESCE(brand, '')) @@ plainto_tsquery('spanish', :query)`
   - Apply same optional filters as the list endpoint (type, state, color, season).
   - Order by `ts_rank(to_tsvector('spanish', name || ' ' || COALESCE(brand, '')), plainto_tsquery('spanish', :query)) DESC`.
   - Apply pagination.
   - Execute a count query with same conditions.
   - Return `{ data: Garment[], meta: { total, page, limit, totalPages } }`.

3. In `GarmentsController.search()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Query() dto: SearchGarmentsDto`.
   - Return HTTP 200 with search results.

## ACCEPTANCE CRITERIA

- `GET /garments/search?q=summer` returns garments with "summer" in name or brand, ranked by relevance.
- `GET /garments/search?q=summer&type=shirt` returns only shirts matching "summer".
- `GET /garments/search?q=summer&page=1&limit=5` returns at most 5 results.
- `GET /garments/search?q=` returns HTTP 400 (empty query).
- `GET /garments/search?q=ab` with no matches returns `{ data: [], meta: { total: 0, ... } }`.
- `GET /garments/search?q=sql+injection'` is safely parameterized and does not break.
- Search results exclude soft-deleted garments.
- `GET /garments/search` without auth returns HTTP 401.

## EDGE CASES

- The `q` parameter must be sanitized against SQL injection (always use parameterized queries).
- The search must use `plainto_tsquery` (not `to_tsquery`) to handle user input with spaces and punctuation gracefully.
- Use the 'spanish' text search configuration for proper stemming of Spanish garment names.
- If the GIN index exists (from TASK-009), the query planner should use it; include `EXPLAIN ANALYZE` verification.
- Empty search results with a valid `q` should still return valid pagination metadata.
- Accented characters (e.g., "camisón") should be matched against unaccented queries (requires `unaccent` extension; if not available, document limitation).

## TESTS REQUIRED

- Unit test: `GarmentsService.search()` builds full-text search query.
- Unit test: `SearchGarmentsDto` rejects empty `q`.
- Integration test: Search returns ranked results.
- Integration test: Search with filter applies additional WHERE clause.
- Integration test: Search with no matches returns empty array.
- Integration test: Search query is safely parameterized (special characters test).

## EXPECTED OUTPUT

- `backend/src/garments/dto/search-garments.dto.ts`
- Updated `backend/src/garments/garments.service.ts` with `search()` method.
- Updated `backend/src/garments/garments.controller.ts` with `GET /garments/search`.
- All tests pass.
