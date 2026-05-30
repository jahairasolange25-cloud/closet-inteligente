# Next.js Performance Optimization

## Overview

Performance optimization strategy for the Closet Inteligente Digital Next.js frontend. Covers rendering strategies, asset optimization, code splitting, caching, and bundle analysis tailored to the specific needs of a fashion platform with 3D avatars and real-time features.

---

## 1. Rendering Strategy Decision Matrix

### Per-Page Rendering Strategy

| Page | Strategy | Rationale |
|------|----------|-----------|
| `/` (Home/Landing) | SSG + ISR (30s) | Public content, rarely changes |
| `/login` | SSG | Static form, no dynamic data |
| `/register` | SSG | Static form, no dynamic data |
| `/garments` | SSR (auth) | User-specific data, requires auth |
| `/garments/[id]` | SSR | Dynamic garment data, real-time updates |
| `/garments/new` | SSR (auth) | Form requires auth context |
| `/outfits` | SSR (auth) | User-specific outfit list |
| `/outfits/[id]` | SSR + ISR | Dynamic with stale-while-revalidate |
| `/outfits/new` | CSR | Heavy 3D components, lazy-loaded |
| `/calendar` | SSR (auth) | Calendar data requires auth |
| `/profile` | SSR (auth) | User profile, preferences |
| `/profile/avatar` | CSR | 3D avatar viewer, heavy components |
| `/explore` | ISR (60s) | Public outfits, periodic revalidation |
| `/weather` | SSR + ISR | Weather data, 30-min revalidation |
| `/analytics` | SSR (auth) | User analytics, auth required |
| `/admin` | SSR (admin auth) | Admin-only, heavy data tables |
| `/settings` | SSR (auth) | User preferences |

### Implementation

```typescript
// app/garments/[id]/page.tsx (SSR)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GarmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const garment = await getGarment(params.id);
  return <GarmentDetail garment={garment} />;
}
```

```typescript
// app/explore/page.tsx (ISR)
export const revalidate = 60;
export const dynamic = 'force-static';

export default async function ExplorePage() {
  const outfits = await getPublicOutfits();
  return <ExploreGrid outfits={outfits} />;
}
```

```typescript
// app/garments/new/page.tsx (Auth SSR)
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function NewGarmentPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <NewGarmentForm />;
}
```

```typescript
// app/profile/avatar/page.tsx (CSR with dynamic import)
'use client';

import dynamic from 'next/dynamic';

const AvatarViewer = dynamic(
  () => import('@/components/avatar/AvatarViewer'),
  {
    ssr: false,
    loading: () => <AvatarSkeleton />,
  },
);

export default function AvatarPage() {
  return <AvatarViewer />;
}
```

---

## 2. Incremental Static Regeneration

### ISR Revalidation Strategy

```typescript
// lib/revalidation/strategies.ts
export const REVALIDATION_STRATEGIES = {
  // Public content
  home: { revalidate: 30, tags: ['home'] },
  explore: { revalidate: 60, tags: ['explore', 'outfits'] },
  garmentCategories: { revalidate: 300, tags: ['categories'] },

  // User content (on-demand)
  garment: { revalidate: false, tags: ['garment'] },       // On-demand via webhook
  outfit: { revalidate: false, tags: ['outfit'] },          // On-demand via webhook
  avatar: { revalidate: false, tags: ['avatar'] },          // On-demand on completion

  // Third-party data
  weather: { revalidate: 1800, tags: ['weather'] },         // 30 min
  trends: { revalidate: 3600, tags: ['trends'] },           // 1 hour

  // Admin content
  blog: { revalidate: 3600, tags: ['blog'] },               // 1 hour
  faq: { revalidate: 86400, tags: ['faq'] },                // 1 day
};
```

### On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidation-secret');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const { tag } = await request.json();

  if (!tag) {
    return NextResponse.json({ message: 'Tag required' }, { status: 400 });
  }

  revalidateTag(tag);

  return NextResponse.json({ revalidated: true, tag });
}
```

### Revalidation Webhook Handler

```typescript
// app/api/webhooks/garment-updated/route.ts
export async function POST(request: NextRequest) {
  const payload = await request.json();
  const { entityType, entityId } = payload;

  // Revalidate specific garment page
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidation-secret': process.env.REVALIDATION_SECRET!,
    },
    body: JSON.stringify({ tag: entityType }),
  });

  // Also revalidate parent pages
  if (entityType === 'garment') {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': process.env.REVALIDATION_SECRET!,
      },
      body: JSON.stringify({ tags: ['explore', 'home'] }),
    });
  }

  return NextResponse.json({ received: true });
}
```

---

## 3. Image Optimization with `next/image`

### Cloudinary Loader Configuration

```typescript
// lib/cloudinary/loader.ts
import { ImageLoaderProps } from 'next/image';

