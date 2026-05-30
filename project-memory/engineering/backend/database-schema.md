# Database Schema

## Overview

- **Database:** PostgreSQL 16
- **Hosting:** Supabase
- **Extensions:** `uuid-ossp`, `pgcrypto`, `pg_trgm`, `btree_gin`
- **Naming:** `snake_case`, plural table names, singular column names

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

---

## Enums

```sql
CREATE TYPE garment_category AS ENUM (
  'tops', 't-shirts', 'shirts', 'blouses', 'sweaters',
  'jackets', 'coats', 'hoodies', 'vests',
  'bottoms', 'pants', 'jeans', 'shorts', 'skirts',
  'dresses', 'jumpsuits',
  'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats',
  'accessories', 'bags', 'hats', 'belts', 'scarves', 'jewelry', 'glasses',
  'outerwear'
);

CREATE TYPE garment_state AS ENUM (
  'available', 'washing', 'donated', 'discarded'
);

CREATE TYPE processing_status AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);

CREATE TYPE avatar_style AS ENUM (
  'realistic', 'stylized', 'cartoon'
);

CREATE TYPE body_shape AS ENUM (
  'ectomorph', 'mesomorph', 'endomorph', 'unknown'
);

CREATE TYPE season AS ENUM (
  'spring', 'summer', 'fall', 'winter'
);

CREATE TYPE recurring_pattern AS ENUM (
  'daily', 'weekly', 'monthly', 'weekdays', 'weekends'
);

CREATE TYPE notification_type AS ENUM (
  'garment_processed', 'garment_failed',
  'outfit_recommended',
  'avatar_generated', 'avatar_failed',
  'calendar_reminder',
  'sync_conflict',
  'export_complete',
  'welcome', 'tip', 'system'
);

CREATE TYPE export_format AS ENUM (
  'json', 'csv'
);

CREATE TYPE export_status AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);

CREATE TYPE export_section AS ENUM (
  'garments', 'outfits', 'avatars', 'calendar', 'analytics', 'settings'
);

CREATE TYPE consent_type AS ENUM (
  'terms', 'privacy', 'ai_training', 'data_processing', 'marketing', 'third_party_sharing'
);

CREATE TYPE storage_resource_type AS ENUM (
  'image', 'video', 'model', 'document'
);

CREATE TYPE sync_action AS ENUM (
  'create', 'update', 'delete'
);

CREATE TYPE sync_entity AS ENUM (
  'garment', 'outfit', 'avatar', 'calendar_entry'
);

CREATE TYPE sync_status AS ENUM (
  'pending', 'synced', 'conflict', 'resolved'
);
```

---

## Tables

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  language VARCHAR(5) NOT NULL DEFAULT 'es',
  theme VARCHAR(10) NOT NULL DEFAULT 'system',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### user_preferences

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  temperature_unit VARCHAR(3) NOT NULL DEFAULT 'C',
  distance_unit VARCHAR(5) NOT NULL DEFAULT 'cm',
  currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
  week_start_day INTEGER NOT NULL DEFAULT 1, -- 0=Sun, 1=Mon
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City',
  daily_reminder_time TIME DEFAULT '08:00',
  weekly_report_day INTEGER DEFAULT 0, -- 0=Sun
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### garments

```sql
CREATE TABLE garments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category garment_category NOT NULL,
  subcategory VARCHAR(100),
  color VARCHAR(7), -- hex color
  brand VARCHAR(100),
  size VARCHAR(20),
  material TEXT[] DEFAULT '{}',
  notes TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  state garment_state NOT NULL DEFAULT 'available',
  image_url TEXT,
  thumbnail_url TEXT,
  processing_status processing_status NOT NULL DEFAULT 'pending',
  processing_progress INTEGER DEFAULT 0,
  processing_error TEXT,
  detected_dominant_colors TEXT[] DEFAULT '{}',
  detected_patterns TEXT[] DEFAULT '{}',
  detected_category VARCHAR(100),
  detection_confidence REAL,
  embedding FLOAT[],
  embedding_version INTEGER,
  last_worn_at TIMESTAMPTZ,
  wear_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_garments_user_id ON garments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_garments_category ON garments(user_id, category);
CREATE INDEX idx_garments_state ON garments(user_id, state);
CREATE INDEX idx_garments_color ON garments(user_id, color);
CREATE INDEX idx_garments_is_favorite ON garments(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_garments_search ON garments USING GIN (to_tsvector('spanish', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(notes, '')));
CREATE INDEX idx_garments_name_trgm ON garments USING GIN (name gin_trgm_ops);
CREATE INDEX idx_garments_created_at ON garments(user_id, created_at DESC);
CREATE INDEX idx_garments_embedding ON garments USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_garments_deleted_at ON garments(deleted_at);
```

