# Routes

## Overview

Next.js 14 App Router with TypeScript.
All routes are in `src/app/` following the App Router conventions.

---

## Complete Route Structure

```
/                                    # HomePage (dashboard)
/closet                              # ClosetPage - garment grid
/closet/new                          # GarmentCreatePage - add garment form
/closet/[id]                         # GarmentDetailPage - garment detail
/closet/[id]/edit                    # GarmentEditPage - edit form

/outfits                             # OutfitPage - outfit grid
/outfits/new                         # OutfitCreatePage - create outfit
/outfits/[id]                        # OutfitDetailPage - outfit detail
/outfits/[id]/edit                   # OutfitEditPage - edit outfit
/outfits/recommendations             # RecommendationPage - AI suggestions

/calendar                            # CalendarPage - planner

/avatar                              # AvatarPage - avatar list
/avatar/[id]                         # AvatarDetailPage - avatar detail

/profile                             # ProfilePage - user profile

/analytics                           # AnalyticsPage - statistics

/settings                            # SettingsPage - app settings
/settings/notifications              # NotificationSettingsPage
/settings/privacy                    # PrivacySettingsPage
/settings/consent                    # ConsentPage

/auth/login                          # LoginPage
/auth/register                       # RegisterPage
/auth/forgot-password                # ForgotPasswordPage
/auth/reset-password                 # ResetPasswordPage

/notifications                       # NotificationListPage

/export                              # ExportPage - data export request

/500                                 # ErrorPage - server error
/404                                 # NotFoundPage - not found
```

---

## Route Groups

### `(auth)` Group

**Folder:** `src/app/(auth)/`

**Layout:** AuthLayout (centered card, no sidebar)

**Routes:**
| Route | Component | Public | Description |
|-------|-----------|--------|-------------|
| `/auth/login` | LoginPage | Yes | Email/password login |
| `/auth/register` | RegisterPage | Yes | New user registration |
| `/auth/forgot-password` | ForgotPasswordPage | Yes | Password reset request |
| `/auth/reset-password` | ResetPasswordPage | Yes | Set new password |

### `(dashboard)` Group

**Folder:** `src/app/(dashboard)/`

**Layout:** DashboardLayout (sidebar + topbar + content)

**Routes:**
| Route | Component | Public | Auth Required |
|-------|-----------|--------|---------------|
| `/` | HomePage | No | Yes |
| `/closet` | ClosetPage | No | Yes |
| `/closet/new` | GarmentCreatePage | No | Yes |
| `/closet/[id]` | GarmentDetailPage | No | Yes |
| `/closet/[id]/edit` | GarmentEditPage | No | Yes |
| `/outfits` | OutfitPage | No | Yes |
| `/outfits/new` | OutfitCreatePage | No | Yes |
| `/outfits/[id]` | OutfitDetailPage | No | Yes |
| `/outfits/[id]/edit` | OutfitEditPage | No | Yes |
| `/outfits/recommendations` | RecommendationPage | No | Yes |
| `/calendar` | CalendarPage | No | Yes |
| `/avatar` | AvatarPage | No | Yes |
| `/avatar/[id]` | AvatarDetailPage | No | Yes |
| `/profile` | ProfilePage | No | Yes |
| `/analytics` | AnalyticsPage | No | Yes |
| `/settings` | SettingsPage | No | Yes |
| `/settings/notifications` | NotificationSettingsPage | No | Yes |
| `/settings/privacy` | PrivacySettingsPage | No | Yes |
| `/settings/consent` | ConsentPage | No | Yes |
| `/notifications` | NotificationListPage | No | Yes |
| `/export` | ExportPage | No | Yes |

---

## Route Guards

### AuthGuard (middleware)

**File:** `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/_next',
  '/api',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // If authenticated and trying to access auth pages, redirect to dashboard
    if (token && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protect all dashboard routes
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};
```

### Route Permission Guards (in-page)

```typescript
// For route-level data access checks
// Example: Only allow access to own garments
async function GarmentDetailPage({ params }: { params: { id: string } }) {
  const garment = await api.getGarment(params.id);

  if (!garment) {
    notFound();
  }

  // Ownership check happens at API level
  return <GarmentDetail garment={garment} />;
}
```

---

## Dynamic Routes

### `src/app/(dashboard)/closet/[id]/page.tsx`

```typescript
interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function GarmentDetailPage({ params, searchParams }: PageProps) {
  const garment = await api.getGarment(params.id);
  // Render detail view
}
```

### `src/app/(dashboard)/closet/[id]/edit/page.tsx`

```typescript
interface PageProps {
  params: { id: string };
}

export default async function GarmentEditPage({ params }: PageProps) {
  const garment = await api.getGarment(params.id);
  // Render edit form
}
```

### `src/app/(dashboard)/outfits/[id]/page.tsx`

