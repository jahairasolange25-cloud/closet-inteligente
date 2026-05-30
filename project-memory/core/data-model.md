# Closet Inteligente Digital — Data Model

---

## 1. Entity Relationship Diagram (ASCII)

``

---

## 1. Entity Relationship Diagram (ASCII)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│  ┌─────────────┐       ┌──────────────────┐       ┌──────────────────┐      ┌─────────────────────────┐   │
│  │    users     │       │     avatars       │       │   avatar_versions │      │     user_consent        │   │
│  ├─────────────┤       ├──────────────────┤       ├──────────────────┤      ├─────────────────────────┤   │
│  │ id (PK)     │──1:N──│ id (PK)           │       │ id (PK)          │      │ id (PK)                 │   │
│  │ email       │       │ user_id (FK)      │──1:N──│ avatar_id (FK)   │      │ user_id (FK) ───────────┘   │
│  │ password    │       │ name              │       │ model_url        │      │ consent_type              │
│  │ name        │       │ gender            │       │ thumbnail_url    │      │ granted                   │
│  │ ...         │       │ body_data (JSONB) │       │ version          │      │ granted_at                │
│  └─────────────┘       │ status            │       │ is_current       │      │ ip_address                │
│         │              │ created_at        │       │ created_at       │      └──────────────────────────┘
│         │              └──────────────────┘       └──────────────────┘
│         │                     1:1
│         │
│         │              ┌─────────────────────┐
│         │              │  notification_pref   │
│         │              ├─────────────────────┤
│         └──────────────│ user_id (PK,FK)      │
│                        │ push_enabled         │
│         │              │ email_enabled        │
│         │              │ daily_outfit_reminder│
│         │              │ ...                  │
│         │              └─────────────────────┘
│         │
│         │  1:N                 1:N                  1:N
│         │──────────────────────────────────────────────────
│         │         │                        │
│         ▼         ▼                        ▼
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐
│  │   garments   │  │     outfits       │  │ calendar_events   │
│  ├─────────────┤  ├──────────────────┤  ├───────────────────┤
│  │ id (PK)     │  │ id (PK)          │  │ id (PK)           │
│  │ user_id (FK)│  │ user_id (FK)     │  │ user_id (FK)      │
│  │ name        │  │ name             │  │ title             │
│  │ garment_type│  │ outfit_type      │  │ description       │
│  │ brand       │  │ season           │  │ event_date        │
│  │ size        │  │ formality_level  │  │ start_time        │
│  │ color       │  │ weather_tags     │  │ end_time          │
│  │ ...         │  │ is_public        │  │ outfit_id (FK)    │
│  └─────────────┘  │ created_at       │  │ event_type        │
│         │         └────────┬─────────┘  │ location          │
│         │                 │             │ dress_code        │
│         │                 │             │ is_all_day        │
│         │        ┌────────┴────────┐    │ created_at        │
│         │        │                 │    └───────────────────┘
│         │  ┌─────────────┐  ┌──────────────────┐
│         │  │outfit_garments   outfit_versions   │
│         │  ├─────────────┤  ├──────────────────┤
│         │  │ id (PK)     │  │ id (PK)          │
│         └──│ garment_id  │  │ outfit_id (FK)   │
│            │ outfit_id   │  │ garments_snapshot│
│            │ position    │  │ version          │
│            │ layer       │  │ created_at       │
│            └─────────────┘  └──────────────────┘
│
│         │  1:N
│         ▼
│  ┌─────────────────────┐       ┌─────────────────────────┐
│  │   garment_images     │       │   garment_attributes    │
│  ├─────────────────────┤       ├─────────────────────────┤
│  │ id (PK)             │       │ id (PK)                 │
│  │ garment_id (FK)     │──1:N──│ garment_id (FK)         │
│  │ image_url           │       │ attribute_key           │
│  │ thumbnail_url       │       │ attribute_value         │
│  │ is_primary          │       │ source                  │
│  │ width               │       │ confidence              │
│  │ height              │       └─────────────────────────┘
│  │ file_size_bytes     │
│  │ cloudinary_public_id│
│  │ sort_order          │
│  │ created_at          │
│  └─────────────────────┘
│
│         ┌────────────────────────┐
│         │  notifications          │
│         ├────────────────────────┤
│  ┌──────│ id (PK)                │
│  │      │ user_id (FK)           │
│  │      │ type                   │
│  │      │ title                  │
│  │      │ body                   │
│  │      │ data (JSONB)           │
│  │      │ is_read                │
│  │      │ read_at                │
│  │      │ created_at             │
│  │      └────────────────────────┘
│  │
│  │      ┌────────────────────────┐
│  │      │  analytics_events       │
│  │      ├────────────────────────┤
│  │      │ id (PK)                │
│  │      │ user_id (FK)           │
│  │      │ event_name             │
│  │      │ event_data (JSONB)     │
│  │      │ session_id             │
│  │      │ device                 │
│  │      │ ip_address_hash        │
│  │      │ user_agent             │
│  │      │ created_at             │
│  │      └────────────────────────┘
│  │
│  │      ┌────────────────────────┐
│  │      │   audit_logs            │
│  │      ├────────────────────────┤
│  │      │ id (PK)                │
│  │      │ user_id (FK)           │
│  │      │ action                 │
│  │      │ entity_type            │
│  │      │ entity_id              │
│  │      │ old_values (JSONB)     │
│  │      │ new_values (JSONB)     │
│  │      │ ip_address             │
│  │      │ user_agent             │
│  │      │ created_at             │
│  │      └────────────────────────┘
│  │
│  │      ┌────────────────────────┐
│  │      │   sync_logs             │
│  │      ├────────────────────────┤
│  │      │ id (PK)                │
│  │      │ user_id (FK)           │
│  │      │ sync_type              │
│  │      │ status                 │
│  │      │ operations_count       │
│  │      │ conflicts_count        │
│  │      │ started_at             │
│  │      │ completed_at           │
│  │      │ error_message          │
│  │      └────────────────────────┘
│  │
│  │      ┌────────────────────────┐
│  │      │  ai_detection_logs     │
│  │      ├────────────────────────┤
│  │      │ id (PK)                │
│  │      │ garment_id (FK) ───────┤
│  │      │ model_name             │
│  │      │ model_version          │
│  │      │ input_image_url        │
│  │      │ raw_output (JSONB)     │
│  │      │ detected_attributes    │
│  │      │ confidence_scores      │
│  │      │ inference_time_ms      │
│  │      │ status                 │
│  │      │ error_message          │
│  │      │ created_at             │
│  │      └────────────────────────┘
│
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Table Definitions

