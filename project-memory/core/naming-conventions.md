# Closet Inteligente Digital — Naming Conventions

---

> All code contributors MUST follow these conventions. Pull requests that violate naming conventions will be rejected. These rules are enforced via ESLint rules where possible.

---

## 1. Database Naming (PostgreSQL / Supabase / TypeORM)

### 1.1 General Rules

| Rule | Convention | Example |
|---|---|---|
| Case | `snake_case` only | `user_profile`, `created_at` |
| Characters | a-z, 0-9, underscore only | No hyphens, no capitals |
| Max length | 63 characters (PostgreSQL limit) | — |
| Abbreviations | Avoid — spell out fully | Use `garment` not `gmt` |
| Reserved words | Never use PostgreSQL reserved words | Avoid `user` (use `app_user`), `group`, `order`, `table` |

### 1.2 Tables

| Rule | Convention | Example |
|---|---|---|
| Naming | Plural nouns | `users`, `garments`, `outfits` |
| Join tables | Both table names in alphabetical order, singular, joined by `_` | `garment_outfit`, `user_team` |
| Junction with metadata | Same as join but descriptive | `outfit_garments` |
| Enum tables | Same as the enum name, lowercase | `garment_type` |
| Temporary tables | Prefix `tmp_` | `tmp_import_batch_20240501` |

### 1.3 Columns

| Rule | Convention | Example |
|---|---|---|
| Primary key | Always `id` (UUID type) | `id` |
| Foreign key | `{referenced_table_singular}_id` | `user_id`, `garment_id` |
| Timestamps | `created_at`, `updated_at`, `deleted_at` | — |
| Soft delete | `deleted_at` (nullable timestamp) | — |
| Boolean | Prefix `is_`, `has_`, `can_` | `is_active`, `has_been_worn` |
| Counters | Suffix `_count` | `wear_count`, `view_count` |
| Monetary | Suffix `_amount_cents` (store in cents) | `price_amount_cents` |
| Currency | Suffix `_currency` (ISO 4217) | `price_currency` |
| JSON/JSONB | Suffix `_data` or `_config` | `metadata_data`, `style_config` |
| URL | Suffix `_url` | `image_url`, `avatar_url` |
| Status | Use descriptive name, not `status` alone | `garment_state`, `sync_status` |
| Order | Suffix `_order` or `position` | `display_order`, `position` |

### 1.4 Constraints

| Constraint Type | Prefix | Format |
|---|---|---|
| Primary Key | `pk_` | `pk_{table_name}` |
| Unique | `uq_` | `uq_{table_name}_{column(s)}` |
| Foreign Key | `fk_` | `fk_{referencing_table}_{referenced_table}` |
| Index | `idx_` | `idx_{table_name}_{column(s)}` |
| Check | `ck_` | `ck_{table_name}_{condition}` |
| Default | `df_` | `df_{table_name}_{column_name}` |

**Examples:**
- `pk_users` — primary key on users
- `uq_users_email` — unique email on users
- `fk_garments_users` — foreign key garments → users
- `idx_garments_user_id_created_at` — compound index
- `ck_garments_price_amount_cents_positive` — check constraint

### 1.5 Indexes

| Rule | Convention | Example |
|---|---|---|
| Standard B-tree | `idx_{table}_{column(s)}` | `idx_garments_user_id` |
| Unique index | `uq_{table}_{column(s)}` (same as unique constraint) | `uq_users_email` |
| Partial index | Append condition | `idx_garments_user_id_active` |
| GIN index (JSONB) | Append `_gin` | `idx_garments_attributes_gin` |
| Full-text search | Append `_fts` | `idx_garments_search_fts` |

### 1.6 Sequences

| Convention | Example |
|---|---|
| `{table}_{column}_seq` | `users_id_seq` (only if using serial/bigserial, prefer UUID) |

### 1.7 Migrations

| Convention | Example |
|---|---|
| `{YYYY}{MM}{DD}{HH}{MM}_{description}` | `202405011200_create_users_table` |
| Rollback | `{YYYY}{MM}{DD}{HH}{MM}_{description}_rollback` | `202405011200_create_users_table_rollback` |

---

## 2. Backend Naming (NestJS / TypeScript)

### 2.1 General Rules

