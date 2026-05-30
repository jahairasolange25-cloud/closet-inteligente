# TASK-031

# Create Calendar Events Table

## OBJECTIVE

Create the `calendar_events` table in PostgreSQL that stores outfit scheduling events. Events are kept for a rolling window of the last 30 days to maintain relevance and control data size.

## CONTEXT FILES

- `backend/src/database/migrations/`
- `backend/src/database/migrations/20260525_000001_create_users_table.sql`
- `backend/src/database/migrations/20260525_000020_create_outfits_table.sql`
- `backend/prisma/schema.prisma`

## ALLOWED FILES

- `backend/src/database/migrations/*.sql` (new migration file)
- `backend/prisma/schema.prisma`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any TypeScript source files except Prisma schema

## REQUIREMENTS

1. Create a migration file `20260525_000031_create_calendar_events_table.sql`.

2. The `calendar_events` table must have these columns:
   - `id` UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`
   - `user_id` UUID, NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE
   - `outfit_id` UUID, nullable, REFERENCES `outfits(id)` ON DELETE SET NULL
   - `event_date` DATE, NOT NULL
   - `title` VARCHAR(200), nullable
   - `notes` TEXT, nullable
   - `is_worn` BOOLEAN, NOT NULL, DEFAULT `false`
   - `created_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`
   - `updated_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`

3. Create indexes:
   - `idx_calendar_events_user_date` on `(user_id, event_date)` — for date range queries
   - `idx_calendar_events_user_date_range` on `user_id` including `event_date` for covering index
   - `idx_calendar_events_created_at` on `created_at`

4. Create a UNIQUE constraint:
   - `uq_calendar_user_date_outfit` UNIQUE on `(user_id, event_date, outfit_id)` — prevent duplicate events for same outfit on same day

5. Attach the `update_updated_at_column()` trigger as `trg_calendar_events_updated_at`.

6. Enable RLS with policies:
   - `calendar_select_own`: SELECT WHERE `user_id = current_user_id()`
   - `calendar_insert_own`: INSERT WITH CHECK `user_id = current_user_id()`
   - `calendar_update_own`: UPDATE WHERE `user_id = current_user_id()`
   - `calendar_delete_own`: DELETE WHERE `user_id = current_user_id()`

7. Create a cleanup mechanism (trigger or application-level job) that removes events older than 30 days from the current date. Document this as an application-level cron job.

## ACCEPTANCE CRITERIA

- `\d calendar_events` shows all columns with correct types and foreign keys.
- The UNIQUE constraint prevents duplicate outfit events on the same day.
- `event_date` stores only the date (no time component) — use DATE type.
- `outfit_id` is nullable and uses `ON DELETE SET NULL` (deleting an outfit does not delete the calendar event).
- RLS policies restrict access to the owning user.
- Events older than 30 days can be manually cleaned up via the documented cleanup query.

## EDGE CASES

- `event_date` must be a DATE type (not TIMESTAMP), as events are scheduled per day, not per time.
- `outfit_id` is optional (an event can be created without selecting a specific outfit).
- `ON DELETE SET NULL` ensures that if an outfit is deleted, the calendar event remains but loses the outfit reference.
- The UNIQUE constraint on `(user_id, event_date, outfit_id)` allows multiple events on the same day with different outfits, but prevents creating the same event twice.
- Past dates (more than 30 days ago) should still be accepted by the database; cleanup is handled periodically.

## TESTS REQUIRED

- Integration test: Apply migration and insert a calendar event.
- Integration test: Verify UNIQUE constraint.
- Integration test: Verify `ON DELETE SET NULL` behavior.
- Integration test: Verify RLS policies.
- Integration test: Insert event with date 30+ days in the past.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000031_create_calendar_events_table.sql`
- Updated `backend/prisma/schema.prisma` with CalendarEvent model.
- Migration applied successfully.