---

### 2.1 `users`

Core user account table. All authentication and profile information.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `email` | `varchar(255)` | `NOT NULL`, `UNIQUE` | — | User email (used for login) |
| `password_hash` | `varchar(255)` | `NOT NULL` | — | bcrypt hash (cost factor 12) |
| `display_name` | `varchar(100)` | `NOT NULL` | — | Public display name |
| `avatar_url` | `varchar(500)` | — | `NULL` | Profile photo URL |
| `role` | `user_role` | `NOT NULL` | `'user'` | RBAC role (user, moderator, admin, superadmin) |
| `is_verified` | `boolean` | `NOT NULL` | `false` | Email verified flag |
| `is_active` | `boolean` | `NOT NULL` | `true` | Account active (soft disable) |
| `is_onboarded` | `boolean` | `NOT NULL` | `false` | Has completed onboarding |
| `locale` | `varchar(10)` | `NOT NULL` | `'es-CO'` | User locale (language + region) |
| `timezone` | `varchar(50)` | `NOT NULL` | `'America/Bogota'` | IANA timezone |
| `last_login_at` | `timestamptz` | — | `NULL` | Last login timestamp |
| `last_active_at` | `timestamptz` | — | `NULL` | Last activity timestamp |
| `failed_login_attempts` | `integer` | `NOT NULL` | `0` | Consecutive failed logins |
| `locked_until` | `timestamptz` | — | `NULL` | Account lockout expiry |
| `mfa_enabled` | `boolean` | `NOT NULL` | `false` | MFA enabled |
| `mfa_secret` | `varchar(255)` | — | `NULL` | TOTP secret (encrypted) |
| `mfa_backup_codes` | `jsonb` | — | `NULL` | Encrypted backup codes |
| `refresh_token_hash` | `varchar(255)` | — | `NULL` | Current refresh token hash |
| `body_measurements` | `jsonb` | — | `NULL` | Cached body measurements (encrypted) |
| `style_preferences` | `jsonb` | — | `'{}'::jsonb` | Style profile (colors, aesthetics) |
| `feature_flags` | `jsonb` | — | `'{}'::jsonb` | Per-user feature toggles |
| `metadata` | `jsonb` | — | `'{}'::jsonb` | Extensible metadata |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Account creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL` | `now()` | Last update timestamp |
| `deleted_at` | `timestamptz` | — | `NULL` | Soft delete timestamp |

**Indexes:**
- `pk_users` ON `id` (Primary Key)
- `uq_users_email` UNIQUE ON `email`
- `idx_users_is_active` ON `is_active` WHERE `deleted_at IS NULL`
- `idx_users_last_active_at` ON `last_active_at`
- `idx_users_created_at` ON `created_at`

**Check Constraints:**
- `ck_users_email_format` CHECK (`email` ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
- `ck_users_display_name_length` CHECK (char_length(`display_name`) >= 2)

**Triggers:**
- `trg_users_updated_at` — Sets `updated_at = now()` on update

---

### 2.2 `avatars`

3D avatar models generated for users. Each user can have multiple avatars, but only one is active.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | Owner |
| `name` | `varchar(100)` | `NOT NULL` | — | Avatar name (e.g., "Default", "Summer") |
| `gender` | `avatar_gender` | `NOT NULL` | `'neutral'` | Avatar gender presentation |
| `ready_player_me_id` | `varchar(255)` | — | `NULL` | Ready Player Me model ID |
| `model_url` | `varchar(500)` | `NOT NULL` | — | GLB model URL |
| `thumbnail_url` | `varchar(500)` | — | `NULL` | Thumbnail preview |
| `body_measurements` | `jsonb` | `NOT NULL` | — | Snapshot of measurements at generation |
| `body_data` | `jsonb` | `NOT NULL` | — | Full body parameters (encrypted at rest) |
| `hair_color` | `varchar(50)` | — | `NULL` | Hair color hex |
| `skin_tone` | `varchar(50)` | — | `NULL` | Skin tone hex |
| `height_cm` | `numeric(5,1)` | — | `NULL` | Height in centimeters |
| `weight_kg` | `numeric(5,1)` | — | `NULL` | Weight in kilograms |
| `status` | `avatar_status` | `NOT NULL` | `'pending'` | Generation status |
| `is_active` | `boolean` | `NOT NULL` | `false` | Currently active avatar |
| `version` | `integer` | `NOT NULL` | `1` | Avatar version number |
| `file_size_bytes` | `bigint` | — | `NULL` | Compressed GLB size |
| `metadata` | `jsonb` | — | `'{}'::jsonb` | Extensible metadata |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL` | `now()` | Last update |
| `deleted_at` | `timestamptz` | — | `NULL` | Soft delete |

**Indexes:**
- `pk_avatars` ON `id`
- `uq_avatars_user_active` UNIQUE ON `user_id` WHERE `is_active = true`
- `idx_avatars_user_id` ON `user_id`
- `idx_avatars_status` ON `status`

