# TASK-041

# Create Analytics Usage Endpoint (GET /analytics/usage)

## OBJECTIVE

Implement the `GET /analytics/usage` endpoint that returns platform usage analytics for the authenticated user, including login frequency, most active days, outfit creation trends, and storage usage.

## CONTEXT FILES

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/auth/auth.service.ts` (for login data)
- `backend/src/outfits/outfits.service.ts`

## ALLOWED FILES

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/dto/query-usage-analytics.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `QueryUsageAnalyticsDto` (optional):
   - `period`: string (optional), `@IsOptional()`, `@IsIn(['7d', '30d', '90d'])` — defaults to `'30d'`.

2. In `AnalyticsService.getUsageAnalytics(userId: string, period: string)`:
   - Compute based on the time period:
     a. `total_logins`: count of login events (from audit log or Redis) in the period.
     b. `total_outfits_created`: count of outfits created in the period.
     c. `total_garments_added`: count of garments added in the period.
     d. `total_outfits_worn`: count of calendar events with `is_worn = true` in the period.
     e. `most_active_day`: day of week with most login activity (e.g., `"Monday"`).
     f. `storage_used_bytes`: total size of uploaded images (sum from garment records or storage service).
     g. `storage_remaining_bytes`: maximum storage limit minus used (assume 500MB default per user).
     h. `streak_days`: number of consecutive days with at least one login or event.
   - Return the analytics object.

3. In `AnalyticsController.getUsageAnalytics()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Query() query: QueryUsageAnalyticsDto`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `GET /analytics/usage` returns HTTP 200 with all usage metrics.
- `GET /analytics/usage?period=7d` returns data for the last 7 days.
- `GET /analytics/usage?period=90d` returns data for the last 90 days.
- `GET /analytics/usage` with invalid period returns HTTP 400.
- `total_logins`, `total_outfits_created`, `total_garments_added`, `total_outfits_worn` are integers.
- `storage_used_bytes` and `storage_remaining_bytes` are integers (bytes).
- `streak_days` is an integer representing consecutive active days.
- Without auth returns HTTP 401.

## EDGE CASES

- If no login data exists, `total_logins` should be 0 and `most_active_day` should be null.
- `streak_days` calculation: iterate backwards from today, counting consecutive days with activity; break on first inactive day.
- Storage metrics should query the actual file sizes from the storage provider (or use the `image_url` metadata if stored).
- Default storage limit per user is 500MB (500 * 1024 * 1024 bytes).
- If the period exceeds available data, return metrics for the available window without error.

## TESTS REQUIRED

- Unit test: `AnalyticsService.getUsageAnalytics()` computes streak days correctly.
- Unit test: `QueryUsageAnalyticsDto` defaults to '30d'.
- Integration test: `GET /analytics/usage` returns 200 with complete object.
- Integration test: `GET /analytics/usage` with different periods returns correct date ranges.

## EXPECTED OUTPUT

- `backend/src/analytics/dto/query-usage-analytics.dto.ts`
- Updated `backend/src/analytics/analytics.service.ts` with `getUsageAnalytics()` method.
- Updated `backend/src/analytics/analytics.controller.ts` with `GET /analytics/usage`.
- All tests pass.