| Rule | Convention | Example |
|---|---|---|
| Language | TypeScript in strict mode | — |
| Indentation | 2 spaces | — |
| Semicolons | Required | — |
| Quotes | Single quotes preferred | `'hello'` |
| Trailing commas | ES5 (objects, arrays) | — |

### 2.2 Files & Directories

| Artifact | Convention | Pattern | Example |
|---|---|---|---|
| Module | `kebab-case` | `{name}.module.ts` | `user.module.ts` |
| Controller | `kebab-case` | `{name}.controller.ts` | `user.controller.ts` |
| Service | `kebab-case` | `{name}.service.ts` | `user.service.ts` |
| DTO | `kebab-case` | `{name}.dto.ts` | `create-user.dto.ts` |
| Entity | `kebab-case` | `{name}.entity.ts` | `user.entity.ts` |
| Guard | `kebab-case` | `{name}.guard.ts` | `jwt-auth.guard.ts` |
| Interceptor | `kebab-case` | `{name}.interceptor.ts` | `logging.interceptor.ts` |
| Pipe | `kebab-case` | `{name}.pipe.ts` | `validation.pipe.ts` |
| Filter | `kebab-case` | `{name}.filter.ts` | `http-exception.filter.ts` |
| Middleware | `kebab-case` | `{name}.middleware.ts` | `auth.middleware.ts` |
| Decorator | `kebab-case` | `{name}.decorator.ts` | `current-user.decorator.ts` |
| Strategy | `kebab-case` | `{name}.strategy.ts` | `jwt.strategy.ts` |
| Test (unit) | `kebab-case` | `{name}.spec.ts` | `user.service.spec.ts` |
| Test (e2e) | `kebab-case` | `{name}.e2e-spec.ts` | `user.e2e-spec.ts` |
| Index barrel | `kebab-case` | `index.ts` | `index.ts` |
| Config | `kebab-case` | `{name}.config.ts` | `database.config.ts` |
| Interface | `kebab-case` | `{name}.interface.ts` | `user.interface.ts` |
| Type | `kebab-case` | `{name}.type.ts` | `garment.type.ts` |
| Enum | `kebab-case` | `{name}.enum.ts` | `garment-type.enum.ts` |

### 2.3 Classes

| Rule | Convention | Example |
|---|---|---|
| Classes | `PascalCase` | `UserService`, `CreateUserDto` |
| DTOs | Suffix `Dto` | `CreateUserDto`, `UpdateGarmentDto` |
| Entities | Suffix `Entity` (optional) | `UserEntity`, `GarmentEntity` |
| Guards | Suffix `Guard` | `JwtAuthGuard` |
| Interceptors | Suffix `Interceptor` | `LoggingInterceptor` |
| Pipes | Suffix `Pipe` | `ValidationPipe` |
| Filters | Suffix `Filter` | `HttpExceptionFilter` |
| Decorators | Prefix `@` in code | `@CurrentUser()` |

### 2.4 Methods & Variables

| Rule | Convention | Example |
|---|---|---|
| Methods | `camelCase` | `findAll()`, `createUser()` |
| Variables | `camelCase` | `userId`, `garmentList` |
| Private members | Prefix `_` | `_cacheService`, `_calculateTotal()` |
| Boolean variables | Prefix `is`, `has`, `can`, `should` | `isActive`, `hasPermission` |
| Constants (module-level) | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE` |
| Async functions | Use `async/await` | `async findAll(): Promise<Garment[]>` |

### 2.5 Route / Endpoint Naming

| Rule | Convention | Example |
|---|---|---|
| Controller prefix | `api/{version}/{resource}` | `api/v1/garments` |
| Collection | Plural noun | `GET /api/v1/garments` |
| Single resource | `/:id` | `GET /api/v1/garments/:id` |
| Nested resource | `/:parentId/:child` | `GET /api/v1/users/:userId/garments` |
| Actions | Verbs, not nouns | `POST /api/v1/garments`, `PATCH /api/v1/garments/:id` |
| Custom actions | Verb after resource | `POST /api/v1/garments/:id/clone` |
| Query params | camelCase | `?sortBy=createdAt&order=desc` |

### 2.6 NestJS Module Organization

```
src/
  modules/
    user/
      user.module.ts
      user.controller.ts
      user.service.ts
      dto/
        create-user.dto.ts
        update-user.dto.ts
      entities/
        user.entity.ts
      interfaces/
        user.interface.ts
      guards/
        user-owner.guard.ts
      decorators/
        current-user.decorator.ts
      user.service.spec.ts
      user.controller.spec.ts