**Foreign Keys:**
- `fk_avatars_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

---

### 2.3 `avatar_versions`

Version history for avatar models, enabling rollback and A/B comparison.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `avatar_id` | `uuid` | `FK → avatars.id`, `NOT NULL` | — | Parent avatar |
| `version` | `integer` | `NOT NULL` | — | Monotonic version number |
| `model_url` | `varchar(500)` | `NOT NULL` | — | GLB URL for this version |
| `thumbnail_url` | `varchar(500)` | — | `NULL` | Version thumbnail |
| `file_size_bytes` | `bigint` | — | `NULL` | File size |
| `change_description` | `varchar(500)` | — | `NULL` | What changed in this version |
| `is_current` | `boolean` | `NOT NULL` | `false` | Currently selected version |
| `body_measurements_snapshot` | `jsonb` | `NOT NULL` | — | Measurements at version creation |
| `metadata` | `jsonb` | — | `'{}'::jsonb` | Extensible metadata |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Version creation timestamp |

**Indexes:**
- `pk_avatar_versions` ON `id`
- `uq_avatar_versions_avatar_version` UNIQUE ON (`avatar_id`, `version`)
- `idx_avatar_versions_avatar_id` ON `avatar_id`

**Foreign Keys:**
- `fk_avatar_versions_avatars` FOREIGN KEY (`avatar_id`) REFERENCES `avatars`(`id`) ON DELETE CASCADE

---

### 2.4 `garments`

The core entity — each garment owned by a user in their digital wardrobe.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | Owner |
| `name` | `varchar(200)` | `NOT NULL` | — | Garment name / label |
| `garment_type` | `garment_type` | `NOT NULL` | — | Category (Top, Bottom, Dress, etc.) |
| `garment_state` | `garment_state` | `NOT NULL` | `'Active'` | Current state (Active, Archived, Donated, etc.) |
| `brand` | `varchar(200)` | — | `NULL` | Brand / designer name |
| `size` | `varchar(50)` | — | `NULL` | Size label (S, M, L, 38, etc.) |
| `color` | `varchar(100)` | — | `NULL` | Primary color name |
| `color_hex` | `varchar(7)` | — | `NULL` | Primary color hex (#RRGGBB) |
| `secondary_color` | `varchar(100)` | — | `NULL` | Secondary color name |
| `secondary_color_hex` | `varchar(7)` | — | `NULL` | Secondary color hex |
| `pattern` | `varchar(100)` | — | `NULL` | Pattern (striped, floral, solid, etc.) |
| `fabric` | `varchar(100)` | — | `NULL` | Fabric type (cotton, polyester, wool, etc.) |
| `season` | `season` | — | `NULL` | Recommended season |
| `formality_level` | `integer` | — | `NULL` | 1 (very casual) to 10 (very formal) |
| `price_amount_cents` | `integer` | — | `NULL` | Purchase price in cents |
| `price_currency` | `varchar(3)` | — | `'COP'` | ISO 4217 currency code |
| `purchase_date` | `date` | — | `NULL` | Date of purchase |
| `purchase_location` | `varchar(200)` | — | `NULL` | Where purchased |
| `notes` | `text` | — | `NULL` | User notes |
| `is_favorite` | `boolean` | `NOT NULL` | `false` | Marked as favorite |
| `wear_count` | `integer` | `NOT NULL` | `0` | Total times worn |
| `last_worn_at` | `timestamptz` | — | `NULL` | Last wear date |
| `cost_per_wear_cents` | `integer` | — | `NULL` | Calculated cost per wear |
| `carbon_footprint_kg` | `numeric(8,2)` | — | `NULL` | Estimated CO2 impact |
| `water_usage_liters` | `numeric(8,2)` | — | `NULL` | Estimated water usage |
| `barcode` | `varchar(100)` | — | `NULL` | Product barcode / SKU |
| `rfid_tag` | `varchar(100)` | — | `NULL` | RFID tag ID |
| `has_3d_model` | `boolean` | `NOT NULL` | `false` | 3D garment model available |
| `3d_model_url` | `varchar(500)` | — | `NULL` | GLB URL for 3D garment |
| `ai_detection_status` | `ai_detection_status` | `NOT NULL` | `'pending'` | AI processing status |
| `ai_confidence` | `numeric(5,4)` | — | `NULL` | AI detection confidence score |
| `metadata` | `jsonb` | — | `'{}'::jsonb` | Extensible metadata |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL` | `now()` | Last update |
| `deleted_at` | `timestamptz` | — | `NULL` | Soft delete |

**Indexes:**
- `pk_garments` ON `id`
- `idx_garments_user_id` ON `user_id`
- `idx_garments_user_id_garment_type` ON (`user_id`, `garment_type`)
- `idx_garments_user_id_created_at` ON (`user_id`, `created_at` DESC)
- `idx_garments_garment_state` ON `garment_state`
- `idx_garments_brand` ON `brand`
- `idx_garments_color` ON `color`
- `idx_garments_season` ON `season`
- `idx_garments_is_favorite` ON `is_favorite` WHERE `is_favorite = true AND deleted_at IS NULL`
- `idx_garments_ai_detection_status` ON `ai_detection_status`
- `idx_garments_barcode` ON `barcode` WHERE `barcode IS NOT NULL`
- `idx_garments_rfid_tag` ON `rfid_tag` WHERE `rfid_tag IS NOT NULL`
- `idx_garments_search_fts` GIN on `to_tsvector('spanish', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(color, ''))`

