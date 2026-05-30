# TASK-038

# Create Notification Settings Endpoints (GET and PATCH /notifications/settings)

## OBJECTIVE

Implement `GET /notifications/settings` and `PATCH /notifications/settings` endpoints that allow authenticated users to view and update their notification preferences.

## CONTEXT FILES

- `backend/src/notifications/notifications.controller.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/notifications/dto/update-notification-settings.dto.ts`

## ALLOWED FILES

- `backend/src/notifications/notifications.controller.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/notifications/dto/update-notification-settings.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `UpdateNotificationSettingsDto` with all fields optional:
   - `push_enabled`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `email_enabled`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `in_app_enabled`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `pipeline_complete`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `pipeline_failed`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `outfit_recommended`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `daily_reminder`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `laundry_reminder`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `system`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `quiet_hours_start`: string (optional, HH:mm format), `@IsOptional()`, `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)`
   - `quiet_hours_end`: string (optional, HH:mm format), `@IsOptional()`, `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)`

2. In `NotificationsService.getSettings(userId: string)`:
   - Find the user's notification preferences.
   - If not found, create default preferences for the user and return them.
   - Return the preferences object.

3. In `NotificationsService.updateSettings(userId: string, dto: UpdateNotificationSettingsDto)`:
   - Find the user's preferences (create defaults if not found).
   - Update only the provided fields.
   - Return the updated preferences.

4. In `NotificationsController`:
   - `GET /notifications/settings`: Use `@UseGuards(JwtAuthGuard)`, return settings.
   - `PATCH /notifications/settings`: Use `@UseGuards(JwtAuthGuard)`, update settings.

## ACCEPTANCE CRITERIA

- `GET /notifications/settings` returns HTTP 200 with all preference fields.
- `PATCH /notifications/settings` with `{ push_enabled: false }` updates only that field.
- `PATCH /notifications/settings` with valid `quiet_hours_start` and `quiet_hours_end` updates both.
- `PATCH /notifications/settings` with invalid time format returns HTTP 400.
- `PATCH /notifications/settings` with empty body returns current settings.
- Both endpoints without auth return HTTP 401.
- If user has no preferences row, `GET /notifications/settings` auto-creates defaults.

## EDGE CASES

- If no preferences row exists, it should be created with defaults automatically on first GET.
- `quiet_hours_start` and `quiet_hours_end` must both be provided or both null; if only one is provided, return HTTP 400 with `QUIET_HOURS_INCOMPLETE`.
- Time format must be HH:mm in 24-hour format.
- Quiet hours crossing midnight (e.g., 22:00 to 06:00) must be handled correctly.

## TESTS REQUIRED

- Unit test: `NotificationsService.getSettings()` auto-creates defaults.
- Unit test: `NotificationsService.updateSettings()` updates only provided fields.
- Unit test: `UpdateNotificationSettingsDto` validates time format.
- Integration test: `GET /notifications/settings` returns 200.
- Integration test: `PATCH /notifications/settings` updates settings.

## EXPECTED OUTPUT

- `backend/src/notifications/dto/update-notification-settings.dto.ts`
- Updated `backend/src/notifications/notifications.service.ts` with settings methods.
- Updated `backend/src/notifications/notifications.controller.ts` with settings endpoints.
- All tests pass.
