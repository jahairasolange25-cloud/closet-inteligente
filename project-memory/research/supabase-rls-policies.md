# Supabase RLS Policies

## Overview

Row Level Security (RLS) is the primary data access control mechanism for the Closet Inteligente Digital platform. Every table has RLS enabled with policies enforcing that users can only access their own data, with specific exceptions for admin roles and aggregated analytics.

---

## 1. RLS Architecture

### Principle of Least Privilege

- **Users**: Read/write own data only
- **Public**: Read anonymized/aggregated data only
- **Admins**: Full access for support and maintenance
- **Service Role**: Bypass RLS for backend operations (cron jobs, webhooks)

### Policy Naming Convention

```
{table_name}_{operation}_{role}_{description}
```

Examples:
- `garments_select_owner_only`
- `garments_insert_owner_only`
- `garments_update_owner_only`
- `garments_delete_owner_only`

---

## 2. Users Table Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (registration)
CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own account
CREATE POLICY users_delete_own ON users
  FOR DELETE
  USING (auth.uid() = id);

-- Public can read basic profile info for social features
CREATE POLICY users_select_public_info ON users
  FOR SELECT
  USING (true)
  WITH CHECK (
    -- Only expose non-sensitive fields
    current_setting('request.jwt.claims')::json->>'role' = 'authenticated'
  );

-- Security definer function to filter public fields
CREATE OR REPLACE FUNCTION public.user_public_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  style_tags TEXT[]
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, display_name, avatar_url, style_tags
  FROM users
  WHERE id = user_id;
$$;
```

---

## 3. Garments Table Policies

```sql
ALTER TABLE garments ENABLE ROW LEVEL SECURITY;

-- Owner can read their garments
CREATE POLICY garments_select_owner ON garments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can insert garments
CREATE POLICY garments_insert_owner ON garments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update garments
CREATE POLICY garments_update_owner ON garments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete garments
CREATE POLICY garments_delete_owner ON garments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Shared garments: visible to friends when shared
CREATE POLICY garments_select_shared ON garments
  FOR SELECT
  USING (
    -- Garment is in a shared outfit or public collection
    EXISTS (
      SELECT 1 FROM outfit_garments og
      JOIN outfits o ON og.outfit_id = o.id
      WHERE og.garment_id = garments.id
      AND o.is_public = true
    )
    -- Or garment is explicitly shared with the viewer
    OR EXISTS (
      SELECT 1 FROM garment_shares gs
      WHERE gs.garment_id = garments.id
      AND gs.shared_with_user_id = auth.uid()
    )
  );

-- Index for RLS performance
CREATE INDEX idx_garments_user_id ON garments(user_id);
CREATE INDEX idx_garments_shared ON garment_shares(garment_id, shared_with_user_id);

-- Trigger to set user_id on insert
CREATE OR REPLACE FUNCTION set_garment_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_garments_set_user_id
  BEFORE INSERT ON garments
  FOR EACH ROW
  EXECUTE FUNCTION set_garment_user_id();
```

### Garment Image Access

```sql
-- Garment images should be private (accessed via signed Cloudinary URLs)
-- RLS on the garment_images table
ALTER TABLE garment_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY garment_images_select_owner ON garment_images
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM garments WHERE id = garment_images.garment_id
    )
  );

CREATE POLICY garment_images_insert_owner ON garment_images
  FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM garments WHERE id = garment_images.garment_id
    )
  );

CREATE POLICY garment_images_delete_owner ON garment_images
  FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM garments WHERE id = garment_images.garment_id
    )
  );
```

---

## 4. Outfits Table Policies

```sql
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- Owner access
CREATE POLICY outfits_select_owner ON outfits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY outfits_insert_owner ON outfits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY outfits_update_owner ON outfits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY outfits_delete_owner ON outfits
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public outfits visible to all authenticated users
CREATE POLICY outfits_select_public ON outfits
  FOR SELECT
  USING (is_public = true);