**Foreign Keys:**
- `fk_garments_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

**Check Constraints:**
- `ck_garments_price_positive` CHECK (`price_amount_cents` IS NULL OR `price_amount_cents` >= 0)
- `ck_garments_formality_range` CHECK (`formality_level` IS NULL OR (`formality_level` >= 1 AND `formality_level` <= 10))
- `ck_garments_color_hex_format` CHECK (`color_hex` IS NULL OR `color_hex` ~ '^#[0-9A-Fa-f]{6}$')

---

### 2.5 `garment_images`

Images associated with a garment (front, back, detail, etc.).

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `garment_id` | `uuid` | `FK → garments.id`, `NOT NULL` | — | Parent garment |
| `image_url` | `varchar(500)` | `NOT NULL` | — | Full-size image URL (Cloudinary) |
| `thumbnail_url` | `varchar(500)` | `NOT NULL` | — | Optimized thumbnail URL |
| `blur_hash` | `varchar(255)` | — | `NULL` | BlurHash for placeholder |
| `width` | `integer` | — | `NULL` | Image width in pixels |
| `height` | `integer` | — | `NULL` | Image height in pixels |
| `file_size_bytes` | `integer` | — | `NULL` | File size in bytes |
| `format` | `varchar(10)` | — | `NULL` | Image format (webp, jpg, png) |
| `cloudinary_public_id` | `varchar(255)` | — | `NULL` | Cloudinary asset ID |
| `view_type` | `image_view_type` | `NOT NULL` | `'front'` | View angle (front, back, side, detail) |
| `is_primary` | `boolean` | `NOT NULL` | `false` | Primary display image |
| `sort_order` | `integer` | `NOT NULL` | `0` | Display order |
| `is_ai_generated` | `boolean` | `NOT NULL` | `false` | Whether AI created this |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Upload timestamp |

**Indexes:**
- `pk_garment_images` ON `id`
- `idx_garment_images_garment_id` ON `garment_id`
- `idx_garment_images_garment_primary` UNIQUE ON (`garment_id`) WHERE `is_primary = true AND deleted_at IS NULL`
- `idx_garment_images_sort_order` ON (`garment_id`, `sort_order`)

**Foreign Keys:**
- `fk_garment_images_garments` FOREIGN KEY (`garment_id`) REFERENCES `garments`(`id`) ON DELETE CASCADE

---

### 2.6 `garment_attributes`

AI-detected and user-defined attributes for garments. Key-value store for flexible attribute management.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `garment_id` | `uuid` | `FK → garments.id`, `NOT NULL` | — | Parent garment |
| `attribute_key` | `varchar(100)` | `NOT NULL` | — | Attribute name (e.g., "neckline", "sleeve_length", "fit") |
| `attribute_value` | `text` | `NOT NULL` | — | Attribute value (e.g., "crew_neck", "long", "regular") |
| `source` | `attribute_source` | `NOT NULL` | `'ai'` | How this attribute was determined |
| `confidence` | `numeric(5,4)` | — | `NULL` | AI confidence score (0–1) |
| `is_verified` | `boolean` | `NOT NULL` | `false` | User verified this attribute |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Creation timestamp |

**Indexes:**
- `pk_garment_attributes` ON `id`
- `idx_garment_attributes_garment_id` ON `garment_id`
- `uq_garment_attributes_garment_key` UNIQUE ON (`garment_id`, `attribute_key`)
- `idx_garment_attributes_key_value` ON (`attribute_key`, `attribute_value`)

**Foreign Keys:**
- `fk_garment_attributes_garments` FOREIGN KEY (`garment_id`) REFERENCES `garments`(`id`) ON DELETE CASCADE

---

### 2.7 `outfits`

User-created or AI-generated outfit combinations.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | Owner |
| `name` | `varchar(200)` | `NOT NULL` | — | Outfit name |
| `description` | `text` | — | `NULL` | Optional description |
| `outfit_type` | `outfit_type` | `NOT NULL` | `'Casual'` | Style category |
| `season` | `season` | — | `NULL` | Recommended season |
| `formality_level` | `integer` | — | `NULL` | 1 (casual) to 10 (formal) |
| `weather_tags` | `text[]` | — | `NULL` | Suitable weather conditions |
| `color_palette` | `varchar(50)[]` | — | `NULL` | Dominant colors hex array |
| `is_public` | `boolean` | `NOT NULL` | `false` | Share to community |
| `is_favorite` | `boolean` | `NOT NULL` | `false` | User favorite |
| `is_ai_generated` | `boolean` | `NOT NULL` | `false` | AI-generated outfit |
| `ai_confidence` | `numeric(5,4)` | — | `NULL` | AI quality score |
| `wear_count` | `integer` | `NOT NULL` | `0` | Times this outfit was worn |
| `last_worn_at` | `timestamptz` | — | `NULL` | Last worn date |
| `source_event_id` | `uuid` | `FK → calendar_events.id` | `NULL` | Event this outfit was created for |
| `thumbnail_url` | `varchar(500)` | — | `NULL` | Generated outfit preview |
| `metadata` | `jsonb` | — | `'{}'::jsonb` | Extensible metadata |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL` | `now()` | Last update |
| `deleted_at` | `timestamptz` | — | `NULL` | Soft delete |

**Indexes:**
- `pk_outfits` ON `id`
- `idx_outfits_user_id` ON `user_id`
- `idx_outfits_user_id_created_at` ON (`user_id`, `created_at` DESC)
- `idx_outfits_outfit_type` ON `outfit_type`
- `idx_outfits_is_public` ON `is_public` WHERE `is_public = true AND deleted_at IS NULL`
- `idx_outfits_season` ON `season`
- `idx_outfits_is_ai_generated` ON `is_ai_generated`

**Foreign Keys:**
- `fk_outfits_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

**Check Constraints:**
- `ck_outfits_formality_range` CHECK (`formality_level` IS NULL OR (`formality_level` >= 1 AND `formality_level` <= 10))

---

### 2.8 `outfit_garments`

Junction table linking garments to outfits with positional data.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `outfit_id` | `uuid` | `FK → outfits.id`, `NOT NULL` | — | Parent outfit |
| `garment_id` | `uuid` | `FK → garments.id`, `NOT NULL` | — | Garment in outfit |
| `position` | `integer` | `NOT NULL` | `0` | Display order (0-based) |
| `layer` | `integer` | `NOT NULL` | `0` | Layer (0=base, 1=middle, 2=outer) |
| `is_optional` | `boolean` | `NOT NULL` | `false` | Can be substituted |
| `notes` | `varchar(500)` | — | `NULL` | Per-garment outfit notes |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Association timestamp |

**Indexes:**
- `pk_outfit_garments` ON `id`
- `uq_outfit_garments_outfit_garment` UNIQUE ON (`outfit_id`, `garment_id`)
- `idx_outfit_garments_outfit_id` ON `outfit_id`
- `idx_outfit_garments_garment_id` ON `garment_id`
- `idx_outfit_garments_position` ON (`outfit_id`, `position`)

**Foreign Keys:**
- `fk_outfit_garments_outfits` FOREIGN KEY (`outfit_id`) REFERENCES `outfits`(`id`) ON DELETE CASCADE
- `fk_outfit_garments_garments` FOREIGN KEY (`garment_id`) REFERENCES `garments`(`id`) ON DELETE CASCADE

---

### 2.9 `outfit_versions`

Version history for outfits, enabling restore and history tracking.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `outfit_id` | `uuid` | `FK → outfits.id`, `NOT NULL` | — | Parent outfit |
| `version` | `integer` | `NOT NULL` | — | Monotonic version number |
| `garments_snapshot` | `jsonb` | `NOT NULL` | — | Full garment list at this version |
| `change_description` | `varchar(500)` | — | `NULL` | What changed |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Version timestamp |

**Indexes:**
- `pk_outfit_versions` ON `id`
- `uq_outfit_versions_outfit_version` UNIQUE ON (`outfit_id`, `version`)
- `idx_outfit_versions_outfit_id` ON `outfit_id`

**Foreign Keys:**
- `fk_outfit_versions_outfits` FOREIGN KEY (`outfit_id`) REFERENCES `outfits`(`id`) ON DELETE CASCADE

---

### 2.10 `calendar_events`

Calendar events synced from Google Calendar / iCal, with outfit assignments.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | Owner |
| `outfit_id` | `uuid` | `FK → outfits.id` | `NULL` | Assigned outfit |
| `external_id` | `varchar(500)` | — | `NULL` | External calendar event ID |
| `calendar_source` | `calendar_source` | `NOT NULL` | `'internal'` | Source (google, apple, internal) |
| `title` | `varchar(255)` | `NOT NULL` | — | Event title |
| `description` | `text` | — | `NULL` | Event description |
| `event_date` | `date` | `NOT NULL` | — | Event date (no time) |
| `start_time` | `time` | — | `NULL` | Event start time |
| `end_time` | `time` | — | `NULL` | Event end time |
| `is_all_day` | `boolean` | `NOT NULL` | `false` | All-day event |
| `location` | `varchar(500)` | — | `NULL` | Event location |
| `dress_code` | `varchar(100)` | — | `NULL` | Dress code (formal, casual, etc.) |
| `weather_forecast` | `jsonb` | — | `NULL` | Weather data for outfit recommendation |
| `weather_actual` | `jsonb` | — | `NULL` | Actual weather (filled after event) |
| `is_recurring` | `boolean` | `NOT NULL` | `false` | Part of recurring series |
| `recurrence_rule` | `varchar(500)` | — | `NULL` | RRULE string |
| `reminder_minutes` | `integer` | `NOT NULL` | `60` | Minutes before to remind |
| `metadata` | `jsonb` | — | `'{}'::jsonb` | Extensible metadata |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL` | `now()` | Last update |
| `deleted_at` | `timestamptz` | — | `NULL` | Soft delete |

