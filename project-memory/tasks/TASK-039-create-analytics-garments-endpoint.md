# TASK-039

# Create Analytics Garments Endpoint (GET /analytics/garments)

## OBJECTIVE

Implement the `GET /analytics/garments` endpoint that returns analytics about the authenticated user's garments, including most viewed items, usage metrics, state distribution, and type breakdown.

## CONTEXT FILES

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.module.ts`
- `backend/src/garments/garments.service.ts`

## ALLOWED FILES

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.module.ts`
- `backend/src/analytics/dto/query-analytics.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. No DTO required for this endpoint (it uses no query parameters beyond auth).

2. In `AnalyticsService.getGarmentAnalytics(userId: string)`:
   - Query the database to compute:
     a. `total_garments`: count of non-deleted garments.
     b. `type_breakdown`: `{ shirt: number, pants: number, shoes: number, ... }` — count per type.
     c. `state_breakdown`: `{ available: number, washing: number, ... }` — count per state.
     d. `most_used`: top 5 garments by `usage_count` (descending), with id, name, type, usage_count.
     e. `least_used`: bottom 5 garments by `usage_count` (ascending), with id, name, type, usage_count.
     f. `never_used`: count of garments with `usage_count = 0`.
     g. `avg_usage_per_garment`: average `usage_count` across all garments.
   - Return the analytics object.

3. In `AnalyticsController.getGarmentAnalytics()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `GET /analytics/garments` returns HTTP 200 with all computed metrics.
- Response includes `total_garments`, `type_breakdown`, `state_breakdown`, `most_used`, `least_used`, `never_used`, `avg_usage_per_garment`.
- `most_used` returns exactly 5 items (or fewer if user has less than 5 garments).
- `least_used` returns garments with lowest usage count (excluding those with `usage_count = 0` which appear in `never_used`).
- `type_breakdown` includes all 8 garment types (even if count is 0).
- `state_breakdown` includes all 6 garment states (even if count is 0).
- Only non-deleted garments are included in all calculations.
- Without auth returns HTTP 401.

## EDGE CASES

- User with zero garments: all counts should be 0, `most_used` and `least_used` should be empty arrays.
- `avg_usage_per_garment` should be 0 if no garments exist (avoid division by zero).
- `type_breakdown` must include types with 0 count so the frontend can display the full breakdown.
- `state_breakdown` must include states with 0 count for the same reason.
- Soft-deleted garments must be excluded from all metrics.

## TESTS REQUIRED

- Unit test: `AnalyticsService.getGarmentAnalytics()` computes correct metrics.
- Unit test: Zero garments returns all zeros/empty arrays.
- Integration test: `GET /analytics/garments` returns 200 with complete object.
- Integration test: `GET /analytics/garments` without auth returns 401.

## EXPECTED OUTPUT

- `backend/src/analytics/analytics.controller.ts` with `GET /analytics/garments`.
- `backend/src/analytics/analytics.service.ts` with `getGarmentAnalytics()` method.
- All tests pass.
