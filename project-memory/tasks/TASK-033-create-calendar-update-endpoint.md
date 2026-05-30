# TASK-033

# Create Calendar Event Update Endpoint (PATCH /calendar/:id)

## OBJECTIVE

Implement the `PATCH /calendar/:id` endpoint that allows authenticated users to update a calendar event. Only future events (event_date >= today) can be modified to prevent changing history of past outfits.

## CONTEXT FILES

- `backend/src/calendar/calendar.controller.ts`
- `backend/src/calendar/calendar.service.ts`
- `backend/src/calendar/dto/update-calendar.dto.ts`

## ALLOWED FILES

- `backend/src/calendar/calendar.controller.ts`
- `backend/src/calendar/calendar.service.ts`
- `backend/src/calendar/dto/update-calendar.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `UpdateCalendarDto` with all fields optional:
   - `outfit_id`: string (UUID, optional), `@IsOptional()`, `@IsUUID()`
   - `title`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(200)`
   - `notes`: string (optional), `@IsOptional()`, `@IsString()`, `@MaxLength(2000)`
   - `is_worn`: boolean (optional), `@IsOptional()`, `@IsBoolean()`
   - `event_date`: string (optional, ISO date), `@IsOptional()`, `@IsDateString()`

2. In `CalendarService.update(userId: string, eventId: string, dto: UpdateCalendarDto)`:
   - Find the event by `id = eventId`, `user_id = userId`.
   - If not found, throw `NotFoundException` with `EVENT_NOT_FOUND`.
   - Validate that `event_date` (existing or new) is today or in the future.
   - If the event's date is in the past (before today), throw `BadRequestException` with `CANNOT_MODIFY_PAST_EVENT`.
   - If `outfit_id` is provided, validate the outfit exists and belongs to the user.
   - Update only the provided fields.
   - Return the updated event.

3. In `CalendarController.update()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Param('id') id: string` and `@Body() dto: UpdateCalendarDto`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `PATCH /calendar/:id` for a future event with new title returns HTTP 200.
- `PATCH /calendar/:id` for a today event is allowed.
- `PATCH /calendar/:id` for a past event returns HTTP 400 with `CANNOT_MODIFY_PAST_EVENT`.
- `PATCH /calendar/:id` with a non-existent ID returns HTTP 404.
- `PATCH /calendar/:id` for another user's event returns HTTP 404.
- `PATCH /calendar/:id` without auth returns HTTP 401.

## EDGE CASES

- "Future" means `event_date >= current date` (today at 00:00:00 UTC).
- If the update changes `event_date` to a past date, reject with `CANNOT_MODIFY_PAST_EVENT`.
- If the event was originally a future event but becomes past during the update, reject.
- `outfit_id` can be set to `null` to remove the outfit association (use a special value or omit the field).
- Changing `is_worn` from `false` to `true` should increment the garment's `usage_count` (bonus requirement: call GarmentsService to update usage count).

## TESTS REQUIRED

- Unit test: `CalendarService.update()` updates future events.
- Unit test: `CalendarService.update()` rejects past event modification.
- Unit test: `UpdateCalendarDto` validates optional fields.
- Integration test: `PATCH /calendar/:id` for future event returns 200.
- Integration test: `PATCH /calendar/:id` for past event returns 400.

## EXPECTED OUTPUT

- `backend/src/calendar/dto/update-calendar.dto.ts`
- Updated `backend/src/calendar/calendar.service.ts` with `update()` method.
- Updated `backend/src/calendar/calendar.controller.ts` with `PATCH /calendar/:id`.
- All tests pass.