**Indexes:**
- `pk_calendar_events` ON `id`
- `idx_calendar_events_user_id` ON `user_id`
- `idx_calendar_events_user_date` ON (`user_id`, `event_date`)
- `idx_calendar_events_external_id` ON `external_id` WHERE `external_id IS NOT NULL`
- `idx_calendar_events_outfit_id` ON `outfit_id` WHERE `outfit_id IS NOT NULL`
- `idx_calendar_events_date_range` ON (`event_date`, `start_time`)

**Foreign Keys:**
- `fk_calendar_events_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
- `fk_calendar_events_outfits` FOREIGN KEY (`outfit_id`) REFERENCES `outfits`(`id`) ON DELETE SET NULL

---

### 2.11 `notifications`

In-app and push notification records.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | Recipient |
| `type` | `notification_type` | `NOT NULL` | — | Notification category |
| `title` | `varchar(255)` | `NOT NULL` | — | Notification title |
| `body` | `text` | `NOT NULL` | — | Notification body |
| `data` | `jsonb` | — | `'{}'::jsonb` | Action data (deep link params) |
| `image_url` | `varchar(500)` | — | `NULL` | Optional image |
| `priority` | `notification_priority` | `NOT NULL` | `'normal'` | Priority level |
| `is_read` | `boolean` | `NOT NULL` | `false` | Read status |
| `read_at` | `timestamptz` | — | `NULL` | When read |
| `is_delivered` | `boolean` | `NOT NULL` | `false` | Delivery confirmation |
| `delivered_at` | `timestamptz` | — | `NULL` | When delivered |
| `fcm_message_id` | `varchar(255)` | — | `NULL` | FCM message ID for tracking |
| `sender_id` | `uuid` | `FK → users.id` | `NULL` | System or admin sender |
| `expires_at` | `timestamptz` | — | `NULL` | Auto-expiry |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Creation timestamp |

**Indexes:**
- `pk_notifications` ON `id`
- `idx_notifications_user_id_created_at` ON (`user_id`, `created_at` DESC)
- `idx_notifications_user_id_unread` ON (`user_id`) WHERE `is_read = false`
- `idx_notifications_type` ON `type`
- `idx_notifications_expires_at` ON `expires_at` WHERE `expires_at IS NOT NULL`

**Foreign Keys:**
- `fk_notifications_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
- `fk_notifications_sender` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE SET NULL

---

### 2.12 `notification_preferences`

User-level notification opt-in/opt-out configuration.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `user_id` | `uuid` | `PK`, `FK → users.id`, `NOT NULL` | — | User (one-to-one) |
| `push_enabled` | `boolean` | `NOT NULL` | `true` | Push notifications enabled |
| `email_enabled` | `boolean` | `NOT NULL` | `true` | Email notifications enabled |
| `daily_outfit_reminder` | `boolean` | `NOT NULL` | `true` | Daily outfit suggestion |
| `daily_outfit_time` | `time` | `NOT NULL` | `'07:00'` | Time for daily reminder |
| `garment_reminder_days` | `integer` | `NOT NULL` | `90` | Remind if unworn for N days |
| `weather_alerts` | `boolean` | `NOT NULL` | `true` | Weather-based outfit alerts |
| `calendar_reminders` | `boolean` | `NOT NULL` | `true` | Event outfit reminders |
| `social_notifications` | `boolean` | `NOT NULL` | `true` | Likes, comments, follows |
| `marketing_emails` | `boolean` | `NOT NULL` | `false` | Promotional emails |
| `product_updates` | `boolean` | `NOT NULL` | `true` | Feature update announcements |
| `fcm_token` | `text` | — | `NULL` | Firebase device token |
| `fcm_token_updated_at` | `timestamptz` | — | `NULL` | Token refresh timestamp |
| `quiet_hours_start` | `time` | — | `NULL` | Do-not-disturb start |
| `quiet_hours_end` | `time` | — | `NULL` | Do-not-disturb end |
| `updated_at` | `timestamptz` | `NOT NULL` | `now()` | Last update |

**Indexes:**
- `pk_notification_preferences` ON `user_id`

**Foreign Keys:**
- `fk_notification_preferences_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

**Check Constraints:**
- `ck_notification_preferences_garment_reminder` CHECK (`garment_reminder_days` >= 1 AND `garment_reminder_days` <= 365)

---

### 2.13 `analytics_events`

Immutable event log for product analytics and user behavior tracking.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | Actor |
| `event_name` | `varchar(100)` | `NOT NULL` | — | Event identifier (dot-notation) |
| `event_data` | `jsonb` | `NOT NULL` | `'{}'::jsonb` | Event-specific data |
| `session_id` | `varchar(100)` | `NOT NULL` | — | User session identifier |
| `device` | `varchar(50)` | — | `NULL` | Device type (mobile, desktop, tablet) |
| `platform` | `varchar(50)` | — | `NULL` | OS + browser string |
| `ip_address_hash` | `varchar(64)` | — | `NULL` | SHA-256 hashed IP (privacy) |
| `user_agent` | `text` | — | `NULL` | Full user agent string |
| `referrer` | `varchar(500)` | — | `NULL` | HTTP referrer |
| `page_url` | `varchar(500)` | — | `NULL` | Current page URL |
| `duration_ms` | `integer` | — | `NULL` | Time spent on page/action |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Event timestamp |

**Indexes:**
- `pk_analytics_events` ON `id`
- `idx_analytics_events_user_id` ON `user_id`
- `idx_analytics_events_event_name` ON `event_name`
- `idx_analytics_events_created_at` ON `created_at`
- `idx_analytics_events_name_created` ON (`event_name`, `created_at`)
- `idx_analytics_events_session_id` ON `session_id`

**Foreign Keys:**
- `fk_analytics_events_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