```typescript
interface PageProps {
  params: { id: string };
  searchParams: { view?: 'detail' | 'preview' | 'schedule' };
}

export default async function OutfitDetailPage({ params, searchParams }: PageProps) {
  const outfit = await api.getOutfit(params.id);
  // Render outfit detail
}
```

### `src/app/(dashboard)/avatar/[id]/page.tsx`

```typescript
interface PageProps {
  params: { id: string };
}

export default async function AvatarDetailPage({ params }: PageProps) {
  const avatar = await api.getAvatar(params.id);
  // Render avatar detail with 3D viewport
}
```

---

## Query Parameters

### Global Query Parameters

| Parameter | Routes | Description |
|-----------|--------|-------------|
| `redirect` | `/auth/login`, `/auth/register` | Post-auth redirect path |
| `tab` | All detail pages | Active tab name |
| `view` | `/closet`, `/outfits` | Grid vs list view |
| `page` | All list pages | Pagination page |
| `limit` | All list pages | Items per page |
| `q` | `/closet`, `/outfits` | Search query |
| `category` | `/closet` | Category filter |
| `color` | `/closet` | Color filter |
| `state` | `/closet` | Garment state filter |
| `occasion` | `/outfits` | Occasion filter |
| `season` | `/outfits` | Season filter |
| `startDate` | `/calendar` | Calendar range start |
| `endDate` | `/calendar` | Calendar range end |
| `period` | `/analytics` | Time period (`7d`, `30d`, `90d`, `1y`) |
| `token` | `/auth/reset-password` | Password reset token |

### Route-Specific Query Parameters

#### `/closet`
```typescript
interface ClosetQuery {
  page?: string;
  limit?: string;
  q?: string;
  category?: GarmentCategory;
  color?: string;
  state?: GarmentState;
  isFavorite?: string;       // "true" | "false"
  tags?: string;             // comma-separated
  sortBy?: string;           // "name" | "createdAt" | "updatedAt"
  sortOrder?: string;        // "asc" | "desc"
  view?: string;             // "grid" | "list"
}
```

#### `/closet/[id]`
```typescript
interface GarmentDetailQuery {
  tab?: string;              // "info" | "ai" | "history" | "outfits"
}
```

#### `/outfits`
```typescript
interface OutfitQuery {
  page?: string;
  limit?: string;
  q?: string;
  occasion?: string;
  season?: Season;
  isFavorite?: string;
  sortBy?: string;
  sortOrder?: string;
  view?: string;
  tab?: string;              // "all" | "favorites" | "ai" | "scheduled"
}
```

#### `/outfits/recommendations`
```typescript
interface RecommendationQuery {
  occasion?: string;
  season?: Season;
  temperature?: string;      // numeric
  count?: string;            // number of recommendations
}
```

#### `/calendar`
```typescript
interface CalendarQuery {
  startDate?: string;        // ISO date
  endDate?: string;          // ISO date
  view?: string;             // "month" | "week" | "day"
  date?: string;             // specific date for day view
}
```

#### `/analytics`
```typescript
interface AnalyticsQuery {
  period?: string;           // "7d" | "30d" | "90d" | "1y"
  tab?: string;              // "garments" | "outfits" | "usage" | "ai"
}
```

---

## Server-Side Data Fetching Patterns

### Static Pages

```typescript
// /auth/login - No data fetching needed
export const dynamic = 'force-static';
```

### Dynamic Pages with Data Fetching

```typescript
// /closet - Fetch on server, stream to client
export const dynamic = 'force-dynamic';

async function ClosetPage({ searchParams }: { searchParams: ClosetQuery }) {
  const initialData = await api.getGarments({
    page: parseInt(searchParams.page || '1'),
    limit: parseInt(searchParams.limit || '20'),
    category: searchParams.category as GarmentCategory,
    // ... other filters
  });

  return (
    <HydrationBoundary>
      <ClosetPageContent initialData={initialData} />
    </HydrationBoundary>
  );
}
```

### Revalidation

```typescript
// /closet - Revalidate every 60 seconds
export const revalidate = 60;
```

---

## Error Pages

### `src/app/not-found.tsx`

```typescript
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-xl text-gray-500 mt-4">Página no encontrada</p>
      <Button href="/" variant="primary" className="mt-8">
        Volver al inicio
      </Button>
    </div>
  );
}
```

### `src/app/error.tsx`

```typescript
'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold text-red-300">500</h1>
      <p className="text-xl text-gray-500 mt-4">Error del servidor</p>
      <p className="text-gray-400 mt-2">{error.message}</p>
      <Button onClick={reset} variant="primary" className="mt-8">
        Intentar de nuevo
      </Button>
    </div>
  );
}
```

---

## Loading States

```typescript
// src/app/(dashboard)/closet/loading.tsx
export default function ClosetLoading() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}
```

---

## Route Summary

| Total Routes | Public | Protected | Dynamic |
|-------------|--------|-----------|---------|
| 32 | 6 | 26 | 8 |