export const cloudinaryLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps): string => {
  const transformations = [
    'f_auto',            // Auto format (AVIF/WebP/JPEG)
    `q_${quality || 'auto'}`, // Auto quality
    `w_${width}`,        // Responsive width
    'c_limit',           // Constrain proportions
  ];

  if (src.startsWith('http')) {
    return src;
  }

  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformations.join(',')}/v1/${src}`;
};
```

```javascript
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinary/loader.ts',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 100, 150, 200, 300, 450],
    minimumCacheTTL: 604800, // 7 days for cached images
  },
};
```

### Garment Gallery with Priority Loading

```tsx
// components/garments/GarmentGallery.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

export function GarmentGallery({ images }: { images: GarmentImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main image - eager loaded */}
      <div className="relative aspect-square rounded-xl overflow-hidden">
        <Image
          src={images[selectedIndex].publicId}
          alt="Garment view"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Thumbnails - lazy loaded with blur placeholder */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, index) => (
          <button
            key={img.id}
            onClick={() => setSelectedIndex(index)}
            className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
              index === selectedIndex ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <Image
              src={img.publicId}
              alt={`View ${index + 1}`}
              fill
              sizes="64px"
              loading="lazy"
              placeholder="blur"
              blurDataURL={img.blurHash}
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Font Optimization

```typescript
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  preload: false, // Only used on specific pages
  weight: ['400', '600', '700'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 5. Script Optimization

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        
        {/* Analytics - load after page becomes interactive */}
        <Script
          src="https://analytics.example.com/script.js"
          strategy="afterInteractive"
          data-domain="closet.app"
        />

        {/* Chat widget - lazy load */}
        <Script
          src="https://widget.example.com/chat.js"
          strategy="lazyOnload"
        />

        {/* Cloudinary widget - only on upload pages */}
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

### Performance Monitoring Script

```typescript
// components/performance/WebVitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body);
    }
  });

  return null;
}
```

---

## 6. Code Splitting and Lazy Loading

### Dynamic Import Map

```typescript
// lib/dynamic-imports.ts
import dynamic from 'next/dynamic';

// Heavy 3D components
export const DynamicAvatarViewer = dynamic(
  () => import('@/components/avatar/AvatarViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-100 animate-pulse rounded-xl" />
    ),
  },
);

export const DynamicOutfit3DPreview = dynamic(
  () => import('@/components/outfits/Outfit3DPreview'),
  { ssr: false, loading: () => <OutfitSkeleton /> },
);

// Heavy data visualization
export const DynamicAnalyticsCharts = dynamic(
  () => import('@/components/analytics/AnalyticsCharts'),
  { loading: () => <ChartSkeleton /> },
);

export const DynamicColorAnalysisGraph = dynamic(
  () => import('@/components/analytics/ColorAnalysisGraph'),
  { loading: () => <div className="h-64 bg-gray-50 rounded-lg animate-pulse" /> },
);

// Large form components
export const DynamicGarmentForm = dynamic(
  () => import('@/components/garments/GarmentForm'),
  { loading: () => <FormSkeleton /> },
);

// Media components
export const DynamicVideoUploader = dynamic(
  () => import('@/components/media/VideoUploader'),
  { ssr: false },
);

export const DynamicImageEditor = dynamic(
  () => import('@/components/media/ImageEditor'),
  { ssr: false },
);

// Calendar (heavy library)
export const DynamicCalendar = dynamic(
  () => import('@/components/calendar/CalendarView'),
  { loading: () => <CalendarSkeleton /> },
);
```

### Route-Level Code Splitting

```typescript
// app/outfits/new/page.tsx
import dynamic from 'next/dynamic';

const OutfitBuilder = dynamic(
  () => import('@/components/outfits/OutfitBuilder'),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-3 gap-4 p-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    ),
  },
);

export default function NewOutfitPage() {
  return <OutfitBuilder />;
}
```

---

## 7. Dynamic Imports for Heavy Components

### 3D Viewer with Chunked Loading

```typescript
// components/avatar/LazyAvatarViewer.tsx
'use client';

import { Suspense, lazy, useState } from 'react';

const AvatarViewer = lazy(() => import('@/components/avatar/AvatarViewer'));

export function LazyAvatarViewer({ modelUrl }: { modelUrl: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {!loaded && (
        <div className="w-full h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading 3D Avatar...</p>
          </div>
        </div>
      )}
      <Suspense fallback={null}>
        <div className={loaded ? '' : 'hidden'}>
          <AvatarViewer modelUrl={modelUrl} />
        </div>
      </Suspense>
    </div>
  );
}
```

### Component Preloading

```typescript
// hooks/usePreloadComponent.ts
import { useEffect } from 'react';

export function usePreloadComponent(
  importFn: () => Promise<any>,
  trigger: 'hover' | 'visible' | 'idle' = 'idle',
) {
  useEffect(() => {
    if (trigger === 'idle') {
      // Preload when browser is idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => importFn());
      } else {
        setTimeout(importFn, 2000);
      }
    }
  }, [trigger, importFn]);

  const onHover = trigger === 'hover'
    ? () => importFn()
    : undefined;

  return { onHover };
}
```

```tsx
// Usage in garment card (preload on hover)
import { usePreloadComponent } from '@/hooks/usePreloadComponent';

export function GarmentCard({ garment }: { garment: Garment }) {
  const preloadDetail = usePreloadComponent(
    () => import('@/components/garments/GarmentDetailSheet'),
    'hover',
  );

  return (
    <Link
      href={`/garments/${garment.id}`}
      {...preloadDetail}
    >
      {/* Card content */}
    </Link>
  );
}
```

---

## 8. Route Prefetching Strategy

```typescript
// components/navigation/PrefetchManager.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function PrefetchManager() {
  const router = useRouter();
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    // Prefetch common routes on idle
    const routesToPrefetch = [
      '/garments',
      '/outfits',
      '/calendar',
      '/profile',
    ];

    const prefetchOnIdle = () => {
      for (const route of routesToPrefetch) {
        if (!prefetched.current.has(route)) {
          router.prefetch(route);
          prefetched.current.add(route);
        }
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchOnIdle);
    } else {
      setTimeout(prefetchOnIdle, 3000);
    }
  }, [router]);

  return null;
}
```

### Link-Level Prefetch Control

```tsx
// Only prefetch high-probability links
<Link href="/garments/new" prefetch={false}>New Garment</Link>
<Link href="/garments" prefetch={true}>My Wardrobe</Link>
<Link href="/outfits" prefetch={true}>Outfits</Link>
<Link href={`/garments/${garment.id}`} prefetch={false}>Detail</Link>
```

---

## 9. Edge Functions for Low-Latency Operations

```typescript
// app/api/weather/recommendation/route.ts (Edge Runtime)
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const userId = request.headers.get('x-user-id');

  // Fast geolocation lookup
  const weather = await getWeather(lat!, lng!);

  // Quick recommendation based on weather
  const recommendation = generateQuickRecommendation(weather);

  return NextResponse.json({
    weather,
    recommendation,
    timestamp: Date.now(),
  });
}

function generateQuickRecommendation(weather: WeatherData): string {
  if (weather.temp > 30) return 'light_summer';
  if (weather.temp > 20) return 'mild_spring';
  if (weather.temp > 10) return 'cool_autumn';
  if (weather.rain > 50) return 'rainy_day';
  return 'winter_warm';
}
```

### Static Optimization at Edge

```typescript
// middleware.ts
import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set user-specific cache headers
  const response = NextResponse.next();

  // Public pages: long cache
  if (pathname === '/' || pathname.startsWith('/explore')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    );
  }

  // Static assets: immutable cache
  if (pathname.match(/\.(jpg|png|webp|avif|svg|css|js)$/)) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    );
  }

  return response;
}
```

---

## 10. Bundle Analysis and Optimization

### Bundle Analyzer Setup

```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... other config
});
```

```bash
# Generate bundle report
ANALYZE=true npm run build
```

### Optimization Targets

```javascript
// next.config.js
module.exports = {
  // Enable SWC minification (default in Next.js 14)
  swcMinify: true,

  // Enable compression
  compress: true,

  // Exclude large packages from server bundle
  serverExternalPackages: ['sharp', 'canvas', 'three'],

  // Configure webpack for optimal bundling
  webpack: (config, { isServer }) => {
    // Optimize Three.js
    config.resolve.alias = {
      ...config.resolve.alias,
      'three': 'three/build/three.module.js', // Tree-shakeable build
    };

    // Bundle size limits
    config.performance = {
      maxAssetSize: 300 * 1024,    // 300KB
      maxEntrypointSize: 500 * 1024, // 500KB
    };

    // Skip bundling large 3D libs on server
    if (isServer) {
      config.externals.push('three', '@react-three/fiber', '@react-three/drei');
    }

    return config;
  },
};
```

### Manual Chunk Splitting

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        // Three.js and 3D libraries
        three: {
          test: /[\\/]node_modules[\\/](three|@react-three|@react-three\/fiber|@react-three\/drei)[\\/]/,
          name: 'vendor-3d',
          priority: 30,
          chunks: 'async', // Only for dynamic imports
        },
        // UI framework
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
          name: 'vendor-ui',
          priority: 20,
          chunks: 'all',
        },
        // State management
        state: {
          test: /[\\/]node_modules[\\/](zustand|@tanstack)[\\/]/,
          name: 'vendor-state',
          priority: 15,
          chunks: 'all',
        },
        // Common utilities
        common: {
          test: /[\\/]node_modules[\\/](date-fns|lodash|clsx)[\\/]/,
          name: 'vendor-common',
          priority: 10,
          chunks: 'all',
        },
      },
    };

    return config;
  },
};
```

---

## 11. Data Fetching Optimization

### React Query + SSR Integration

```typescript
// lib/query/getQueryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

