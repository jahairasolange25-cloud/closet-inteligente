# TASK-036

# Create Notification List Endpoint (GET /notifications)

## OBJECTIVE

Implement the `GET /notifications` endpoint that returns the authenticated user's notifications with pagination, filtering by type and read status, and sorting by creation date.

## CONTEXT FILES

- `backend/src/notifications/notifications.controller.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/notifications/notifications.module.ts`
- `backend/src/notifications/dto/query-notifications.dto.ts`

## ALLOWED FILES

- `backend/src/notifications/notifications.controller.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/notifications/notifications.module.ts`
- `backend/src/notifications/dto/query-notifications.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `QueryNotificationsDto`:
   - Inherits `page`, `limit` from `PaginationDto`.
   - `type`: string (optional), `@IsOptional()`, `@IsIn(['pipeline_complete', 'pipeline_failed', 'outfit_recommended', 'daily_reminder', 'laundry_reminder', 'system'])`
   - `is_read`: boolean (optional), `@IsOptional()`, `@IsBoolean()`, `@Transform(...)`

2. In `NotificationsService.findAll(userId: string, query: QueryNotificationsDto)`:
   - Query notifications with `user_id = userId`.
   - Filter by `type` if provided.
   - Filter by `is_read` if provided.
   - Order by `created_at DESC`.
   - Apply pagination.
   - Return `{ data: Notification[], meta: { total, page, limit, totalPages, unread_count } }`.

3. Include `unread_count` in the meta object (total unread notifications for the user).

4. In `NotificationsController.findAll()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Query() query: QueryNotificationsDto`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `GET /notifications` returns HTTP 200 with `{ data: [...], meta: { total, page, limit, totalPages, unread_count } }`.
- `GET /notifications?type=pipeline_complete` returns only pipeline completion notifications.
- `GET /notifications?is_read=false` returns only unread notifications.
- `GET /notifications` includes `unread_count` in metadata.
- `GET /notifications` returns notifications ordered by most recent first.
- `GET /notifications` without auth returns HTTP 401.
- Empty notifications return `{ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0, unread_count: 0 } }`.

## EDGE CASES

- The `unread_count` must reflect total unread across ALL notifications, not just the current page.
- Pagination applies only to the filtered subset.
- Notifications older than 90 days should be excluded (if cleanup job runs).
- The response should not expose `user_id` in individual notification objects.

## TESTS REQUIRED

- Unit test: `NotificationsService.findAll()` queries with filters.
- Integration test: `GET /notifications` returns paginated results.
- Integration test: `GET /notifications?is_read=false` returns only unread.
- Integration test: `GET /notifications` includes unread_count in meta.

## EXPECTED OUTPUT

- `backend/src/notifications/dto/query-notifications.dto.ts`
- `backend/src/notifications/notifications.service.ts` with `findAll()` method.
- `backend/src/notifications/notifications.controller.ts` with `GET /notifications`.
- All tests pass.