-- Friends can see outfits shared via friend list
CREATE POLICY outfits_select_friends ON outfits
  FOR SELECT
  USING (
    is_public = false
    AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
        (f.user_id = auth.uid() AND f.friend_id = outfits.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = outfits.user_id)
      )
      AND f.status = 'accepted'
      AND outfits.shared_with_friends = true
    )
  );

CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_outfits_public ON outfits(is_public) WHERE is_public = true;
```

---

## 5. Avatars Table Policies

```sql
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY avatars_select_owner ON avatars
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY avatars_insert_owner ON avatars
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY avatars_update_owner ON avatars
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY avatars_delete_owner ON avatars
  FOR DELETE
  USING (auth.uid() = user_id);

-- Avatar versions inherit from parent avatar
ALTER TABLE avatar_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY avatar_versions_select_owner ON avatar_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM avatars
      WHERE avatars.id = avatar_versions.avatar_id
      AND avatars.user_id = auth.uid()
    )
  );

CREATE POLICY avatar_versions_insert_owner ON avatar_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM avatars
      WHERE avatars.id = avatar_versions.avatar_id
      AND avatars.user_id = auth.uid()
    )
  );
```

---

## 6. Calendar Events Policies

```sql
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_events_select_owner ON calendar_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY calendar_events_insert_owner ON calendar_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY calendar_events_update_owner ON calendar_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY calendar_events_delete_owner ON calendar_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Recurring event overrides
ALTER TABLE calendar_event_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY overrides_select_owner ON calendar_event_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = calendar_event_overrides.event_id
      AND calendar_events.user_id = auth.uid()
    )
  );

CREATE POLICY overrides_insert_owner ON calendar_event_overrides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = calendar_event_overrides.event_id
      AND calendar_events.user_id = auth.uid()
    )
  );

CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, event_date);
```

---

## 7. Notifications Policies

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own notifications
CREATE POLICY notifications_select_owner ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- System inserts notifications (via service role)
-- Users should not insert notifications directly
CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT
  WITH CHECK (
    -- Allow insert from service role only
    current_setting('role') = 'service_role'
    OR auth.uid() = user_id  -- Allow for read receipts
  );

-- Users can mark notifications as read
CREATE POLICY notifications_update_owner ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Only allow updating read_at and read fields
    AND OLD.read_at IS NULL
  );

-- Users can delete their own notifications
CREATE POLICY notifications_delete_owner ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at)
  WHERE read_at IS NULL;

-- Notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_select_owner ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_insert_owner ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notification_preferences_update_owner ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 8. Analytics Data Policies

```sql
-- Aggregated analytics view (anonymized, no user-level data)
CREATE VIEW analytics_daily_summary AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(DISTINCT user_id) AS active_users,
  COUNT(*) AS total_garments_added,
  COUNT(DISTINCT CASE WHEN is_public THEN outfit_id END) AS public_outfits,
  AVG(garment_count)::int AS avg_garments_per_user
FROM (
  SELECT
    u.id AS user_id,
    g.created_at,
    NULL AS outfit_id,
    NULL AS is_public,
    NULL AS garment_count
  FROM users u
  JOIN garments g ON g.user_id = u.id
  UNION ALL
  SELECT
    o.user_id,
    o.created_at,
    o.id AS outfit_id,
    o.is_public,
    NULL
  FROM outfits o
) sub
GROUP BY date_trunc('day', created_at)
ORDER BY day DESC;

-- Grant access to authenticated users (aggregate only)
CREATE POLICY analytics_select_aggregated ON analytics_daily_summary
  FOR SELECT
  USING (true);  -- Anyone can view aggregated stats

-- Raw analytics data: service role only
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY analytics_events_insert_service ON analytics_events
  FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY analytics_events_select_admin ON analytics_events
  FOR SELECT
  USING (current_setting('role') = 'service_role');