```

---

## 3. Frontend Naming (React / Next.js)

### 3.1 Files & Directories

| Artifact | Convention | Pattern | Example |
|---|---|---|---|
| Page | `kebab-case` | `{name}/page.tsx` | `wardrobe/page.tsx` |
| Layout | `kebab-case` | `{name}/layout.tsx` | `wardrobe/layout.tsx` |
| Loading | `kebab-case` | `{name}/loading.tsx` | `wardrobe/loading.tsx` |
| Error | `kebab-case` | `{name}/error.tsx` | `wardrobe/error.tsx` |
| Component | `PascalCase` | `{Name}.tsx` | `GarmentCard.tsx` |
| Hook | `camelCase` | `use{Name}.ts` | `useGarments.ts` |
| Context | `camelCase` | `{Name}Context.tsx` | `AuthContext.tsx` |
| Provider | `PascalCase` | `{Name}Provider.tsx` | `AuthProvider.tsx` |
| Store (Zustand) | `camelCase` | `use{Name}Store.ts` | `useWardrobeStore.ts` |
| Utility | `camelCase` | `{name}.ts` | `formatDate.ts` |
| Type/Interface | `PascalCase` | `{name}.types.ts` | `garment.types.ts` |
| Constant | `UPPER_SNAKE_CASE` | `{name}.constants.ts` | `API.constants.ts` |
| Style (if any) | `kebab-case` | `{name}.module.css` | `garment-card.module.css` |

### 3.2 Components

| Rule | Convention | Example |
|---|---|---|
| React components | `PascalCase` | `GarmentCard`, `OutfitBuilder` |
| File name matches export | One component per file | `GarmentCard.tsx` exports `GarmentCard` |
| Default export | Named export preferred over default | `export function GarmentCard()` |
| Props interface | `{ComponentName}Props` | `GarmentCardProps` |
| Event handlers | Prefix `handle` | `handleClick`, `handleSubmit` |
| Destructuring | Always destructure props | `function GarmentCard({ garment, onSelect }: GarmentCardProps)` |

### 3.3 Hooks

| Rule | Convention | Example |
|---|---|---|
| Custom hooks | Prefix `use` | `useGarments`, `useWardrobe` |
| Hook file named after hook | `camelCase` | `useGarments.ts` |
| Return value | Always return object (not array) | `return { garments, isLoading, error }` |

### 3.4 Pages & Routes (App Router)

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing / Home |
| `/wardrobe` | `app/wardrobe/page.tsx` | Wardrobe grid |
| `/wardrobe/[id]` | `app/wardrobe/[id]/page.tsx` | Garment detail |
| `/wardrobe/new` | `app/wardrobe/new/page.tsx` | Add garment |
| `/outfits` | `app/outfits/page.tsx` | Outfits list |
| `/outfits/[id]` | `app/outfits/[id]/page.tsx` | Outfit detail |
| `/outfits/builder` | `app/outfits/builder/page.tsx` | Outfit builder |
| `/avatar` | `app/avatar/page.tsx` | Avatar management |
| `/calendar` | `app/calendar/page.tsx` | Calendar view |
| `/analytics` | `app/analytics/page.tsx` | Wardrobe analytics |
| `/profile` | `app/profile/page.tsx` | User profile |
| `/auth/login` | `app/auth/login/page.tsx` | Login |
| `/auth/register` | `app/auth/register/page.tsx` | Register |
| `/api/...` | `app/api/.../route.ts` | API route handlers |
| `/admin/...` | `app/admin/.../page.tsx` | Admin dashboard |

### 3.5 Zustand Store Naming

```typescript
// use{Feature}Store
export const useWardrobeStore = create<WardrobeStore>()((set, get) => ({
  // state
  garments: [],
  selectedGarmentId: null,
  isLoading: false,
  // actions
  setGarments: (garments) => set({ garments }),
  selectGarment: (id) => set({ selectedGarmentId: id }),
}))
```

---

## 4. Python Naming (AI / ML Microservice)

### 4.1 General Rules

| Rule | Convention | Example |
|---|---|---|
| Style | `snake_case` for ALL identifiers | — |
| Indentation | 4 spaces | — |
| Max line length | 88 characters (Black default) | — |
| Quotes | Double quotes preferred | `"hello"` |

### 4.2 Identifiers

| Artifact | Convention | Example |
|---|---|---|
| Modules | `snake_case` | `garment_detector.py` |
| Classes | `PascalCase` | `GarmentDetector`, `OutfitRecommender` |
| Functions | `snake_case` | `detect_garment()`, `generate_outfits()` |
| Methods | `snake_case` | `self._preprocess_image()` |
| Variables | `snake_case` | `garment_type`, `confidence_score` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_IMAGE_SIZE`, `DEFAULT_CONFIDENCE` |
| Private | Prefix `_` | `_internal_method()`, `_private_field` |
| Protected | Prefix `_` (Python convention) | `_protected_method()` |
| Dunder | `__name__` | `__init__`, `__call__` |
| Type hints | Always use | `def detect(image: np.ndarray) -> dict[str, float]:` |