**Partitioning:**
- Partitioned by month on `created_at` (e.g., `analytics_events_2024_01`)

---

### 2.14 `audit_logs`

Immutable, append-only log of all state-changing operations for security and compliance.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id` | `NULL` | Actor (NULL for system actions) |
| `action` | `varchar(50)` | `NOT NULL` | — | Action verb (CREATE, UPDATE, DELETE, LOGIN, etc.) |
| `entity_type` | `varchar(50)` | `NOT NULL` | — | Affected entity (garment, outfit, user, etc.) |
| `entity_id` | `uuid` | `NOT NULL` | — | Affected entity ID |
| `old_values` | `jsonb` | — | `NULL` | Previous state (before) |
| `new_values` | `jsonb` | — | `NULL` | New state (after) |
| `diff` | `jsonb` | — | `NULL` | Structured diff of changes |
| `ip_address` | `varchar(45)` | — | `NULL` | Request IP |
| `user_agent` | `text` | — | `NULL` | Request user agent |
| `request_id` | `varchar(100)` | — | `NULL` | Traceable request ID |
| `api_version` | `varchar(10)` | — | `NULL` | API version used |
| `metadata` | `jsonb` | — | `'{}'::jsonb` | Extra context |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Log timestamp |

**Indexes:**
- `pk_audit_logs` ON `id`
- `idx_audit_logs_user_id` ON `user_id`
- `idx_audit_logs_entity_type_entity_id` ON (`entity_type`, `entity_id`)
- `idx_audit_logs_action` ON `action`
- `idx_audit_logs_created_at` ON `created_at`
- `idx_audit_logs_user_id_created_at` ON (`user_id`, `created_at` DESC)

**Foreign Keys:**
- `fk_audit_logs_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL

**Partitioning:**
- Partitioned by month on `created_at`
- Retention: minimum 1 year (configurable)

---

### 2.15 `sync_logs`

Record of offline-to-online synchronization operations.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | User who synced |
| `device_id` | `varchar(100)` | `NOT NULL` | — | Device identifier |
| `sync_type` | `sync_type` | `NOT NULL` | — | Full or incremental |
| `status` | `sync_status` | `NOT NULL` | `'pending'` | Current sync status |
| `operations_total` | `integer` | `NOT NULL` | `0` | Total operations in this sync |
| `operations_applied` | `integer` | `NOT NULL` | `0` | Successfully applied |
| `operations_failed` | `integer` | `NOT NULL` | `0` | Failed operations |
| `conflicts_total` | `integer` | `NOT NULL` | `0` | Total conflicts detected |
| `conflicts_resolved` | `integer` | `NOT NULL` | `0` | Auto-resolved conflicts |
| `conflicts_manual` | `integer` | `NOT NULL` | `0` | Requires user resolution |
| `conflict_details` | `jsonb` | — | `'[]'::jsonb` | Array of conflict objects |
| `client_version` | `varchar(50)` | — | `NULL` | App version at sync time |
| `started_at` | `timestamptz` | `NOT NULL` | — | Sync start |
| `completed_at` | `timestamptz` | — | `NULL` | Sync completion |
| `duration_ms` | `integer` | — | `NULL` | Total duration |
| `error_message` | `text` | — | `NULL` | Error details if failed |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Record creation |

**Indexes:**
- `pk_sync_logs` ON `id`
- `idx_sync_logs_user_id` ON `user_id`
- `idx_sync_logs_user_id_created_at` ON (`user_id`, `created_at` DESC)
- `idx_sync_logs_status` ON `status`
- `idx_sync_logs_device_id` ON `device_id`

**Foreign Keys:**
- `fk_sync_logs_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

---

### 2.16 `ai_detection_logs`

Audit trail for all AI inference operations on garment images.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `garment_id` | `uuid` | `FK → garments.id`, `NOT NULL` | — | Target garment |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | Garment owner (denormalized for query perf) |
| `model_name` | `varchar(100)` | `NOT NULL` | — | Model identifier (e.g., "detectron2/mask-rcnn") |
| `model_version` | `varchar(50)` | `NOT NULL` | — | Model version string |
| `input_image_url` | `varchar(500)` | `NOT NULL` | — | Original input image |
| `preprocessed_image_url` | `varchar(500)` | — | `NULL` | Preprocessed input |
| `raw_output` | `jsonb` | `NOT NULL` | — | Complete model output |
| `detected_attributes` | `jsonb` | — | `NULL` | Extracted attributes |
| `confidence_scores` | `jsonb` | — | `NULL` | Per-attribute confidence |
| `inference_time_ms` | `integer` | — | `NULL` | Model inference duration |
| `total_processing_time_ms` | `integer` | — | `NULL` | Full pipeline duration |
| `status` | `ai_detection_status` | `NOT NULL` | `'pending'` | Processing status |
| `error_message` | `text` | — | `NULL` | Error details |
| `retry_count` | `integer` | `NOT NULL` | `0` | Number of retries |
| `was_fallback` | `boolean` | `NOT NULL` | `false` | Used fallback model |
| `gpu_used` | `boolean` | — | `NULL` | GPU inference flag |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Log timestamp |

**Indexes:**
- `pk_ai_detection_logs` ON `id`
- `idx_ai_detection_logs_garment_id` ON `garment_id`
- `idx_ai_detection_logs_user_id` ON `user_id`
- `idx_ai_detection_logs_status` ON `status`
- `idx_ai_detection_logs_created_at` ON `created_at`
- `idx_ai_detection_logs_model_name_version` ON (`model_name`, `model_version`)

**Foreign Keys:**
- `fk_ai_detection_logs_garments` FOREIGN KEY (`garment_id`) REFERENCES `garments`(`id`) ON DELETE CASCADE
- `fk_ai_detection_logs_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

---

### 2.17 `user_consent`