### garment_images

```sql
CREATE TABLE garment_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garment_id UUID NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  compressed_url TEXT,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER, -- bytes
  mime_type VARCHAR(50) NOT NULL,
  storage_provider VARCHAR(20) NOT NULL DEFAULT 'cloudinary',
  storage_key TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  processing_status processing_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_garment_images_garment_id ON garment_images(garment_id);
CREATE INDEX idx_garment_images_user_id ON garment_images(user_id);
CREATE INDEX idx_garment_images_is_primary ON garment_images(garment_id, is_primary);
```

### outfits

```sql
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  occasion VARCHAR(100),
  season season,
  notes TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  preview_url TEXT,
  generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
  ai_score REAL, -- recommendation score if AI-generated
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outfits_user_id ON outfits(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_outfits_occasion ON outfits(user_id, occasion);
CREATE INDEX idx_outfits_season ON outfits(user_id, season);
CREATE INDEX idx_outfits_is_favorite ON outfits(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_outfits_created_at ON outfits(user_id, created_at DESC);
CREATE INDEX idx_outfits_deleted_at ON outfits(deleted_at);
```

### outfit_garments

```sql
CREATE TABLE outfit_garments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  garment_id UUID NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- ordering within outfit
  slot VARCHAR(20) NOT NULL, -- 'upper', 'lower', 'footwear', 'accessory'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(outfit_id, garment_id)
);

CREATE INDEX idx_outfit_garments_outfit_id ON outfit_garments(outfit_id);
CREATE INDEX idx_outfit_garments_garment_id ON outfit_garments(garment_id);
```

### avatars

```sql
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT, -- Ready Player Me URL
  model_url TEXT, -- GLTF/GLB URL
  thumbnail_url TEXT,
  body_height REAL, -- cm
  body_weight REAL, -- kg
  skin_tone VARCHAR(7), -- hex
  body_shape body_shape DEFAULT 'unknown',
  measurement_chest REAL,
  measurement_waist REAL,
  measurement_hips REAL,
  measurement_inseam REAL,
  gender VARCHAR(10),
  style avatar_style NOT NULL DEFAULT 'realistic',
  version INTEGER NOT NULL DEFAULT 1,
  processing_status processing_status NOT NULL DEFAULT 'pending',
  processing_error TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avatars_user_id ON avatars(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_avatars_is_active ON avatars(user_id, is_active);
CREATE INDEX idx_avatars_deleted_at ON avatars(deleted_at);

-- Max 3 avatars per user
CREATE OR REPLACE FUNCTION check_avatar_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM avatars WHERE user_id = NEW.user_id AND deleted_at IS NULL) >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 avatars per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_avatar_limit
  BEFORE INSERT ON avatars
  FOR EACH ROW
  EXECUTE FUNCTION check_avatar_limit();
```

### avatar_versions

```sql
CREATE TABLE avatar_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  model_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER, -- bytes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(avatar_id, version)
);

CREATE INDEX idx_avatar_versions_avatar_id ON avatar_versions(avatar_id);
```

### calendar_entries

```sql
CREATE TABLE calendar_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_pattern recurring_pattern,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_calendar_entries_user_id ON calendar_entries(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_calendar_entries_date ON calendar_entries(user_id, date);
CREATE INDEX idx_calendar_entries_outfit_id ON calendar_entries(outfit_id);
CREATE INDEX idx_calendar_entries_date_range ON calendar_entries(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_calendar_entries_deleted_at ON calendar_entries(deleted_at);
```

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Auto-delete notifications older than 90 days
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