export const getQueryClient = cache(() => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30s
      gcTime: 5 * 60 * 1000,       // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
}));
```

### Prefetching Pattern

```typescript
// app/garments/page.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query/getQueryClient';
import { garmentKeys } from '@/lib/query/keys';
import { GarmentList } from './GarmentList';

export default async function GarmentsPage() {
  const queryClient = getQueryClient();

  // Prefetch data on server
  await queryClient.prefetchQuery({
    queryKey: garmentKeys.lists(),
    queryFn: () => fetchGarments(),
    staleTime: 30 * 1000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GarmentList />
    </HydrationBoundary>
  );
}
```

### Infinite Scroll with Virtualization

```tsx
// components/garments/GarmentGrid.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useCallback } from 'react';

export function GarmentGrid() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['garments'],
    queryFn: ({ pageParam }) => fetchGarmentsPaginated(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allGarments = data?.pages.flatMap(p => p.items) ?? [];
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: allGarments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Card height
    overscan: 5,
  });

  // Intersection observer for load more
  const lastItemRef = useCallback(
    (node: HTMLDivElement) => {
      if (!node || !hasNextPage || isFetchingNextPage) return;

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      });

      observer.observe(node);
      return () => observer.disconnect();
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            ref={virtualItem.index === allGarments.length - 1 ? lastItemRef : undefined}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <GarmentCard garment={allGarments[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 12. Performance Budgets

| Metric | Target | Threshold | Measurement |
|--------|--------|-----------|-------------|
| LCP (Largest Contentful Paint) | < 2.0s | 2.5s | Chrome Web Vitals |
| FID (First Input Delay) | < 50ms | 100ms | Chrome Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.05 | 0.1 | Chrome Web Vitals |
| TTI (Time to Interactive) | < 3.0s | 4.0s | Lighthouse |
| TBT (Total Blocking Time) | < 200ms | 300ms | Lighthouse |
| First Load JS | < 250KB | 350KB | Bundle analysis |
| Image optimization savings | > 60% | 40% | Cloudinary stats |
| API response time (p95) | < 200ms | 500ms | Server monitoring |
| 3D avatar load time | < 3s | 5s | RUM |
| ISR revalidation time | < 100ms | 500ms | Server monitoring |

## 13. Build Time Optimizations

```javascript
// next.config.js
module.exports = {
  // Reduce build times with SWC
  swcMinify: true,

  // Exclude large packages from transpilation
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],

  // Optimize for production
  productionBrowserSourceMaps: false,

  // Reduce Docker image size
  output: 'standalone',

  // Module resolution optimization
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/{{member}}',
    },
  },
};
```

## 14. Monitoring with Real User Metrics

```typescript
// lib/performance/rum.ts
export function initRealUserMonitoring() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        reportMetric('LCP', entry.startTime);
      }
      if (entry.entryType === 'first-input') {
        reportMetric('FID', entry.processingStart - entry.startTime);
      }
      if (entry.entryType === 'layout-shift') {
        reportMetric('CLS', entry.value);
      }
    }
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });
  observer.observe({ type: 'first-input', buffered: true });
  observer.observe({ type: 'layout-shift', buffered: true });

  // Navigation timing
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navEntry) {
    reportMetric('TTFB', navEntry.responseStart - navEntry.requestStart);
    reportMetric('DOM_LOAD', navEntry.domContentLoadedEventEnd);
  }
}

function reportMetric(name: string, value: number) {
  const data = { name, value, url: window.location.pathname, timestamp: Date.now() };

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', JSON.stringify(data));
  }
}
```