Records of user consent for data processing activities (GDPR/LGPD/Law 1581 compliance).

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `PK`, `NOT NULL` | `gen_random_uuid()` | Primary identifier |
| `user_id` | `uuid` | `FK → users.id`, `NOT NULL` | — | User |
| `consent_type` | `consent_type` | `NOT NULL` | — | Type of consent |
| `granted` | `boolean` | `NOT NULL` | — | True = granted, False = withdrawn |
| `ip_address` | `varchar(45)` | `NOT NULL` | — | IP at time of consent |
| `user_agent` | `text` | — | `NULL` | Browser/device info |
| `consent_version` | `varchar(20)` | `NOT NULL` | — | Version of consent form |
| `granted_at` | `timestamptz` | `NOT NULL` | `now()` | When consent was given/withdrawn |
| `expires_at` | `timestamptz` | — | `NULL` | Consent expiry (if applicable) |

**Indexes:**
- `pk_user_consent` ON `id`
- `idx_user_consent_user_id` ON `user_id`
- `uq_user_consent_user_type` UNIQUE ON (`user_id`, `consent_type`)
- `idx_user_consent_expires_at` ON `expires_at` WHERE `expires_at IS NOT NULL`

**Foreign Keys:**
- `fk_user_consent_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

---

## 3. Enum Definitions

All enums are defined as PostgreSQL `CREATE TYPE` and mirrored as TypeScript `const enum` in `/packages/shared/src/enums/`.

### 3.1 `user_role`

```sql
CREATE TYPE user_role AS ENUM (
  'user',        -- Standard authenticated user
  'moderator',   -- Content moderator
  'admin',       -- Platform administrator
  'superadmin'   -- System super administrator
);
```

### 3.2 `avatar_gender`

```sql
CREATE TYPE avatar_gender AS ENUM (
  'male',
  'female',
  'neutral'
);
```

### 3.3 `avatar_status`

```sql
CREATE TYPE avatar_status AS ENUM (
  'pending',           -- Generation queued
  'processing',        -- Being generated
  'completed',         -- Successfully generated
  'failed',            -- Generation failed
  'needs_regeneration' -- Requested update
);
```

### 3.4 `garment_type`

```sql
CREATE TYPE garment_type AS ENUM (
  'Top',
  'Bottom',
  'Dress',
  'Outerwear',
  'Footwear',
  'Accessory',
  'Bag',
  'Jewelry',
  'Headwear',
  'Swimwear',
  'Lingerie',
  'Other'
);
```

### 3.5 `garment_state`

```sql
CREATE TYPE garment_state AS ENUM (
  'Active',    -- Currently in wardrobe
  'Archived',  -- Stored but not active
  'Donated',   -- Given away
  'Sold',      -- Resold
  'Loaned',    -- Lent to someone
  'Lost',      -- Lost
  'Damaged'    -- Damaged beyond use
);
```

### 3.6 `outfit_type`

```sql
CREATE TYPE outfit_type AS ENUM (
  'Casual',
  'Business',
  'Formal',
  'Sport',
  'Evening',
  'Travel',
  'Beach',
  'Date',
  'Interview',
  'Vacation',
  'Wedding',
  'Funeral',
  'Other'
);
```

### 3.7 `season`

```sql
CREATE TYPE season AS ENUM (
  'Spring',
  'Summer',
  'Fall',
  'Winter',
  'All'
);
```

### 3.8 `notification_type`

```sql
CREATE TYPE notification_type AS ENUM (
  'daily_outfit_suggestion',   -- Daily AI outfit recommendation
  'garment_unused',            -- Garment unworn for N days
  'weather_alert',             -- Weather mismatch with planned outfit
  'calendar_reminder',         -- Upcoming event outfit reminder
  'ai_detection_complete',     -- AI finished processing garment
  'avatar_ready',              -- 3D avatar generation complete
  'sync_complete',             -- Offline sync finished
  'sync_conflict',             -- Sync conflict needs resolution
  'social_like',               -- Someone liked your outfit
  'social_comment',            -- Someone commented on your outfit
  'social_follow',             -- Someone followed you
  'wardrobe_goal',             -- Milestone reached (N garments, etc.)
  'sustainability_milestone',  -- CO2/water savings milestone
  'resale_suggestion',         -- Garment suggested for resale
  'system_update',             -- Platform update notification
  'security_alert',            -- Suspicious login or activity
  'marketing',                 -- Promotional / marketing message
  'admin_broadcast'            -- System-wide admin message
);
```

### 3.9 `notification_priority`

```sql
CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);
```

### 3.10 `sync_type`

```sql
CREATE TYPE sync_type AS ENUM (
  'full',       -- Full data sync
  'incremental' -- Only changed data since last sync
);
```

### 3.11 `sync_status`

```sql
CREATE TYPE sync_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'completed_with_conflicts',
  'failed',
  'cancelled'
);
```

### 3.12 `ai_detection_status`

```sql
CREATE TYPE ai_detection_status AS ENUM (
  'pending',          -- Queued for processing
  'processing',       -- Currently being processed
  'completed',        -- Successfully processed
  'completed_partial',-- Processed with partial results
  'failed',           -- Processing failed
  'skipped'           -- Skipped (e.g., file too small, invalid format)
);
```

### 3.13 `attribute_source`

```sql
CREATE TYPE attribute_source AS ENUM (
  'ai',              -- Automatically detected by AI
  'user',            -- Manually entered by user
  'barcode_lookup',  -- Retrieved from product database
  'brand_api',       -- From brand API
  'imported'         -- Imported from another source
);
```

### 3.14 `image_view_type`

```sql
CREATE TYPE image_view_type AS ENUM (
  'front',
  'back',
  'left_side',
  'right_side',
  'detail',
  'flat_lay',
  'worn',
  'label'
);
```

### 3.15 `calendar_source`

```sql
CREATE TYPE calendar_source AS ENUM (
  'internal',    -- Created within CID
  'google',      -- Synced from Google Calendar
  'apple',       -- Synced from Apple Calendar
  'ical'         -- Imported from iCal URL
);
```

### 3.16 `consent_type`

```sql
CREATE TYPE consent_type AS ENUM (
  'terms_of_service',     -- Accepted Terms of Service
  'privacy_policy',       -- Accepted Privacy Policy
  'data_processing',      -- Consent for data processing
  'marketing_emails',     -- Marketing email opt-in
  'ai_processing',        -- AI garment detection consent
  'biometric_data',       -- Body measurement processing
  'third_party_sharing',  -- Data sharing with partners
  'data_retention'        -- Extended data retention consent
);
```

---

## 4. Relationships Summary

| Parent | Child | Type | Foreign Key |
|---|---|---|---|
| `users` | `avatars` | 1:N | `avatars.user_id` → `users.id` |
| `avatars` | `avatar_versions` | 1:N | `avatar_versions.avatar_id` → `avatars.id` |
| `users` | `garments` | 1:N | `garments.user_id` → `users.id` |
| `garments` | `garment_images` | 1:N | `garment_images.garment_id` → `garments.id` |
| `garments` | `garment_attributes` | 1:N | `garment_attributes.garment_id` → `garments.id` |
| `users` | `outfits` | 1:N | `outfits.user_id` → `users.id` |
| `outfits` | `outfit_garments` | 1:N | `outfit_garments.outfit_id` → `outfits.id` |
| `garments` | `outfit_garments` | 1:N | `outfit_garments.garment_id` → `garments.id` |
| `outfits` | `outfit_versions` | 1:N | `outfit_versions.outfit_id` → `outfits.id` |
| `users` | `calendar_events` | 1:N | `calendar_events.user_id` → `users.id` |
| `outfits` | `calendar_events` | 1:N | `calendar_events.outfit_id` → `outfits.id` |
| `users` | `notifications` | 1:N | `notifications.user_id` → `users.id` |
| `users` | `notification_preferences` | 1:1 | `notification_preferences.user_id` → `users.id` |
| `users` | `analytics_events` | 1:N | `analytics_events.user_id` → `users.id` |
| `users` | `audit_logs` | 1:N | `audit_logs.user_id` → `users.id` |
| `users` | `sync_logs` | 1:N | `sync_logs.user_id` → `users.id` |
| `garments` | `ai_detection_logs` | 1:N | `ai_detection_logs.garment_id` → `garments.id` |
| `users` | `user_consent` | 1:N | `user_consent.user_id` → `users.id` |

---

## 5. Migration Strategy

### 5.1 Approach

- **Tool**: TypeORM migrations (generated from entity changes)
- **Versioning**: Timestamp-prefixed (YYYYMMDDHHMMSS) migration files
- **Storage**: Migrations stored in `apps/api/src/database/migrations/`
- **Execution**: Auto-run on server start in development; manual via CI in production
- **Rollback**: Each migration MUST have a working `down()` method

### 5.2 Migration Rules

1. **Always** generate migrations from entity changes (`pnpm migration:generate`)
2. **Always** review generated SQL before committing
3. **Never** modify existing migrations — create a new one
4. **Never** run migrations directly on production database
5. **Always** test migrations on staging first
6. **Always** backup database before production migration
7. **Always** have a rollback plan (tested `down()`)
8. **Never** delete a column without a deprecation period (minimum 1 release cycle)
9. **Never** make a nullable column non-nullable without data migration
10. **Always** add new columns as nullable or with a default value

### 5.3 Migration Lifecycle

```
Developer makes entity changes
       │
       ▼
