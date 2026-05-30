# API Contracts

## Overview

Base URL: `https://api.closetinteligente.com/v1`
Content-Type: `application/json`
Authorization: `Bearer <jwt_token>`

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes (except auth) | JWT Bearer token |
| X-Request-Id | No | Idempotency key |
| X-Client-Version | Yes | Client semver |
| X-Platform | Yes | "web" \| "mobile" |
| Accept-Language | No | Locale (default: "es") |

## Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request body validation failed |
| UNAUTHORIZED | 401 | Missing or expired token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily down |

## Rate Limits

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Auth | 10 requests | 1 minute |
| Garments | 60 requests | 1 minute |
| Outfits | 30 requests | 1 minute |
| Avatars | 10 requests | 1 minute |
| Calendar | 60 requests | 1 minute |
| Analytics | 20 requests | 1 minute |
| Storage | 30 requests | 1 minute |
| Export | 5 requests | 1 minute |
| AI endpoints | 10 requests | 1 minute |

---

## Auth Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**

```typescript
{
  email: string;        // valid email, max 255 chars
  password: string;     // min 8, max 128, must have upper+lower+number
  name: string;         // min 2, max 100 chars
  acceptTerms: boolean; // must be true
  consentAI: boolean;   // consent for AI training
}
```

**Validation Rules:**
- `email`: RFC 5322 valid, unique in database
- `password`: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
- `name`: alphanumeric + spaces, apostrophes, hyphens
- `acceptTerms`: must be `true`
- `consentAI`: optional, defaults to `false`

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | User created successfully |
| 400 | Validation error |
| 409 | Email already registered |
| 429 | Rate limited |

**201 Response:**

```typescript
{
  user: {
    id: string;              // UUID v4
    email: string;
    name: string;
    avatar: string | null;   // avatar URL
    createdAt: string;       // ISO 8601
  },
  tokens: {
    accessToken: string;     // JWT, 15 min expiry
    refreshToken: string;    // JWT, 7 day expiry
  }
}
```

---

### POST /auth/login

Authenticate user credentials.

**Request Body:**

```typescript
{
  email: string;    // valid email
  password: string; // min 8 chars
}
```

**Validation Rules:**
- `email`: must exist in database
- `password`: must match stored hash

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Login successful |
| 400 | Validation error |
| 401 | Invalid credentials |
| 429 | Rate limited |

**200 Response:**

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    createdAt: string;
  },
  tokens: {
    accessToken: string;
    refreshToken: string;
  }
}
```

**Error Response (401):**

```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Credenciales inválidas",
    details: null
  }
}
```

---

### POST /auth/refresh

Refresh an expiring access token.

**Request Body:**

```typescript
{
  refreshToken: string; // valid JWT refresh token
}
```

**Validation Rules:**
- `refreshToken`: must be valid JWT, not expired, not revoked

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Tokens refreshed |
| 401 | Invalid or expired refresh token |

**200 Response:**

```typescript
{
  accessToken: string;  // new JWT, 15 min expiry
  refreshToken: string; // new JWT, 7 day expiry
}
```

---

### POST /auth/logout

Invalidate current tokens.

**Request Body:**

```typescript
{
  refreshToken: string; // token to invalidate
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Logout successful |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  message: "Sesión cerrada exitosamente"
}
```

---

### GET /auth/me

Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | User profile |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  preferences: {
    language: "es" | "en";
    theme: "light" | "dark" | "system";
    notifications: boolean;
    syncEnabled: boolean;
  };
  stats: {
    totalGarments: number;
    totalOutfits: number;
    totalAvatars: number;
  }
}
```

---

### PATCH /auth/me

Update current user profile.

**Request Body:** (all fields optional)

```typescript
{
  name?: string;         // min 2, max 100
  avatar?: string;       // valid URL or null
  preferences?: {
    language?: "es" | "en";
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
    syncEnabled?: boolean;
  }
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Profile updated |
| 400 | Validation error |
| 401 | Unauthorized |

**200 Response:** Same as GET /auth/me

---

## Garment Endpoints

### POST /garments

Create a new garment record (before image upload).

**Request Body:**

```typescript
{
  name: string;            // min 1, max 200 chars
  category: GarmentCategory;
  subcategory?: string;
  color?: string;          // hex color
  brand?: string;          // max 100 chars
  size?: string;           // max 20 chars
  material?: string[];     // max 5 materials
  notes?: string;          // max 500 chars
  isFavorite?: boolean;
  tags?: string[];         // max 10 tags, each max 30 chars
}