### notification_settings

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_garment_processed BOOLEAN NOT NULL DEFAULT TRUE,
  push_outfit_recommended BOOLEAN NOT NULL DEFAULT TRUE,
  push_avatar_generated BOOLEAN NOT NULL DEFAULT TRUE,
  push_calendar_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  push_tips BOOLEAN NOT NULL DEFAULT FALSE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_weekly_report BOOLEAN NOT NULL DEFAULT FALSE,
  email_garment_processed BOOLEAN NOT NULL DEFAULT TRUE,
  email_avatar_generated BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_garment_processed BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_outfit_recommended BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_avatar_generated BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_calendar_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_tips BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
```

### analytics_events

```typescript
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_name VARCHAR(100) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(100),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name, created_at);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Partition by month for performance
CREATE TABLE analytics_events_y2026m01 PARTITION OF analytics_events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE analytics_events_y2026m02 PARTITION OF analytics_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... additional partitions created by cron
```

### garment_analytics

```sql
CREATE TABLE garment_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  garment_id UUID NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  worn_count INTEGER NOT NULL DEFAULT 0,
  outfit_count INTEGER NOT NULL DEFAULT 0,
  viewed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, garment_id, date)
);

CREATE INDEX idx_garment_analytics_user_date ON garment_analytics(user_id, date);
CREATE INDEX idx_garment_analytics_garment ON garment_analytics(garment_id);
```

### exports

```sql
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format export_format NOT NULL DEFAULT 'json',
  sections export_section[] NOT NULL DEFAULT '{garments,outfits,settings}',
  date_from DATE,
  date_to DATE,
  status export_status NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  file_url TEXT,
  file_size INTEGER,
  error_message TEXT,
  expires_at TIMESTAMPTZ, -- download URL expiry
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_status ON exports(status);
```

### consents

```sql
CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type consent_type NOT NULL,
  accepted BOOLEAN NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type)
);

CREATE INDEX idx_consents_user_id ON consents(user_id);
```

### storage_files

```sql
CREATE TABLE storage_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type storage_resource_type NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration REAL, -- seconds for video
  storage_provider VARCHAR(20) NOT NULL DEFAULT 'cloudinary',
  storage_key TEXT NOT NULL,
  public_url TEXT,
  folder TEXT NOT NULL,
  checksum_sha256 VARCHAR(64),
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_storage_files_user_id ON storage_files(user_id);
CREATE INDEX idx_storage_files_resource_type ON storage_files(user_id, resource_type);
CREATE INDEX idx_storage_files_folder ON storage_files(folder);
CREATE INDEX idx_storage_files_checksum ON storage_files(checksum_sha256);
CREATE INDEX idx_storage_files_deleted ON storage_files(is_deleted) WHERE is_deleted = FALSE;
```

### sync_log

```sql
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type sync_entity NOT NULL,
  entity_id UUID NOT NULL,
  action sync_action NOT NULL,
  payload JSONB NOT NULL,
  checksum VARCHAR(64),
  status sync_status NOT NULL DEFAULT 'pending',
  conflict_data JSONB,
  resolved_at TIMESTAMPTZ,
  client_version VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_log_user_id ON sync_log(user_id, created_at DESC);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_entity ON sync_log(entity_type, entity_id);
```

### fcm_tokens

```sql
CREATE TABLE fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL, -- 'web', 'android', 'ios'
  device_name VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(user_id) WHERE is_active = TRUE;
```

### ai_model_metrics

```sql
CREATE TABLE ai_model_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value REAL NOT NULL,
  num_samples INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_model_metrics_name ON ai_model_metrics(model_name, model_version);
CREATE INDEX idx_ai_model_metrics_created ON ai_model_metrics(created_at DESC);
```

### audit_log

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Auto-archive audit logs older than 1 year
CREATE OR REPLACE FUNCTION archive_audit_logs()
RETURNS void AS $$
BEGIN
  -- Move to archive table (not shown)
  DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;
```

---

## Row Level Security (Supabase)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garments ENABLE ROW LEVEL SECURITY;
ALTER TABLE garment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_garments ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Users: only own record
CREATE POLICY users_owner ON users
  FOR ALL USING (id = auth.uid());

-- Garments: owner only
CREATE POLICY garments_owner ON garments
  FOR ALL USING (user_id = auth.uid());

-- Garment images: owner only via join
CREATE POLICY garment_images_owner ON garment_images
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Outfits: owner only
CREATE POLICY outfits_owner ON outfits
  FOR ALL USING (user_id = auth.uid());

