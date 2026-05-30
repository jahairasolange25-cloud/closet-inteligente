# TASK-035

# Create Notification Preferences Table

## OBJECTIVE

Create the `notification_preferences` table in PostgreSQL that stores per-user notification settings. Users can opt in or out of specific notification types and choose their preferred delivery channels.

## CONTEXT FILES

- `backend/src/database/migrations/`
- `backend/src/database/migrations/20260525_000001_create_users_table.sql`
- `backend/prisma/schema.prisma`

## ALLOWED FILES

- `backend/src/database/migrations/*.sql` (new migration file)
- `backend/prisma/schema.prisma`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any TypeScript source files except Prisma schema

## REQUIREMENTS

1. Create a migration file `20260525_000035_create_notification_preferences_table.sql`.

2. The `notification_preferences` table must have these columns:
   - `id` UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`
   - `user_id` UUID, NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE, UNIQUE
   - `push_enabled` BOOLEAN, NOT NULL, DEFAULT `true`
   - `email_enabled` BOOLEAN, NOT NULL, DEFAULT `false`
   - `in_app_enabled` BOOLEAN, NOT NULL, DEFAULT `true`
   - `pipeline_complete` BOOLEAN, NOT NULL, DEFAULT `true`
   - `pipeline_failed` BOOLEAN, NOT NULL, DEFAULT `true`
   - `outfit_recommended` BOOLEAN, NOT NULL, DEFAULT `true`
   - `daily_reminder` BOOLEAN, NOT NULL, DEFAULT `false`
   - `laundry_reminder` BOOLEAN, NOT NULL, DEFAULT `false`
   - `system` BOOLEAN, NOT NULL, DEFAULT `true`
   - `quiet_hours_start` TIME WITHOUT TIME ZONE, nullable
   - `quiet_hours_end` TIME WITHOUT TIME ZONE, nullable
   - `created_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`
   - `updated_at` TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT `NOW()`

3. Create indexes:
   - `idx_notification_preferences_user_id` UNIQUE on `user_id`

4. Attach the `update_updated_at_column()` trigger as `trg_notification_preferences_updated_at`.

5. Enable RLS with policies:
   - `preferences_select_own`: SELECT WHERE `user_id = current_user_id()`
   - `preferences_insert_own`: INSERT WITH CHECK `user_id = current_user_id()`
   - `preferences_update_own`: UPDATE WHERE `user_id = current_user_id()`

## ACCEPTANCE CRITERIA

- `\d notification_preferences` shows all columns with correct types.
- The UNIQUE constraint on `user_id` ensures one preferences row per user.
- All boolean columns have proper defaults.
- `quiet_hours_start` and `quiet_hours_end` are nullable TIME columns.
- The trigger updates `updated_at` on modification.
- RLS policies enforce user isolation.

## EDGE CASES

- Preferences are created automatically with defaults when a user registers (application-level logic).
- If `quiet_hours_start` is set but `quiet_hours_end` is null, quiet hours are disabled.
- The `user_id` UNIQUE constraint prevents multiple preference rows for the same user.
- All notification type booleans default to `true` except `daily_reminder` and `laundry_reminder` (opt-in).
- Channel booleans (`push_enabled`, `email_enabled`, `in_app_enabled`) control delivery method independently of type toggles.

## TESTS REQUIRED

- Integration test: Apply migration and insert preferences.
- Integration test: Verify UNIQUE constraint on `user_id`.
- Integration test: Verify default values.
- Integration test: Verify RLS policies.

## EXPECTED OUTPUT

- `backend/src/database/migrations/20260525_000035_create_notification_preferences_table.sql`
- Updated `backend/prisma/schema.prisma` with NotificationPreference model.
- Migration applied successfully.
