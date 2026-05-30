# TASK-040

# Create Analytics AI Precision Endpoint (GET /analytics/ai-precision)

## OBJECTIVE

Implement the `GET /analytics/ai-precision` endpoint that returns metrics about the AI pipeline's accuracy and performance, including detection precision, classification accuracy, and processing times.

## CONTEXT FILES

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/database/` (for querying pipeline metadata)

## ALLOWED FILES

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. In `AnalyticsService.getAIPrecisionAnalytics(userId: string)`:
   - Query pipeline processing data for the user's garments to compute:
     a. `total_processed`: total number of garments processed by the pipeline.
     b. `successful`: count of pipeline runs that completed successfully.
     c. `failed`: count of pipeline runs that failed.
     d. `success_rate`: percentage `(successful / total_processed) * 100` (or 0 if none).
     e. `avg_processing_time_ms`: average time from pipeline start to completion in milliseconds.
     f. `classification_accuracy`: percentage of garments where the AI-classified type matches the user-specified type (requires both to be stored).
     g. `detection_rate`: percentage of uploads where garments were successfully detected in the image.
     h. `last_24h_count`: number of garments processed in the last 24 hours.
   - Return the analytics object.

2. If pipeline metadata is not yet stored in a dedicated table, query the `garments` table fields (if they contain pipeline data) or return placeholder values with a note.

3. In `AnalyticsController.getAIPrecisionAnalytics()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `GET /analytics/ai-precision` returns HTTP 200 with all metrics.
- `total_processed`, `successful`, `failed` are integer counts.
- `success_rate` is a float between 0 and 100.
- `avg_processing_time_ms` is a float or null if no data.
- `last_24h_count` reflects recent activity.
- No auth returns HTTP 401.

## EDGE CASES

- If no garments have been processed, all values should be 0 or null.
- `success_rate` must handle division by zero gracefully (return 0 if `total_processed = 0`).
- `avg_processing_time_ms` should be null if no processed garments exist.
- The endpoint should be fast to query even with many garments (use aggregated queries).
- Soft-deleted garments should be excluded from metrics.

## TESTS REQUIRED

- Unit test: `AnalyticsService.getAIPrecisionAnalytics()` computes metrics from pipeline data.
- Unit test: No processed garments returns zeros.
- Integration test: `GET /analytics/ai-precision` returns 200.
- Integration test: `GET /analytics/ai-precision` without auth returns 401.

## EXPECTED OUTPUT

- Updated `backend/src/analytics/analytics.controller.ts` with `GET /analytics/ai-precision`.
- Updated `backend/src/analytics/analytics.service.ts` with `getAIPrecisionAnalytics()` method.
- All tests pass.
