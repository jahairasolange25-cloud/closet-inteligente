# TASK-037

# Create Notification Mark as Read Endpoint (PATCH /notifications/:id/read)

## OBJECTIVE

Implement the `PATCH /notifications/:id/read` endpoint that marks a single notification as read. Also implement `PATCH /notifications/read-all` to mark all unread notifications as read for the authenticated user.

## CONTEXT FILES

- `backend/src/notifications/notifications.controller.ts`
- `backend/src/notifications/notifications.service.ts`

## ALLOWED FILES

- `backend/src/notifications/notifications.controller.ts`
- `backend/src/notifications/notifications.service.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files
- Any DTO files

## REQUIREMENTS

1. In `NotificationsService.markAsRead(userId: string, notificationId: string)`:
   - Find notification by `id = notificationId` and `user_id = userId`.
   - If not found, throw `NotFoundException` with `NOTIFICATION_NOT_FOUND`.
   - If already read, return the notification as-is (idempotent).
   - Set `is_read = true` and `read_at = NOW()`.
   - Return the updated notification.

2. In `NotificationsService.markAllAsRead(userId: string)`:
   - Update all notifications with `user_id = userId` and `is_read = false`.
   - Set `is_read = true` and `read_at = NOW()`.
   - Return `{ success: true, affected_count: number }`.

3. In `NotificationsController`:
   - `PATCH /notifications/:id/read`: Mark single notification as read.
   - `PATCH /notifications/read-all`: Mark all as read.
   - Both use `@UseGuards(JwtAuthGuard)`.

## ACCEPTANCE CRITERIA

- `PATCH /notifications/:id/read` marks the notification as read and returns the updated notification.
- `PATCH /notifications/:id/read` on an already-read notification returns the notification unchanged.
- `PATCH /notifications/:id/read` for a non-existent notification returns HTTP 404.
- `PATCH /notifications/:id/read` for another user's notification returns HTTP 404.
- `PATCH /notifications/read-all` marks all unread notifications as read and returns affected count.
- `PATCH /notifications/read-all` when no unread notifications exist returns `{ success: true, affected_count: 0 }`.
- Both endpoints return HTTP 200 on success.

## EDGE CASES

- Marking as read is idempotent — calling it multiple times on the same notification has no additional effect.
- `read_at` must be set to the current timestamp when `is_read` becomes `true`.
- `read_at` must not be modified if the notification was already read.
- The `/read-all` endpoint must be defined BEFORE `/:id/read` in the controller to avoid route conflict (or use a distinct path like `/notifications/read`).

## TESTS REQUIRED

- Unit test: `NotificationsService.markAsRead()` updates is_read and read_at.
- Unit test: `NotificationsService.markAsRead()` throws for non-existent.
- Unit test: `NotificationsService.markAllAsRead()` returns affected count.
- Integration test: `PATCH /notifications/:id/read` returns 200.
- Integration test: `PATCH /notifications/read-all` marks all as read.
- Integration test: `PATCH /notifications/:id/read` for other user returns 404.

## EXPECTED OUTPUT

- Updated `backend/src/notifications/notifications.service.ts` with `markAsRead()` and `markAllAsRead()`.
- Updated `backend/src/notifications/notifications.controller.ts` with both endpoints.
- All tests pass.