### 4.3 Files & Organization

```
ai-service/
  app.py                    # FastAPI entry point
  config.py                 # Configuration
  models/                   # Model definitions
    __init__.py
    garment_detector.py
    outfit_recommender.py
    body_measurement.py
    color_analyzer.py
    fabric_recognizer.py
  schemas/                  # Pydantic schemas
    __init__.py
    garment.py
    outfit.py
    avatar.py
  services/                 # Business logic
    __init__.py
    detection_service.py
    recommendation_service.py
    measurement_service.py
  utils/                    # Utilities
    __init__.py
    image_utils.py
    file_utils.py
    metrics.py
  tests/                    # Tests
    test_detector.py
    test_recommender.py
  requirements.txt
  Dockerfile
```

### 4.4 Docstrings

```python
def detect_garments(
    image: np.ndarray,
    confidence_threshold: float = 0.5,
) -> list[dict[str, Any]]:
    """Detect garments in an image using Detectron2.

    Args:
        image: RGB image as numpy array (H, W, 3).
        confidence_threshold: Minimum confidence score (0.0 to 1.0).

    Returns:
        List of detected garments, each with keys:
            - bbox: [x1, y1, x2, y2] bounding box
            - garment_type: str (e.g., "shirt", "dress")
            - confidence: float

    Raises:
        ValueError: If image is empty or invalid format.
    """
```

---

## 5. TypeScript Types & Interfaces

### 5.1 Interfaces

| Rule | Convention | Example |
|---|---|---|
| Interfaces | Prefix `I` | `IUser`, `IGarment`, `IOutfit` |
| Props interfaces | `{ComponentName}Props` | `GarmentCardProps` |
| Generic params | Single uppercase letter | `IResponse<T>` |
| Method signatures | Use ; separator not , | `{ id: string; name: string }` |
| Readonly | Use `readonly` modifier | `readonly id: string` |

```typescript
interface IUser {
  readonly id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IGarment {
  readonly id: string;
  userId: string;
  name: string;
  garmentType: EGarmentType;
  imageUrl: string;
  createdAt: Date;
}
```

### 5.2 Types

| Rule | Convention | Example |
|---|---|---|
| Type aliases | `PascalCase` | `GarmentListResponse`, `ApiError` |
| Union types | `PascalCase` | `Result<T, E>` |
| Utility types | Use built-in | `Pick<IGarment, 'id' | 'name'>` |

```typescript
type GarmentListResponse = {
  data: IGarment[];
  total: number;
  page: number;
  pageSize: number;
};

type ApiError = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };
```

---

## 6. Enums

| Rule | Convention | Example |
|---|---|---|
| Enum name | `PascalCase` | `EGarmentType`, `EOutfitType` |
| Enum values | `PascalCase` | `Top`, `Bottom`, `Dress` |
| File name | `kebab-case` | `garment-type.enum.ts` |
| Const enums | Use `const enum` when possible | — |

```typescript
export const enum EGarmentType {
  Top = 'Top',
  Bottom = 'Bottom',
  Dress = 'Dress',
  Outerwear = 'Outerwear',
  Footwear = 'Footwear',
  Accessory = 'Accessory',
  Bag = 'Bag',
  Jewelry = 'Jewelry',
  Headwear = 'Headwear',
  Swimwear = 'Swimwear',
  Lingerie = 'Lingerie',
  Other = 'Other',
}

export const enum ESeason {
  Spring = 'Spring',
  Summer = 'Summer',
  Fall = 'Fall',
  Winter = 'Winter',
  All = 'All',
}
```

