# TASK-032

# Create Calendar List Endpoint (GET /calendar)

## OBJECTIVE

Implement the `GET /calendar` endpoint that returns calendar events for a given date range. The endpoint supports querying by `start_date` and `end_date` (max 31-day range) and returns events grouped by date.

## CONTEXT FILES

- `backend/src/calendar/calendar.controller.ts`
- `backend/src/calendar/calendar.service.ts`
- `backend/src/calendar/calendar.module.ts`
- `backend/src/calendar/dto/query-calendar.dto.ts`

## ALLOWED FILES

- `backend/src/calendar/calendar.controller.ts`
- `backend/src/calendar/calendar.service.ts`
- `backend/src/calendar/calendar.module.ts`
- `backend/src/calendar/dto/query-calendar.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files
- Any files outside `backend/src/calendar/`

## REQUIREMENTS

1. Create `QueryCalendarDto`:
   - `start_date`: string (ISO date), `@IsOptional()`, `@IsDateString()` — defaults to 7 days ago if not provided
   - `end_date`: string (ISO date), `@IsOptional()`, `@IsDateString()` — defaults to today if not provided
   - Validate that `end_date - start_date <= 31` days, otherwise return HTTP 400 with `DATE_RANGE_TOO_LARGE`.

2. In `CalendarService.findAll(userId: string, query: QueryCalendarDto)`:
   - Query events with `user_id = userId` AND `event_date BETWEEN start_date AND end_date`.
   - Order by `event_date ASC`, then by `created_at ASC`.
   - Include the associated outfit (if any) with garment details.
   - Group results by date: `{ [date: string]: CalendarEvent[] }`.
   - Return `{ data: { [date: string]: CalendarEvent[] }, meta: { start_date, end_date, total } }`.

3. In `CalendarController.findAll()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Query() query: QueryCalendarDto`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `GET /calendar` with default params returns events from the last 7 days.
- `GET /calendar?start_date=2026-05-01&end_date=2026-05-31` returns events in that range.
- `GET /calendar` returns events grouped by date.
- `GET /calendar` includes outfit details if `outfit_id` is set.
- `GET /calendar` with range exceeding 31 days returns HTTP 400.
- `GET /calendar` without auth returns HTTP 401.
- Empty date range returns `{ data: {}, meta: { start_date, end_date, total: 0 } }`.

## EDGE CASES

- `start_date` must be before `end_date`; if reversed, swap them or return 400.
- Event dates outside the valid range are excluded; the grouping only includes dates with events.
- If `start_date` or `end_date` is not provided, use sensible defaults (7 days ago to today).
- `end_date` in the future is allowed (for planning).

## TESTS REQUIRED

- Unit test: `CalendarService.findAll()` queries correct date range.
- Unit test: `QueryCalendarDto` validates date range.
- Integration test: `GET /calendar` returns grouped events.
- Integration test: `GET /calendar` with date range returns filtered results.
- Integration test: `GET /calendar` with range > 31 days returns 400.

## EXPECTED OUTPUT

- `backend/src/calendar/dto/query-calendar.dto.ts`
- `backend/src/calendar/calendar.service.ts` with `findAll()` method.
- `backend/src/calendar/calendar.controller.ts` with `GET /calendar`.
- All tests pass.