type GarmentCategory =
  | "tops" | "t-shirts" | "shirts" | "blouses" | "sweaters"
  | "jackets" | "coats" | "hoodies" | "vests"
  | "bottoms" | "pants" | "jeans" | "shorts" | "skirts"
  | "dresses" | "jumpsuits"
  | "footwear" | "sneakers" | "boots" | "sandals" | "heels" | "flats"
  | "accessories" | "bags" | "hats" | "belts" | "scarves" | "jewelry" | "glasses"
  | "outerwear";
```

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | Garment created |
| 400 | Validation error |
| 401 | Unauthorized |
| 429 | Rate limited |

**201 Response:**

```typescript
{
  id: string;
  userId: string;
  name: string;
  category: GarmentCategory;
  subcategory: string | null;
  color: string | null;
  brand: string | null;
  size: string | null;
  material: string[];
  notes: string | null;
  isFavorite: boolean;
  tags: string[];
  state: GarmentState;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  processingStatus: ProcessingStatus;
  detectedAttributes: DetectedAttributes | null;
  createdAt: string;
  updatedAt: string;
}

type GarmentState = "available" | "washing" | "donated" | "discarded";
type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

interface DetectedAttributes {
  dominantColors: string[];
  patterns: string[];
  estimatedCategory: string;
  confidence: number;
}
```

---

### GET /garments

List user's garments with pagination and filters.

**Query Parameters:**

```typescript
{
  page?: number;           // default: 1, min: 1
  limit?: number;          // default: 20, min: 1, max: 100
  category?: GarmentCategory;
  state?: GarmentState;
  color?: string;          // hex color
  search?: string;         // search in name, brand, notes
  isFavorite?: boolean;
  tags?: string[];         // comma-separated
  sortBy?: "name" | "createdAt" | "updatedAt" | "color";
  sortOrder?: "asc" | "desc";
  dateFrom?: string;       // ISO 8601
  dateTo?: string;         // ISO 8601
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Garments list |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  data: Garment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
}
```

---

### GET /garments/:id

Get single garment details.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Garment found |
| 401 | Unauthorized |
| 403 | Forbidden (not owner) |
| 404 | Garment not found |

**200 Response:** Single Garment object (see POST /garments response)

---

### PATCH /garments/:id

Update garment metadata.

**Request Body:** (all fields optional)

```typescript
{
  name?: string;
  category?: GarmentCategory;
  subcategory?: string;
  color?: string;
  brand?: string;
  size?: string;
  material?: string[];
  notes?: string;
  isFavorite?: boolean;
  tags?: string[];
  state?: GarmentState;
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Garment updated |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

**200 Response:** Updated Garment object

---

### DELETE /garments/:id

Soft-delete a garment.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Garment deleted |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

**200 Response:**

```typescript
{
  message: "Prenda eliminada exitosamente",
  id: string
}
```

Note: Garment is soft-deleted (state changed to "discarded"). Hard deletion occurs after 30 days via cleanup job.

---

### GET /garments/search

Full-text search across user's garments.

**Query Parameters:**

```typescript
{
  q: string;               // search query, min 2 chars
  page?: number;
  limit?: number;
  category?: GarmentCategory;
  color?: string;
  state?: GarmentState;
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Search results |
| 400 | Query too short |
| 401 | Unauthorized |

**200 Response:** Paginated Garment list (same as GET /garments)

---

### POST /garments/:id/upload

Upload garment image (multipart/form-data).

**Path Parameters:** `id: string` (UUID v4)

**Request:** `multipart/form-data`

```typescript
{
  image: File;  // JPEG, PNG, WebP; max 15MB; min 300x300px; max 4096x4096px
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Upload accepted, processing started |
| 400 | Invalid file type or size |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Garment not found |
| 413 | File too large |
| 429 | Rate limited |

**200 Response:**

```typescript
{
  id: string;
  processingStatus: "processing";
  imageUrl: string | null;
  thumbnailUrl: string | null;
  message: "Imagen recibida, procesamiento iniciado"
}
```

---

### GET /garments/:id/status

Get garment processing status.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Status info |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

**200 Response:**

```typescript
{
  id: string;
  processingStatus: ProcessingStatus;
  processingProgress: number;  // 0-100
  processingError: string | null;
  detectedAttributes: DetectedAttributes | null;
}
```

---

## Outfit Endpoints

### POST /outfits

Create a new outfit manually.

**Request Body:**

```typescript
{
  name: string;               // min 1, max 200 chars
  garments: string[];         // array of garment UUIDs, min 1, max 10
  occasion?: string;          // max 100 chars
  season?: "spring" | "summer" | "fall" | "winter";
  notes?: string;             // max 500 chars
  isFavorite?: boolean;
  tags?: string[];            // max 10 tags
}
```

**Validation Rules:**
- `garments`: all must belong to authenticated user and have state "available"
- At least one garment must be "tops" or "t-shirts" or "shirts" or "blouses" or "sweaters" or "dresses"

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | Outfit created |
| 400 | Validation error |
| 401 | Unauthorized |
| 404 | Garment not found |

**201 Response:**

```typescript
{
  id: string;
  userId: string;
  name: string;
  garments: Garment[];
  occasion: string | null;
  season: string | null;
  notes: string | null;
  isFavorite: boolean;
  tags: string[];
  previewUrl: string | null;
  generatedByAi: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

### GET /outfits

List user's outfits with pagination.

**Query Parameters:**

```typescript
{
  page?: number;
  limit?: number;
  occasion?: string;
  season?: string;
  isFavorite?: boolean;
  search?: string;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Outfits list |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  data: Outfit[];
  meta: PaginationMeta;
}
```

---

### GET /outfits/:id

Get single outfit with full garment details.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Outfit found |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

**200 Response:** Single Outfit object (see POST /outfits response)

---

### PATCH /outfits/:id

Update outfit metadata.

**Request Body:** (all fields optional)

```typescript
{
  name?: string;
  garments?: string[];
  occasion?: string;
  season?: "spring" | "summer" | "fall" | "winter";
  notes?: string;
  isFavorite?: boolean;
  tags?: string[];
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Outfit updated |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

---

### DELETE /outfits/:id

Soft-delete an outfit.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Outfit deleted |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

---

### POST /outfits/:id/generate

Generate an outfit preview image using AI (avatar + garments rendered together).

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 202 | Generation started |
| 400 | No avatar set or garments missing images |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Outfit not found |

**202 Response:**

```typescript
{
  id: string;
  status: "generating";
  message: "Generación de preview iniciada"
}
```

Progress can be tracked via WebSocket event `outfit:updated`.

---

### POST /outfits/recommend

Get AI-powered outfit recommendations.

**Request Body:**

```typescript
{
  occasion?: string;      // e.g. "casual", "formal", "deportivo"
  season?: string;        // "spring" | "summer" | "fall" | "winter"
  temperature?: number;   // celsius
  preferences?: {
    avoidColors?: string[];   // hex colors
    preferredCategories?: GarmentCategory[];
    maxGarments?: number;     // default: 5
    includeAccessories?: boolean;
  };
  count?: number;         // number of recommendations, default: 3, max: 10
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Recommendations |
| 400 | No available garments |
| 401 | Unauthorized |
| 429 | Rate limited |

**200 Response:**

```typescript
{
  recommendations: Array<{
    outfit: Outfit;
    score: number;              // 0-1 compatibility score
    reasons: string[];          // human-readable reasons
    alternativeGarments?: Garment[];  // alternatives for each slot
  }>;
  meta: {
    totalCombinations: number;
    processingTime: number;     // ms
  }
}
```

---

### GET /outfits/daily

Get today's recommended outfit (AI-selected).

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Daily outfit |
| 204 | No outfit available today |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  date: string;            // ISO 8601 date
  outfit: Outfit;
  recommendation: {
    reason: string;
    weatherNote: string | null;
    scheduled: boolean;    // user scheduled this
  }
}
```

---

## Avatar Endpoints

### POST /avatars

Create a new avatar profile.

**Request Body:**

```typescript
{
  name: string;              // min 1, max 100
  avatarUrl?: string;        // Ready Player Me URL
  bodyData?: BodyData;
  style?: AvatarStyle;
}

interface BodyData {
  height: number;            // cm, 100-250
  weight: number;            // kg, 30-300
  skinTone: string;          // hex color
  bodyShape: "ectomorph" | "mesomorph" | "endomorph" | "unknown";
  measurements?: {
    chest: number;           // cm
    waist: number;
    hips: number;
    inseam: number;
  };
}

type AvatarStyle = "realistic" | "stylized" | "cartoon";
```

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | Avatar created |
| 400 | Validation error |
| 401 | Unauthorized |
| 409 | Max avatars reached (3 per user) |

---

### GET /avatars/:id

Get avatar details.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Avatar found |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

**200 Response:**

```typescript
{
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  modelUrl: string | null;     // GLTF/GLB URL
  thumbnailUrl: string | null;
  bodyData: BodyData | null;
  style: AvatarStyle;
  version: number;
  processingStatus: "pending" | "generating" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  versions: AvatarVersion[];
}

interface AvatarVersion {
  version: number;
  modelUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}
```

---

### PATCH /avatars/:id

Update avatar metadata.

**Request Body:** (all fields optional)

```typescript
{
  name?: string;
  avatarUrl?: string;
  bodyData?: Partial<BodyData>;
  style?: AvatarStyle;
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Avatar updated |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

---

### DELETE /avatars/:id

Delete an avatar permanently.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Avatar deleted |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

**200 Response:**

```typescript
{
  message: "Avatar eliminado permanentemente",
  id: string
}
```

---

### POST /avatars/:id/generate

Generate 3D avatar from a body video.

**Path Parameters:** `id: string` (UUID v4)

**Request:** `multipart/form-data`

```typescript
{
  video: File;             // MP4, max 30s, max 200MB, min 480p, max 4K
  gender?: "male" | "female" | "other";
  height?: number;         // cm, optional override
}
```

**Video Requirements:**
- Duration: 5-30 seconds
- Resolution: min 480p (854x480), max 4K (3840x2160)
- Format: MP4 (H.264 codec)
- Lighting: well-lit, no harsh shadows
- Pose: standing straight, arms slightly away from body
- Background: plain, solid color preferred
- File size: max 200MB

**Responses:**

| Status | Description |
|--------|-------------|
| 202 | Generation started |
| 400 | Invalid video |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Avatar not found |
| 429 | Rate limited (1 per 5 min) |

**202 Response:**

```typescript
{
  id: string;
  status: "generating";
  estimatedTime: number;    // seconds
  message: "Generación de avatar iniciada"
}
```

---

## Calendar Endpoints

### GET /calendar

Get scheduled outfits for a date range.

**Query Parameters:**

```typescript
{
  startDate: string;    // ISO 8601 date, required
  endDate: string;      // ISO 8601 date, required, max 90 days from start
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Calendar entries |
| 400 | Invalid date range |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  entries: Array<{
    id: string;
    date: string;               // ISO 8601 date
    outfitId: string;
    outfit: Outfit;
    notes: string | null;
    isRecurring: boolean;
    recurringPattern: RecurringPattern | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

type RecurringPattern = "daily" | "weekly" | "monthly" | "weekdays" | "weekends";
```

---

### PATCH /calendar/:id

Update a calendar entry (change outfit, notes, or reschedule).

**Path Parameters:** `id: string` (UUID v4)

**Request Body:** (all fields optional)

```typescript
{
  outfitId?: string;
  date?: string;         // ISO 8601 date
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern | null;
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Entry updated |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Entry not found |

---

### GET /calendar/range

Get summary statistics for a date range.

**Query Parameters:**

```typescript
{
  startDate: string;     // ISO 8601 date
  endDate: string;       // ISO 8601 date, max 365 days
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Range summary |
| 400 | Invalid range |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  totalDays: number;
  scheduledDays: number;
  outfitFrequency: Record<string, number>;  // outfit ID -> count
  categoryFrequency: Record<GarmentCategory, number>;
  mostUsedOutfit: {
    outfitId: string;
    outfitName: string;
    timesUsed: number;
  };
  newOutfitsAdded: number;
}
```

---

## Notification Endpoints

### GET /notifications

Get paginated notifications for the current user.

**Query Parameters:**

```typescript
{
  page?: number;           // default: 1
  limit?: number;          // default: 20, max: 50
  type?: NotificationType;
  isRead?: boolean;
}

type NotificationType =
  | "garment_processed"
  | "garment_failed"
  | "outfit_recommended"
  | "avatar_generated"
  | "avatar_failed"
  | "calendar_reminder"
  | "sync_conflict"
  | "export_complete"
  | "welcome"
  | "tip"
  | "system";
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Notifications |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  data: Array<{
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, any> | null;    // contextual data
    isRead: boolean;
    createdAt: string;
  }>;
  meta: PaginationMeta;
  unreadCount: number;
}
```

---

### PATCH /notifications/:id/read

Mark notification as read.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Marked as read |
| 401 | Unauthorized |
| 404 | Not found |

**200 Response:**

```typescript
{
  id: string;
  isRead: true;
}
```

**Alternative:** Use `PATCH /notifications/read-all` without body to mark all as read.

---

### GET /notifications/settings

Get notification preference settings.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Settings |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  push: {
    enabled: boolean;
    garmentProcessed: boolean;
    outfitRecommended: boolean;
    avatarGenerated: boolean;
    calendarReminders: boolean;
    tips: boolean;
  };
  email: {
    enabled: boolean;
    weeklyReport: boolean;
    garmentProcessed: boolean;
    avatarGenerated: boolean;
  };
  inApp: {
    enabled: boolean;
    garmentProcessed: boolean;
    outfitRecommended: boolean;
    avatarGenerated: boolean;
    calendarReminders: boolean;
    tips: boolean;
    system: boolean;
  };
}
```

---

### PATCH /notifications/settings

Update notification preferences.

**Request Body:** (all fields optional)

```typescript
{
  push?: Partial<PushSettings>;
  email?: Partial<EmailSettings>;
  inApp?: Partial<InAppSettings>;
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Settings updated |
| 400 | Validation error |
| 401 | Unauthorized |

---

## Analytics Endpoints

### GET /analytics/garments

Garment-level analytics.

**Query Parameters:**

```typescript
{
  dateFrom?: string;     // ISO 8601
  dateTo?: string;       // ISO 8601
  granularity?: "day" | "week" | "month";
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Garment analytics |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  totalGarments: number;
  byCategory: Record<GarmentCategory, number>;
  byColor: Record<string, number>;       // hex -> count
  byState: Record<GarmentState, number>;
  byBrand: Record<string, number>;
  topMaterials: Array<{ material: string; count: number }>;
  processingSuccessRate: number;         // percentage
  averageProcessingTime: number;         // ms
  garmentsAddedOverTime: Array<{
    date: string;
    count: number;
  }>;
  mostFrequentlyWorn: Array<{
    garment: GarmentSummary;
    timesUsed: number;
  }>;
}
```

---

### GET /analytics/ai-precision

AI model performance metrics.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | AI precision data |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  categoryDetection: {
    accuracy: number;           // percentage
    confusionMatrix: Record<string, Record<string, number>>;
    totalPredictions: number;
  };
  colorDetection: {
    accuracy: number;
    averageDeviation: number;   // delta-E
  };
  recommendationAccuracy: {
    userRating: number;         // 1-5 average
    acceptanceRate: number;     // percentage
    totalRecommendations: number;
  };
  modelVersions: {
    detectron: string;
    classifier: string;
    colorExtractor: string;
  };
  lastTrainingDate: string | null;
}
```

---

### GET /analytics/usage

Platform usage analytics.

**Query Parameters:**

```typescript
{
  dateFrom?: string;
  dateTo?: string;
  granularity?: "day" | "week" | "month";
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Usage analytics |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  totalSessions: number;
  averageSessionDuration: number;      // seconds
  garmentsUploaded: number;
  outfitsCreated: number;
  outfitsGenerated: number;
  calendarEvents: number;
  featuresUsed: Array<{
    feature: string;
    count: number;
  }>;
  activeDays: number;                  // days with at least 1 action
  streakDays: number;                  // current consecutive active days
}
```

---

### GET /analytics/dashboard

Dashboard summary combining all analytics.

**Query Parameters:**

```typescript
{
  period?: "7d" | "30d" | "90d" | "1y";
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Dashboard data |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  summary: {
    totalGarments: number;
    totalOutfits: number;
    totalAvatars: number;
    scheduledDays: number;
    recentActivity: Array<{
      date: string;
      actions: number;
    }>;
  };
  trends: {
    garmentsTrend: "up" | "down" | "stable";
    outfitsTrend: "up" | "down" | "stable";
    usageTrend: "up" | "down" | "stable";
  };
  recommendations: Array<{
    type: "tip" | "alert" | "achievement";
    message: string;
    icon: string;
  }>;
  quickStats: {
    garmentsThisWeek: number;
    outfitsThisWeek: number;
    completionRate: number;           // percentage of calendar days with outfits
  };
}
```

---

## Storage Endpoints

### POST /storage/upload

Generate a signed upload URL for direct client-to-Cloudinary upload.

**Request Body:**

```typescript
{
  resourceType: "image" | "video" | "model";
  fileName: string;             // max 255 chars, alphanumeric + .ext
  fileSize: number;             // bytes
  mimeType: string;             // valid MIME type
  folder: string;               // storage folder path
}
```

**Validation Rules:**
- `fileSize`: images max 15MB, videos max 200MB, models max 50MB
- `mimeType`: must be in allowed list
- `folder`: must start with `users/{userId}/`

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Signed URL generated |
| 400 | Invalid file type or size |
| 401 | Unauthorized |
| 429 | Rate limited |

**200 Response:**

```typescript
{
  uploadUrl: string;       // signed URL for PUT upload
  publicUrl: string;       // URL after upload
  fields: Record<string, string>;   // additional form fields if needed
  expiresAt: string;       // ISO 8601, URL valid for 15 minutes
  fileId: string;          // storage reference ID
}
```

---

### GET /storage/signed-url

Generate a signed URL for reading a private file.

**Query Parameters:**

```typescript
{
  fileId: string;           // storage reference ID
  expiresIn?: number;       // seconds, default: 3600, max: 86400
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Signed URL |
| 401 | Unauthorized |
| 403 | Forbidden (not owner) |
| 404 | File not found |

**200 Response:**

```typescript
{
  signedUrl: string;
  expiresAt: string;
}
```

---

### DELETE /storage/delete

Delete a stored file.

**Request Body:**

```typescript
{
  fileId: string;             // storage reference ID
  permanent?: boolean;        // default: false; if true, skip trash
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | File deleted (or moved to trash) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | File not found |

---

## Export Endpoints

### POST /export/data

Request a full data export (GDPR compliance).

**Request Body:**

```typescript
{
  format: "json" | "csv";
  include: Array<"garments" | "outfits" | "avatars" | "calendar" | "analytics" | "settings">;
  dateRange?: {
    from?: string;
    to?: string;
  };
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 202 | Export started |
| 400 | Invalid format |
| 401 | Unauthorized |
| 429 | Rate limited (1 per 24h) |

**202 Response:**

```typescript
{
  id: string;
  status: "processing";
  estimatedSize: number;      // bytes
  estimatedTime: number;      // seconds
  message: "Exportación de datos iniciada"
}
```

---

### GET /export/status/:id

Check export job status.

**Path Parameters:** `id: string` (UUID v4)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Export status |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Export not found |

**200 Response:**

```typescript
{
  id: string;
  status: "processing" | "completed" | "failed";
  progress: number;             // 0-100
  downloadUrl: string | null;   // available when completed
  expiresAt: string | null;     // URL valid for 7 days
  error: string | null;
  createdAt: string;
}
```

---

## Consent Endpoints

### GET /consent

Get user's current consent preferences.

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Consent preferences |
| 401 | Unauthorized |

**200 Response:**

```typescript
{
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  privacyAccepted: boolean;
  privacyAcceptedAt: string | null;
  aiTrainingConsent: boolean;
  aiTrainingConsentAt: string | null;
  dataProcessingConsent: boolean;
  dataProcessingConsentAt: string | null;
  marketingConsent: boolean;
  marketingConsentAt: string | null;
  thirdPartySharing: boolean;
  thirdPartySharingAt: string | null;
  consentVersion: string;
}
```

---

### PATCH /consent

Update consent preferences.

**Request Body:**

```typescript
{
  aiTrainingConsent?: boolean;
  marketingConsent?: boolean;
  thirdPartySharing?: boolean;
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Consent updated |
| 400 | Validation error |
| 401 | Unauthorized |
| 409 | Terms not accepted (cannot change core consents) |

---

## DTO Definitions

### PaginationMeta

```typescript
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### GarmentSummary

```typescript
interface GarmentSummary {
  id: string;
  name: string;
  category: GarmentCategory;
  color: string | null;
  thumbnailUrl: string | null;
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, string[]> | null;  // field -> errors
    requestId: string;
    timestamp: string;
  }
}
```
