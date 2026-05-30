# Mobile Strategy — Closet Inteligente Digital

> **Last Updated:** 2026-05-27
> **Status:** Audit Complete — Partial Implementation

---

## Current Mobile State

| Feature | Status | Notes |
|---|---|---|
| Responsive layout | Partial | Dashboard, garments, outfits adapt |
| Touch gestures | Partial | Swipe detection guard exists |
| Camera capture | Not started | Need `getUserMedia` integration |
| Mobile upload opt | Not started | Need image resize before upload |
| PWA manifest | Not started | |
| Offline support | Partial | OfflineBanner exists, no SW |
| Push notifications | Not started | API ready, frontend pending |

---

## 1. Responsive Audit

### Current Breakpoints

| Breakpoint | Width | Devices | Status |
|---|---|---|---|
| Mobile | < 640px | Phones | Partial |
| Tablet | 640-1024px | iPads | Partial |
| Desktop | > 1024px | Laptops | Good |

### Required Changes

- [ ] Dashboard grid collapses to single column on mobile
- [ ] Garment cards use horizontal scroll on mobile
- [ ] Navigation bottom bar on mobile (< 640px)
- [ ] Filters drawer instead of sidebar on mobile
- [ ] Touch-friendly tap targets (min 44x44px)
- [ ] Font scaling for readability on small screens

## 2. Mobile Upload Optimization

```typescript
async function optimizeImageForUpload(file: File): Promise<File> {
  const maxDimension = 2048;
  const maxSizeMB = 5;

  if (file.size <= maxSizeMB * 1024 * 1024) return file;

  const img = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = (height / width) * maxDimension;
      width = maxDimension;
    } else {
      width = (width / height) * maxDimension;
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob!], file.name, { type: 'image/webp' })),
      'image/webp',
      0.8,
    );
  });
}
```

## 3. Camera Capture

```typescript
async function captureGarmentImage(): Promise<File | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 2048 },
        height: { ideal: 2048 },
      },
    });

    // Show viewfinder, let user tap to capture
    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const blob = await imageCapture.takePhoto();
    track.stop();

    return new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Camera access denied:', error);
    return null;
  }
}
```

## 4. Touch Gesture Improvements

| Gesture | Action | Component |
|---|---|---|
| Swipe left | Next garment | GarmentDetail |
| Swipe right | Previous garment | GarmentDetail |
| Swipe up | Share outfit | OutfitDetail |
| Swipe down | Refresh | GarmentsList |
| Long press | Context menu | GarmentCard |
| Pinch zoom | Image zoom | GarmentImage |
| Double tap | Like/favorite | OutfitCard |

## 5. Low-Memory Mode

```typescript
const lowMemoryMode = {
  imageQuality: 0.6,         // Lower compression
  thumbnailSize: 150,        // Smaller thumbnails
  maxGarmentsPerPage: 10,    // Reduce list size
  disableAnimations: true,   // Reduced motion
  disableWebGL: true,        // No 3D avatar
  cacheTTL: 5 * 60 * 1000,  // Shorter cache
  maxConcurrentUploads: 1,   // Serial uploads
};
```

## 6. Offline-First Sync

```typescript
interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  resource: 'garment' | 'outfit' | 'calendar';
  data: any;
  createdAt: Date;
  retryCount: number;
}

// Sync strategy
const syncConfig = {
  maxQueueSize: 100,
  maxRetries: 5,
  backoffMs: [1000, 2000, 5000, 10000, 30000],
  conflictStrategy: 'last_writer_wins',
  syncOnReconnect: true,
  syncIntervalMs: 5 * 60 * 1000,
};
```

## 7. PWA Audit

| Criterion | Status | Required |
|---|---|---|
| HTTPS | Staging only | Production |
| Manifest.json | Not started | |
| Service Worker | Not started | |
| Install prompt | Not started | |
| Offline page | Not started | |
| Background sync | Not started | |
| Add to home screen | Not started | |

### Manifest Requirements

```json
{
  "name": "Closet Inteligente",
  "short_name": "Closet",
  "description": "Digital wardrobe manager",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## 8. Push Notifications Architecture

```typescript
interface PushNotificationPayload {
  title: string;
  body: string;
  icon: string;
  data: {
    url: string;
    type: 'garment' | 'outfit' | 'calendar' | 'system';
    id: string;
  };
  tag: string;  // Group similar notifications
}

// Notification types
const NOTIFICATION_TYPES = {
  garment_processed: { title: 'Prenda procesada', ttl: 3600 },
  outfit_reminder: { title: 'Recordatorio de outfit', ttl: 86400 },
  calendar_alert: { title: 'Evento de calendario', ttl: 3600 },
  weekly_report: { title: 'Reporte semanal', ttl: 604800 },
};
```

## 9. Implementation Priority

| Task | Priority | Effort | Dependencies |
|---|---|---|---|
| Mobile responsive audit | P1 | 2d | — |
| Image capture | P1 | 1d | — |
| Upload optimization | P1 | 1d | — |
| Touch gestures | P2 | 2d | — |
| PWA manifest + SW | P2 | 3d | HTTPS |
| Offline sync | P3 | 5d | IndexedDB |
| Push notifications | P3 | 3d | VAPID keys |
| Low-memory mode | P3 | 2d | — |