-- Outfit garments: owner via join
CREATE POLICY outfit_garments_owner ON outfit_garments
  FOR ALL USING (
    outfit_id IN (SELECT id FROM outfits WHERE user_id = auth.uid())
  );

-- Avatars: owner only
CREATE POLICY avatars_owner ON avatars
  FOR ALL USING (user_id = auth.uid());

-- Avatar versions: owner via join
CREATE POLICY avatar_versions_owner ON avatar_versions
  FOR ALL USING (
    avatar_id IN (SELECT id FROM avatars WHERE user_id = auth.uid())
  );

-- Calendar: owner only
CREATE POLICY calendar_entries_owner ON calendar_entries
  FOR ALL USING (user_id = auth.uid());

-- Notifications: owner only
CREATE POLICY notifications_owner ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Notification settings: owner only
CREATE POLICY notification_settings_owner ON notification_settings
  FOR ALL USING (user_id = auth.uid());

-- Analytics: owner only
CREATE POLICY analytics_events_owner ON analytics_events
  FOR ALL USING (user_id = auth.uid());

-- Exports: owner only
CREATE POLICY exports_owner ON exports
  FOR ALL USING (user_id = auth.uid());

-- Consents: owner only
CREATE POLICY consents_owner ON consents
  FOR ALL USING (user_id = auth.uid());

-- Storage files: owner only
CREATE POLICY storage_files_owner ON storage_files
  FOR ALL USING (user_id = auth.uid());

-- Sync log: owner only
CREATE POLICY sync_log_owner ON sync_log
  FOR ALL USING (user_id = auth.uid());
```

---

## Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_garments_updated_at
  BEFORE UPDATE ON garments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_outfits_updated_at
  BEFORE UPDATE ON outfits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_avatars_updated_at
  BEFORE UPDATE ON avatars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_calendar_entries_updated_at
  BEFORE UPDATE ON calendar_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Soft Delete Function

```sql
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that support soft delete
CREATE TRIGGER trg_garments_soft_delete
  BEFORE DELETE ON garments
  FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER trg_outfits_soft_delete
  BEFORE DELETE ON outfits
  FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER trg_avatars_soft_delete
  BEFORE DELETE ON avatars
  FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER trg_calendar_entries_soft_delete
  BEFORE DELETE ON calendar_entries
  FOR EACH ROW EXECUTE FUNCTION soft_delete();
```

---

## Hard Cleanup Job (run via pg_cron)

```sql
-- Permanently delete records soft-deleted > 30 days ago
CREATE OR REPLACE FUNCTION permanent_cleanup()
RETURNS void AS $$
BEGIN
  DELETE FROM garments WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
  DELETE FROM outfits WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
  DELETE FROM avatars WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
  DELETE FROM calendar_entries WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
  PERFORM cleanup_old_notifications();
  PERFORM archive_audit_logs();
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (Supabase)
-- SELECT cron.schedule('cleanup-job', '0 3 * * 0', 'SELECT permanent_cleanup();');
```

---

## Migration Strategy

### Directory Structure
```
database/
  migrations/
    001_initial_schema.sql
    002_add_garment_embedding.sql
    003_add_sync_log.sql
    004_add_analytics_events.sql
    ...
  seeds/
    default_categories.sql
  functions/
    update_updated_at_column.sql
    soft_delete.sql
    permanent_cleanup.sql
  triggers/
    check_avatar_limit.sql
```

### Migration Process
1. **Development**: Local PostgreSQL with migrations applied via NestJS `TypeORM` or custom script
2. **Staging**: Supabase project with `supabase db push`
3. **Production**: Supabase with zero-downtime migrations using `supabase db push --linked`

### Migration Rules
- Each migration is atomic (wrapped in transaction)
- Never modify existing migrations after merge to main
- Always add `-- +goose Up` / `-- +goose Down` annotations if using goose
- Backfill data in separate migration steps
- Test rollback before production deployment

### Initial Migration Sequence
1. Create extensions
2. Create all enums
3. Create tables (no FKs initially)
4. Add FKs
5. Create indexes
6. Create triggers and functions
7. Enable RLS and create policies
8. Seed default data
9. Create pg_cron jobs