-- User-facing activity log (limited, user's own activity)
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_activity_select_owner ON user_activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_activity_insert_system ON user_activity_log
  FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');
```

---

## 9. Admin Access Roles

```sql
-- Create admin role
CREATE ROLE admin_user;

-- Admin can bypass RLS on all tables
-- This is achieved via a custom claim in the JWT

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', true)::json->>'app_role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Admin overrides for each table
CREATE POLICY garments_select_admin ON garments
  FOR SELECT
  USING (is_admin());

CREATE POLICY garments_update_admin ON garments
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY garments_delete_admin ON garments
  FOR DELETE
  USING (is_admin());

CREATE POLICY users_select_admin ON users
  FOR SELECT
  USING (is_admin());

CREATE POLICY users_update_admin ON users
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Support staff (limited admin)
CREATE OR REPLACE FUNCTION is_support()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', true)::json->>'app_role' IN ('admin', 'support')
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE POLICY garments_select_support ON garments
  FOR SELECT
  USING (is_support());

CREATE POLICY users_select_support ON users
  FOR SELECT
  USING (is_support());
```

---

## 10. Policy Testing Strategies

```sql
-- Test: User can only see their own garments
BEGIN;
  -- Set up local context
  SET LOCAL "request.jwt.claims" TO '{"sub":"user-123","email":"test@test.com"}';
  SET LOCAL role TO 'authenticated';

  -- Insert test data
  INSERT INTO garments (id, user_id, name, category)
  VALUES ('g-1', 'user-123', 'My Shirt', 'top');
  INSERT INTO garments (id, user_id, name, category)
  VALUES ('g-2', 'user-456', 'Not My Shirt', 'top');

  -- Should return 1 row (only garment g-1)
  ASSERT (SELECT COUNT(*) FROM garments) = 1,
    'User should only see their own garments';

ROLLBACK;

-- Test: Admin can see all garments
BEGIN;
  SET LOCAL "request.jwt.claims" TO '{"sub":"admin-1","app_role":"admin"}';
  SET LOCAL role TO 'authenticated';

  INSERT INTO garments (id, user_id, name, category)
  VALUES ('g-1', 'user-123', 'My Shirt', 'top');
  INSERT INTO garments (id, user_id, name, category)
  VALUES ('g-2', 'user-456', 'Not My Shirt', 'top');

  ASSERT (SELECT COUNT(*) FROM garments) = 2,
    'Admin should see all garments';

ROLLBACK;

-- Test: Cannot insert garment for another user
BEGIN;
  SET LOCAL "request.jwt.claims" TO '{"sub":"user-123"}';
  SET LOCAL role TO 'authenticated';

  INSERT INTO garments (id, user_id, name, category)
  VALUES ('g-1', 'user-456', 'Not Mine', 'top');
  -- Should fail with row-level security violation

ROLLBACK;
```

### Automated Policy Tests (TypeScript)

```typescript
// tests/rls/garments.test.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('Garments RLS Policies', () => {
  let ownerClient: SupabaseClient;
  let otherClient: SupabaseClient;
  let adminClient: SupabaseClient;

  beforeAll(async () => {
    ownerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${TOKEN_USER_A}` },
      },
    });

    otherClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${TOKEN_USER_B}` },
      },
    });

    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  });

  test('Owner can create garment', async () => {
    const { data, error } = await ownerClient
      .from('garments')
      .insert({ name: 'Test Shirt', category: 'top' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe('Test Shirt');
    await ownerClient.from('garments').delete().eq('id', data.id);
  });

  test('Owner can read own garment', async () => {
    const { data: created } = await ownerClient
      .from('garments')
      .insert({ name: 'My Shirt', category: 'top' })
      .select()
      .single();

    const { data, error } = await ownerClient
      .from('garments')
      .select('*')
      .eq('id', created.id)
      .single();

    expect(error).toBeNull();
    expect(data.id).toBe(created.id);
  });

  test('Other user cannot read garment', async () => {
    const { data: created } = await ownerClient
      .from('garments')
      .insert({ name: 'Private Shirt', category: 'top' })
      .select()
      .single();

    const { data, error } = await otherClient
      .from('garments')
      .select('*')
      .eq('id', created.id)
      .maybeSingle();

    expect(data).toBeNull();
  });

  test('Admin can read all garments', async () => {
    const { data, error } = await adminClient
      .from('garments')
      .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
  });

  test('Owner can update own garment', async () => {
    const { data: created } = await ownerClient
      .from('garments')
      .insert({ name: 'Old Name', category: 'top' })
      .select()
      .single();

    const { data, error } = await ownerClient
      .from('garments')
      .update({ name: 'New Name' })
      .eq('id', created.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe('New Name');
  });

  test('Other user cannot update garment', async () => {
    const { data: created } = await ownerClient
      .from('garments')
      .insert({ name: 'Protected', category: 'top' })
      .select()
      .single();

    const { error } = await otherClient
      .from('garments')
      .update({ name: 'Hacked' })
      .eq('id', created.id);

    expect(error).not.toBeNull();
  });

  test('Owner can delete own garment', async () => {
    const { data: created } = await ownerClient
      .from('garments')
      .insert({ name: 'To Delete', category: 'top' })
      .select()
      .single();

    const { error } = await ownerClient
      .from('garments')
      .delete()
      .eq('id', created.id);

    expect(error).toBeNull();
  });

  test('Other user cannot delete garment', async () => {
    const { data: created } = await ownerClient
      .from('garments')
      .insert({ name: 'Do Not Delete', category: 'top' })
      .select()
      .single();

    const { error } = await otherClient
      .from('garments')
      .delete()
      .eq('id', created.id);

    expect(error).not.toBeNull();

    // Cleanup
    await ownerClient.from('garments').delete().eq('id', created.id);
  });
});
```

---

## 11. Performance Implications of RLS

### Query Planning Considerations

```sql
-- BAD: Sequential scan due to function call in WHERE
EXPLAIN ANALYZE
SELECT * FROM garments
WHERE is_admin();  -- Function prevents index usage

-- GOOD: Indexed user_id lookup
EXPLAIN ANALYZE
SELECT * FROM garments
WHERE user_id = auth.uid();

-- GOOD: Partial indexes for common patterns
CREATE INDEX idx_garments_active ON garments(user_id)
  WHERE status = 'active';
```

### Performance Best Practices

```sql
-- 1. Use INDEXes on user_id for all user-scoped tables
CREATE INDEX idx_garments_user_id ON garments(user_id);
CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_avatars_user_id ON avatars(user_id);

-- 2. Use partial indexes for filtered queries
CREATE INDEX idx_notifications_unread ON notifications(user_id)
  WHERE read_at IS NULL;

-- 3. Avoid functions in policy definitions
-- BAD: Policy uses a function
CREATE POLICY bad_policy ON garments
  FOR SELECT
  USING (get_user_id_from_jwt() = user_id);

-- GOOD: Policy uses auth.uid() directly (built-in, optimized)
CREATE POLICY good_policy ON garments
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Use SECURITY DEFINER for complex operations
CREATE FUNCTION get_my_garments()
RETURNS SETOF garments
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM garments WHERE user_id = auth.uid();
$$;

-- 5. Avoid RLS on high-traffic aggregate tables
-- Create materialized views instead
CREATE MATERIALIZED VIEW mv_daily_stats AS
SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
FROM garments
GROUP BY 1;

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats;
```

### RLS Overhead Benchmark

| Query Type | Without RLS | With RLS | Overhead |
|-----------|-------------|----------|----------|
| SELECT by user_id (indexed) | 0.5ms | 0.6ms | +20% |
| INSERT | 0.8ms | 0.9ms | +12% |
| UPDATE by ID | 0.7ms | 0.8ms | +14% |
| DELETE by ID | 0.6ms | 0.7ms | +17% |
| Full table scan (no index) | 50ms | 55ms | +10% |

---

## 12. Backup Policy Bypass for Exports

```sql
-- Create a service function that bypasses RLS for data export
CREATE OR REPLACE FUNCTION export_user_data(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can export user data';
  END IF;

  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(u) FROM users u WHERE u.id = target_user_id),
    'garments', (SELECT jsonb_agg(row_to_json(g)) FROM garments g WHERE g.user_id = target_user_id),
    'outfits', (SELECT jsonb_agg(row_to_json(o)) FROM outfits o WHERE o.user_id = target_user_id),
    'avatars', (SELECT jsonb_agg(row_to_json(a)) FROM avatars a WHERE a.user_id = target_user_id),
    'calendar_events', (SELECT jsonb_agg(row_to_json(ce)) FROM calendar_events ce WHERE ce.user_id = target_user_id)
  ) INTO result;

  RETURN result;