### 6.1 Database Enums (PostgreSQL)

```sql
CREATE TYPE garment_type AS ENUM (
  'Top', 'Bottom', 'Dress', 'Outerwear', 'Footwear',
  'Accessory', 'Bag', 'Jewelry', 'Headwear',
  'Swimwear', 'Lingerie', 'Other'
);

CREATE TYPE garment_state AS ENUM (
  'Active', 'Archived', 'Donated', 'Sold', 'Loaned', 'Lost', 'Damaged'
);

CREATE TYPE outfit_type AS ENUM (
  'Casual', 'Business', 'Formal', 'Sport', 'Evening',
  'Travel', 'Beach', 'Date', 'Interview', 'Other'
);
```

> Note: TypeScript enums mirror PostgreSQL enums. The TS enum values (strings) are used when inserting/querying the DB.

---

## 7. Constants

| Scope | Convention | Example |
|---|---|---|
| Module-level | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE_MB = 10` |
| Object constant | `UPPER_SNAKE_CASE` with `as const` | `const API_ENDPOINTS = { ... } as const` |
| Config values | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` |
| Magic numbers | Never — always named constant | `const ACCESS_TOKEN_EXPIRY_SECONDS = 900` |

```typescript
// config/constants.ts
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const GARMENT_PAGINATION_DEFAULT_LIMIT = 20;

export const API_ENDPOINTS = {
  GARMENTS: '/api/v1/garments',
  OUTFITS: '/api/v1/outfits',
  AVATAR: '/api/v1/avatar',
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
  },
} as const;
```

---

## 8. CSS Classes

| Rule | Convention | Example |
|---|---|---|
| Primary styling | Tailwind utility classes only | `className="flex items-center gap-2 p-4"` |
| Component extraction | Use React components, not CSS classes | `<Card>`, `<Button>` |
| Tailwind `@apply` | Only in component files, sparingly | — |
| Custom CSS | Only for overrides; never global styles | — |
| Animations | Tailwind `animate-` classes or Framer Motion | `animate-fade-in` |
| Responsive | Mobile-first; Tailwind breakpoints | `md:flex lg:grid-cols-3` |
| Dark mode | Tailwind `dark:` variant | `dark:bg-gray-900` |
| Z-index | Tailwind `z-{value}` classes | `z-50` for modals |

---

## 9. Git Branches

### 9.1 Branch Naming

| Branch Type | Pattern | Example |
|---|---|---|
| Feature | `feature/{type}-{description}` | `feature/feat-garment-upload` |
| Bug fix | `fix/{type}-{description}` | `fix/auth-refresh-token` |
| Hotfix | `hotfix/{type}-{description}` | `hotfix/critical-payment-bug` |
| Chore | `chore/{type}-{description}` | `chore/update-dependencies` |
| Refactor | `refactor/{type}-{description}` | `refactor/state-management` |
| Docs | `docs/{type}-{description}` | `docs/api-authentication` |
| Release | `release/{version}` | `release/v1.2.0` |
| Experimental | `experiment/{description}` | `experiment/three-js-upgrade` |

### 9.2 Commit Messages

- Format: `{type}({scope}): {description}`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `build`
- Scope: Module or feature area (optional)
- Description: Imperative, lowercase, no period, max 72 chars

```
feat(garment): add AI-powered garment detection on upload
fix(auth): resolve refresh token race condition
docs(api): update garment endpoint documentation
chore(deps): upgrade next.js to 14.2.0
```

---

## 10. API Routes

| Rule | Convention | Example |
|---|---|---|
| Format | `kebab-case` | `/api/v1/garment-detection` |
| Versioned | Prefix `api/v{major}` | `/api/v1/garments` |
| Nouns, not verbs | Use resource names | `/garments` not `/getGarments` |
| Plural | Collection resources | `/garments`, `/outfits` |
| Single | `/resources/:id` | `/garments/:garmentId` |
| Nesting | Max 2 levels deep | `/users/:userId/garments` |
| Query params | `camelCase` | `?sortBy=createdAt` |
| Pagination | `page` and `pageSize` | `?page=1&pageSize=20` |

### Allowed API Route Examples

| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/garments` | List user's garments |
| POST | `/api/v1/garments` | Create a garment |
| GET | `/api/v1/garments/:id` | Get garment details |
| PATCH | `/api/v1/garments/:id` | Update garment |
| DELETE | `/api/v1/garments/:id` | Delete garment |
| POST | `/api/v1/garments/:id/clone` | Clone a garment |
| POST | `/api/v1/garments/:id/images` | Add image to garment |
| GET | `/api/v1/garments/:id/analytics` | Get garment analytics |
| GET | `/api/v1/outfits` | List outfits |
| POST | `/api/v1/outfits` | Create outfit |
| GET | `/api/v1/outfits/:id` | Get outfit detail |
| GET | `/api/v1/outfits/:id/weather-check` | Check outfit weather fit |
| POST | `/api/v1/avatar/generate` | Generate 3D avatar |
| GET | `/api/v1/calendar/events` | List calendar events |
| POST | `/api/v1/calendar/sync` | Sync calendar |
| GET | `/api/v1/analytics/wardrobe` | Wardrobe analytics |
| GET | `/api/v1/analytics/sustainability` | Sustainability metrics |

---

## 11. Event Names (Socket.IO / NestJS EventEmitter)

### 11.1 Format

```
{namespace}:{event}
```

All lowercase with kebab-case segments.

### 11.2 Standard Events

| Namespace | Event | Direction | Description |
|---|---|---|---|
| `garment` | `created` | Server → Client | Garment added |
| `garment` | `updated` | Server → Client | Garment updated |
| `garment` | `deleted` | Server → Client | Garment removed |
| `outfit` | `created` | Server → Client | Outfit created |
| `outfit` | `updated` | Server → Client | Outfit updated |
| `outfit` | `deleted` | Server → Client | Outfit removed |
| `outfit` | `recommended` | Server → Client | New recommendation |
| `avatar` | `generation-started` | Server → Client | Avatar gen started |
| `avatar` | `generation-complete` | Server → Client | Avatar gen done |
| `avatar` | `generation-failed` | Server → Client | Avatar gen failed |
| `sync` | `started` | Server → Client | Sync started |
| `sync` | `progress` | Server → Client | Sync progress update |
| `sync` | `completed` | Server → Client | Sync completed |
| `sync` | `conflict` | Server → Client | Sync conflict detected |
| `notification` | `new` | Server → Client | New notification |
| `ai` | `detection-complete` | Server → Client | AI detection done |
| `ai` | `recommendation-ready` | Server → Client | AI outfit ready |
| `calendar` | `event-created` | Server → Client | Calendar event added |
| `calendar` | `event-updated` | Server → Client | Calendar event updated |
| `analytics` | `update` | Server → Client | Analytics data updated |
| `user` | `online` | Client → Server | User came online |
| `user` | `offline` | Client → Server | User went offline |
| `user` | `typing` | Client → Server | User typing (future chat) |
| `system` | `maintenance` | Server → Client | Maintenance notification |
| `system` | `error` | Server → Client | System error |

---

## 12. Environment Variables

### 12.1 Format

```
UPPER_SNAKE_CASE with prefix:
  NEXT_PUBLIC_*  → Frontend (exposed to browser)
  CID_*          → Backend (NestJS)
  AI_*           → AI microservice