pnpm migration:generate src/database/migrations/AddGarmentColorHex
       │
       ▼
Developer reviews generated SQL
       │
       ▼
Migration committed to PR
       │
       ▼
PR merged → CI applies migration to staging
       │
       ▼
Staging verified → Deploy to production
       │
       ▼
Production migration runs (manual approval)
       │
       ▼
Post-migration verification
```

### 5.4 Migration File Naming

`{YYYYMMDDHHMMSS}-{description}.ts`

Examples:
- `20240501120000-CreateUsersTable.ts`
- `20240502143000-AddGarmentColorHex.ts`
- `20240503101500-AddAiDetectionLogs.ts`

---

## 6. Backup Strategy

### 6.1 Regular Backups

| Backup Type | Frequency | Retention | Storage | Method |
|---|---|---|---|---|
| Full database | Every 6 hours | 7 days (rolling) | Cloudinary + Google Drive | `pg_dump -Fc` |
| WAL archive | Continuous | 24 hours | S3-compatible (Supabase) | WAL archiving |
| Daily snapshot | Daily at 02:00 UTC | 30 days | Google Drive | `pg_dump -Fc` |
| Weekly snapshot | Sundays 02:00 UTC | 12 weeks | Google Drive + Cloudinary | `pg_dump -Fc` |
| Monthly archive | 1st of month | 12 months | Cold storage | `pg_dump -Fc` + GPG encrypt |

### 6.2 Point-in-Time Recovery (PITR)

- Enabled via Supabase (or WAL archiving for self-hosted)
- Allows recovery to any point within the last 24 hours
- Required for data loss scenarios
- Tested monthly on staging environment

### 6.3 Media Backups

| Asset | Primary Storage | Backup |
|---|---|---|
| Garment images | Cloudinary CDN | Google Drive (nightly sync) |
| 3D models (avatars, garments) | Cloudinary / S3 | Google Drive |
| User profile photos | Cloudinary | Google Drive |
| AI model weights | GitHub LFS + S3 | Google Drive + local NAS |

### 6.4 Configuration & Code Backups

| Asset | Storage | Method |
|---|---|---|
| Source code | GitHub | Git history (distributed) |
| Docker configs | GitHub + private registry | Git history + image tags |
| Environment secrets | GitHub Encrypted Secrets + 1Password | Manual backup |
| Infrastructure as Code | GitHub | Git history |
| Database schema | TypeORM migrations (in Git) | Git history |

### 6.5 Disaster Recovery Procedures

**Scenario 1: Database corruption / data loss**
1. Identify the point of failure
2. Restore the nearest full backup to a new database instance
3. Apply WAL archive to reach the desired point in time
4. Verify data integrity (row counts, key records)
5. Update connection strings to point to restored database
6. Run verification queries
7. Document incident

**Scenario 2: Infrastructure failure**
1. Provision new infrastructure from Terraform/Pulumi configs
2. Restore latest database backup
3. Deploy latest application containers
4. Update DNS records
5. Verify all services operational
6. Document incident

**Scenario 3: Accidental data deletion**
1. Identify affected records and time of deletion
2. Restore specific rows from latest backup (or use PITR)
3. Verify restored data
4. Implement guardrails to prevent recurrence
5. Document incident

### 6.6 Backup Testing

- **Weekly**: Automated restore test on staging environment
- **Monthly**: Full disaster recovery drill (restore entire production DB to staging)
- **Quarterly**: Backup restore time benchmark (target: < 2 hours for full restore)
- **Annually**: Third-party backup audit

### 6.7 Encryption

- All backups encrypted at rest (AES-256)
- Backups in transit use TLS 1.3
- Monthly archives GPG-encrypted with offline key
- Backup encryption keys stored in 1Password, not in infrastructure

---

> End of Data Model Document

---