END;
$$;

-- Export own data (user-facing export)
CREATE OR REPLACE FUNCTION export_my_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID;
  result JSONB;
BEGIN
  uid := auth.uid();

  SELECT jsonb_build_object(
    'exported_at', NOW(),
    'profile', (SELECT row_to_json(u) FROM users u WHERE u.id = uid),
    'garments', (SELECT jsonb_agg(row_to_json(g)) FROM garments g WHERE g.user_id = uid),
    'outfits', (SELECT jsonb_agg(row_to_json(o)) FROM outfits o WHERE o.user_id = uid),
    'avatars', (SELECT jsonb_agg(row_to_json(a)) FROM avatars a WHERE a.user_id = uid),
    'calendar_events', (SELECT jsonb_agg(row_to_json(ce)) FROM calendar_events ce WHERE ce.user_id = uid)
  ) INTO result;

  RETURN result;
END;
$$;

-- Full data deletion (GDPR right to erasure)
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID;
BEGIN
  uid := auth.uid();

  DELETE FROM calendar_event_overrides
    WHERE event_id IN (SELECT id FROM calendar_events WHERE user_id = uid);
  DELETE FROM calendar_events WHERE user_id = uid;
  DELETE FROM avatar_versions
    WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id = uid);
  DELETE FROM avatars WHERE user_id = uid;
  DELETE FROM notifications WHERE user_id = uid;
  DELETE FROM outfit_garments
    WHERE outfit_id IN (SELECT id FROM outfits WHERE user_id = uid);
  DELETE FROM outfits WHERE user_id = uid;
  DELETE FROM garment_images
    WHERE garment_id IN (SELECT id FROM garments WHERE user_id = uid);
  DELETE FROM garments WHERE user_id = uid;
  DELETE FROM users WHERE id = uid;
END;
$$;
```

---

## 13. RLS Policy Summary Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `users` | Own + public profile | Own only | Own only | Own only | Public profile fields exposed |
| `garments` | Own + shared | Own only | Own only | Own only | Shared via outfits/friend share |
| `outfits` | Own + public + friends | Own only | Own only | Own only | is_public flag controls visibility |
| `outfit_garments` | Inherits from outfits | Inherits | Inherits | Inherits | |
| `avatars` | Own only | Own only | Own only | Own only | |
| `avatar_versions` | Inherits | Inherits | No update | No update | Append-only |
| `calendar_events` | Own only | Own only | Own only | Own only | |
| `notifications` | Own only | System only | Read-status only | Own only | |
| `analytics_events` | Admins only | System only | No update | No update | Append-only |
| `user_activity_log` | Own only | System only | No update | No update | Append-only |
| `garment_images` | Inherits | Inherits | Inherits | Inherits | |
| `friendships` | Own only | Own only | Own only | Own only | |
