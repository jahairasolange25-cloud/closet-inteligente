# TASK-023

# Create Outfit List Endpoint (GET /outfits)

## OBJECTIVE

Implement the `GET /outfits` endpoint that returns a paginated, filterable list of the authenticated user's outfits. Supports filtering by type and completion status, sorting by creation date or name, and pagination.

## CONTEXT FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/dto/query-outfits.dto.ts`
- `backend/src/common/dto/pagination.dto.ts`

## ALLOWED FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/dto/query-outfits.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `QueryOutfitsDto` extending `PaginationDto`:
   - Inherits `page`, `limit` from `PaginationDto`.
   - `type`: string (optional), `@IsOptional()`, `@IsEnum(OutfitType)`
   - `is_complete`: boolean (optional), `@IsOptional()`, `@IsBoolean()`, `@Transform(({ value }) => value === 'true')`
   - `sortBy`: string (optional, default 'created_at'), `@IsOptional()`, `@IsIn(['created_at', 'name'])`
   - `sortOrder`: string (optional, default 'desc'), `@IsOptional()`, `@IsIn(['asc', 'desc'])`

2. In `OutfitsService.findAll(userId: string, query: QueryOutfitsDto)`:
   - Build dynamic query: WHERE `user_id = userId` AND `deleted_at IS NULL`
   - If `type` provided, add `AND type = :type`
   - If `is_complete` provided, add `AND is_complete = :is_complete`
   - Apply sorting and pagination.
   - For each outfit, include the associated garments (eager load or separate query).
   - Return `{ data: Outfit[], meta: { total, page, limit, totalPages } }`.

3. In `OutfitsController.findAll()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Query() query: QueryOutfitsDto`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `GET /outfits` returns HTTP 200 with `{ data: [...], meta: {...} }`.
- `GET /outfits?type=formal` returns only formal outfits.
- `GET /outfits?is_complete=true` returns only complete outfits.
- `GET /outfits?sortBy=name&sortOrder=asc` returns alphabetical order.
- `GET /outfits?page=1&limit=5` returns at most 5 items.
- `GET /outfits` includes associated garments for each outfit.
- `GET /outfits` without auth returns HTTP 401.
- Empty list returns `{ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }`.

## EDGE CASES

- `is_complete` query parameter comes as string `'true'` or `'false'` from URL; must be transformed to boolean.
- Outfits with soft-deleted garments should still appear but with only non-deleted garments in the response.
- Pagination must exclude soft-deleted outfits.
- When sorting by `name`, use case-insensitive sorting.

## TESTS REQUIRED

- Unit test: `OutfitsService.findAll()` builds correct query for each filter.
- Unit test: `QueryOutfitsDto` validates correctly.
- Integration test: Full list with pagination.
- Integration test: Filter by type and is_complete.
- Integration test: Empty list returns zero total.

## EXPECTED OUTPUT

- `backend/src/outfits/dto/query-outfits.dto.ts`
- Updated `backend/src/outfits/outfits.service.ts` with `findAll()` method.
- Updated `backend/src/outfits/outfits.controller.ts` with `GET /outfits`.
- All tests pass.