```

### 12.2 Frontend (Next.js — Public)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (public) |
| `NEXT_PUBLIC_APP_URL` | Application base URL |
| `NEXT_PUBLIC_FCM_VAPID_KEY` | Firebase Cloud Messaging VAPID key |
| `NEXT_PUBLIC_READER_PLAYER_ME_API_KEY` | Ready Player Me API key (public) |

### 12.3 Backend (NestJS)

| Variable | Description |
|---|---|
| `CID_PORT` | Server port (default 4000) |
| `CID_NODE_ENV` | Environment (development/production/staging) |
| `CID_DATABASE_URL` | PostgreSQL connection string |
| `CID_REDIS_URL` | Redis connection string |
| `CID_JWT_ACCESS_SECRET` | JWT signing secret |
| `CID_JWT_REFRESH_SECRET` | JWT refresh secret |
| `CID_JWT_ACCESS_EXPIRY` | Access token TTL (default: 15m) |
| `CID_JWT_REFRESH_EXPIRY` | Refresh token TTL (default: 7d) |
| `CID_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CID_CLOUDINARY_API_KEY` | Cloudinary API key |
| `CID_CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CID_SUPABASE_SERVICE_KEY` | Supabase service_role key |
| `CID_SUPABASE_JWT_SECRET` | Supabase JWT secret (for verification) |
| `CID_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `CID_GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `CID_GOOGLE_CALLBACK_URL` | Google OAuth callback |
| `CID_APPLE_CLIENT_ID` | Apple OAuth client ID |
| `CID_APPLE_TEAM_ID` | Apple team ID |
| `CID_APPLE_KEY_ID` | Apple key ID |
| `CID_APPLE_PRIVATE_KEY` | Apple private key |
| `CID_FCM_PROJECT_ID` | Firebase project ID |
| `CID_FCM_PRIVATE_KEY` | Firebase service account private key |
| `CID_FCM_CLIENT_EMAIL` | Firebase service account email |
| `CID_RATE_LIMIT_TTL` | Rate limit window (default: 60s) |
| `CID_RATE_LIMIT_MAX` | Max requests per window (default: 100) |
| `CID_CORS_ORIGINS` | Allowed CORS origins (comma-separated) |
| `CID_SENTRY_DSN` | Sentry DSN (server) |
| `CID_LOG_LEVEL` | Logging level (debug/info/warn/error) |
| `CID_AI_SERVICE_URL` | AI microservice base URL |
| `CID_AI_SERVICE_API_KEY` | AI service API key |
| `CID_SYNC_CONFLICT_STRATEGY` | Conflict resolution (last-write-wins) |

### 12.4 AI Microservice (Python)

| Variable | Description |
|---|---|
| `AI_PORT` | Server port (default 5000) |
| `AI_MODEL_PATH` | Path to model weights |
| `AI_DETECTION_CONFIDENCE` | Default confidence threshold |
| `AI_CUDA_ENABLED` | Enable CUDA inference |
| `AI_REDIS_URL` | Redis connection for jobs |
| `AI_LOG_LEVEL` | Logging level |
| `AI_API_KEY` | API key for service-to-service auth |
| `AI_MAX_IMAGE_SIZE` | Max image dimensions |
| `AI_TORCH_COMPILE` | Enable torch.compile optimization |

---

## 13. File & Folder Structure Naming Summary

```
project-root/
  apps/
    web/                          # Next.js frontend
      app/                        # App Router pages
        (marketing)/              # Route group: marketing pages
        (dashboard)/              # Route group: authenticated pages
        api/                      # API route handlers
        ...
      components/                 # Shared components
        ui/                       # Base UI components (Button, Card, etc.)
        garments/                 # Garment-related components
        outfits/                  # Outfit-related components
        avatar/                   # Avatar-related components
        calendar/                 # Calendar-related components
        analytics/                # Analytics-related components
        layout/                   # Layout components (Header, Sidebar, etc.)
      hooks/                      # Custom React hooks
      lib/                        # Utility functions, API client
      stores/                     # Zustand stores
      types/                      # TypeScript types/interfaces/enums
      constants/                  # Constants
      public/                     # Static assets
    api/                          # NestJS backend
      src/
        modules/                  # Feature modules
          auth/
          user/
          garment/
          outfit/
          avatar/
          calendar/
          notification/
          analytics/
          sync/
          ai-gateway/
        common/                   # Shared utilities
          decorators/
          filters/
          guards/
          interceptors/
          pipes/
          dto/
          interfaces/
          constants/
        config/                   # Configuration
        database/                 # Database config, migrations
      test/                       # E2E tests
    ai/                           # Python AI microservice
      app.py
      models/
      schemas/
      services/
      utils/
      tests/
    docs/                         # Documentation
      api/                        # API docs
      architecture/               # Architecture docs
  packages/                       # Shared packages
    shared/                       # Shared types, constants, utils
    eslint-config/                # ESLint configuration
    tsconfig/                     # Shared TypeScript configs
  docker/                         # Docker configs
    Dockerfile.web
    Dockerfile.api
    Dockerfile.ai
    docker-compose.yml
  .github/
    workflows/                    # GitHub Actions
```

---

## 14. Enforcing Conventions

| Rule | Enforcement |
|---|---|
| ESLint | `@typescript-eslint/naming-convention` rule |
| Prettier | Consistent formatting |
| Husky + lint-staged | Pre-commit hook: lint + format staged files |
| Commitlint | Enforce conventional commit format |
| Danger.js | PR checks for naming violations |
| Code review | Manual review with checklist (see Coding Standards) |
| CI pipeline | Fail build on lint error |
