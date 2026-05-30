# Firebase Cloud Messaging Integration

## Overview

Firebase Cloud Messaging (FCM) delivers push notifications for outfit reminders, weather-based recommendations, calendar events, and social features. This guide covers web push notification setup, service worker configuration, and backend integration.

---

## 1. Project Setup

### Firebase Configuration

```typescript
// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const messaging: Messaging | null = typeof window !== 'undefined' 
  ? getMessaging(app) 
  : null;
```

### Server-Side Admin Setup

```typescript
// lib/firebase/admin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const firebaseMessaging = admin.messaging();
export const firebaseAuth = admin.auth();
```

---

## 2. Web Push Notification Setup

### VAPID Key Generation

```bash
# Generate VAPID keys for web push
npx web-push generate-vapid-keys
```

```typescript
// .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BP...
VAPID_PRIVATE_KEY=...
FIREBASE_PROJECT_ID=closet-inteligente
```

### Service Worker Registration

```typescript
// lib/firebase/sw-register.ts
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}
```

### Service Worker File

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data || {},
    tag: payload.data?.tag || 'default',
    renotify: true,
    requireInteraction: payload.data?.highPriority === 'true',
    actions: payload.data?.actions 
      ? JSON.parse(payload.data.actions)
      : undefined,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  const urlToOpen = data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If a window tab matching the URL exists, focus it
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
```

---

## 3. Notification Permission Handling

```typescript
// hooks/useNotificationPermission.ts
import { useState, useEffect, useCallback } from 'react';
import { messaging } from '@/lib/firebase/client';
import { getToken } from 'firebase/messaging';

type NotificationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported' | 'loading';

interface UseNotificationPermissionReturn {
  permission: NotificationPermissionState;
  fcmToken: string | null;
  requestPermission: () => Promise<boolean>;
  isLoading: boolean;
}

export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [permission, setPermission] = useState<NotificationPermissionState>('loading');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      setIsLoading(false);
      return;
    }

    const state = Notification.permission as NotificationPermissionState;
    setPermission(state);

    if (state === 'granted') {
      await getFcmToken();
    }
    setIsLoading(false);
  };

  const getFcmToken = async () => {
    if (!messaging) return;

    try {
      const swRegistration = await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        setFcmToken(token);
        return token;
      }
    } catch (error) {
      console.error('FCM token retrieval failed:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);

      if (result === 'granted') {
        await getFcmToken();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  return { permission, fcmToken, requestPermission, isLoading };
}
```

### Permission Banner Component

```tsx
// components/notifications/PermissionBanner.tsx
'use client';

import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useState } from 'react';

export function NotificationPermissionBanner() {
  const { permission, requestPermission, isLoading } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed) return null;
  if (permission === 'granted' || permission === 'denied' || permission === 'unsupported') return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
      <h3 className="font-semibold text-gray-900 mb-1">Stay Updated</h3>
      <p className="text-sm text-gray-600 mb-3">
        Get notified when the weather changes, new outfits are recommended, or your calendar events start.
      </p>
      <div className="flex gap-2">
        <button
          onClick={requestPermission}
          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          Enable Notifications
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-3 py-1.5 text-gray-500 text-sm rounded-lg hover:bg-gray-100 transition"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Push Notification Payload Format

```typescript
// lib/notifications/payload.ts
export type NotificationType =
  | 'outfit_reminder'
  | 'weather_alert'
  | 'calendar_event'
  | 'laundry_reminder'
  | 'wardrobe_suggestion'
  | 'friend_request'
  | 'outfit_like'
  | 'avatar_ready'
  | 'admin_announcement';

export interface NotificationPayload {
  // Firebase notification fields
  notification: {
    title: string;
    body: string;
    image?: string;
  };

  // Custom data payload
  data: {
    type: NotificationType;
    id: string;
    url?: string;
    highPriority?: 'true' | 'false';
    tag?: string;
    actions?: string; // JSON stringified
    scheduledAt?: string; // ISO date
    ttl?: string; // seconds
  };

  // Platform targeting
  topic?: string;
  condition?: string;
  token?: string;
}

/**
 * Build a notification payload for each type.
 */
export const NotificationTemplates: Record<NotificationType, (params: any) => NotificationPayload> = {
  outfit_reminder: (p) => ({
    notification: {
      title: "Today's Outfit",
      body: p.outfitName ? `Don't forget your ${p.outfitName} today!` : 'Check your planned outfit for today.',
      image: p.imageUrl,
    },
    data: { type: 'outfit_reminder', id: p.id, url: `/outfits/${p.id}`, tag: 'outfit' },
  }),

  weather_alert: (p) => ({
    notification: {
      title: 'Weather Update',
      body: `It's ${p.temp}°C and ${p.condition} today. ${p.recommendation}`,
      image: p.imageUrl,
    },
    data: { type: 'weather_alert', id: p.id, url: '/', highPriority: 'true', tag: 'weather' },
  }),

  calendar_event: (p) => ({
    notification: {
      title: 'Upcoming Event',
      body: `${p.eventName} in ${p.timeUntil}. ${p.outfitPlanned ? 'Outfit is ready!' : 'Plan an outfit?'}`,
    },
    data: { type: 'calendar_event', id: p.id, url: `/calendar/${p.id}`, tag: `event-${p.id}` },
  }),

  laundry_reminder: (p) => ({
    notification: {
      title: 'Laundry Reminder',
      body: `${p.count} garments need cleaning. ${p.recommendation}`,
    },
    data: { type: 'laundry_reminder', id: p.id, url: '/garments?filter=needs_cleaning', tag: 'laundry' },
  }),

  wardrobe_suggestion: (p) => ({
    notification: {
      title: 'New Outfit Suggestion',
      body: `Try ${p.outfitName} - a great match for your ${p.occasion}!`,
      image: p.imageUrl,
    },
    data: { type: 'wardrobe_suggestion', id: p.id, url: `/outfits/${p.id}`, tag: 'suggestion' },
  }),

  friend_request: (p) => ({
    notification: {
      title: 'Friend Request',
      body: `${p.fromName} wants to follow your wardrobe.`,
      image: p.avatarUrl,
    },
    data: {
      type: 'friend_request',
      id: p.id,
      url: `/profile/friends`,
      tag: 'friend-request',
      actions: JSON.stringify([
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' },
      ]),
    },
  }),

  outfit_like: (p) => ({
    notification: {
      title: 'Outfit Liked',
      body: `${p.fromName} liked your outfit "${p.outfitName}".`,
    },
    data: { type: 'outfit_like', id: p.id, url: `/outfits/${p.outfitId}`, tag: `like-${p.id}` },
  }),

  avatar_ready: (p) => ({
    notification: {
      title: 'Your Avatar is Ready!',
      body: 'Your 3D avatar has been generated. Check it out!',
      image: p.thumbnailUrl,
    },
    data: { type: 'avatar_ready', id: p.id, url: '/profile/avatar', tag: 'avatar', highPriority: 'true' },
  }),

  admin_announcement: (p) => ({
    notification: {
      title: p.title,
      body: p.body,
    },
    data: { type: 'admin_announcement', id: p.id, url: p.url || '/', tag: 'announcement' },
  }),
};
```

---

## 5. Notification Scheduling

```typescript
// src/notifications/notification-scheduler.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseMessagingService } from './firebase-messaging.service';

@Injectable()
export class NotificationScheduler {
  constructor(private readonly messagingService: FirebaseMessagingService) {}

  /**
   * Morning outfit reminder (7:00 AM user's local time).
   * Uses user timezone stored in profile.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendMorningOutfitReminders() {
    const now = new Date();
    const currentHour = now.getUTCHours();

    // Users with timezone roughly at 7:00 AM
    const timezones = this.getTimezoneRange(currentHour, 7);

    const users = await this.prisma.user.findMany({
      where: {
        timezone: { in: timezones },
        notificationsEnabled: true,
        morningReminder: true,
      },
      include: {
        calendarEvents: {
          where: {
            date: {
              gte: new Date(now.setHours(0, 0, 0, 0)),
              lt: new Date(now.setHours(23, 59, 59, 999)),
            },
          },
          include: { outfit: true },
        },
      },
    });

    for (const user of users) {
      if (user.calendarEvents.length > 0) {
        const event = user.calendarEvents[0];
        await this.messagingService.sendToUser(user.id, {
          type: 'calendar_event',
          payload: {
            id: event.id,
            eventName: event.title,
            timeUntil: this.getTimeUntil(event.date),
            outfitPlanned: !!event.outfitId,
          },
        });
      } else {
        await this.messagingService.sendToUser(user.id, {
          type: 'outfit_reminder',
          payload: { id: 'daily', outfitName: undefined },
        });
      }
    }
  }

  /**
   * Weather alerts (every hour, checks upcoming weather changes).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendWeatherAlerts() {
    const users = await this.prisma.user.findMany({
      where: {
        notificationsEnabled: true,
        weatherAlerts: true,
      },
    });

    for (const user of users) {
      const weather = await this.getWeatherForUser(user);
      if (weather && weather.alert) {
        await this.messagingService.sendToUser(user.id, {
          type: 'weather_alert',
          payload: {
            id: `weather-${Date.now()}`,
            temp: weather.temp,
            condition: weather.condition,
            recommendation: weather.recommendation,
          },
        });
      }
    }
  }

  /**
   * Laundry reminders (weekly, Sunday evening).
   */
  @Cron('0 18 * * 0') // Sunday 6 PM UTC
  async sendLaundryReminders() {
    const users = await this.prisma.user.findMany({
      where: { notificationsEnabled: true, laundryReminder: true },
    });

    for (const user of users) {
      const dirtyCount = await this.prisma.garment.count({
        where: { userId: user.id, status: 'needs_cleaning' },
      });

      if (dirtyCount > 0) {
        await this.messagingService.sendToUser(user.id, {
          type: 'laundry_reminder',
          payload: {
            id: `laundry-${Date.now()}`,
            count: dirtyCount,
            recommendation: dirtyCount > 10
              ? 'You have a lot of laundry to do!'
              : `Just ${dirtyCount} items to clean.`,
          },
        });
      }
    }
  }

  private getTimezoneRange(utcHour: number, targetLocalHour: number): string[] {
    // Maps UTC hour to timezone offsets
    const offsets = [];
    for (let offset = -12; offset <= 14; offset++) {
      const localHour = (utcHour + offset + 24) % 24;
      if (localHour === targetLocalHour) {
        offsets.push(`UTC${offset >= 0 ? '+' : ''}${offset}`);
      }
    }
    return offsets;
  }

  private getTimeUntil(date: Date): string {
    const diff = date.getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    if (hours > 24) return `${Math.floor(hours / 24)} days`;
    return `${hours} hours`;
  }

  private async getWeatherForUser(user: any): Promise<any> {
    // Call weather API with user's lat/lng
    return null;
  }
}
```

---

## 6. Notification Click Handling

```typescript
// hooks/useNotificationClickHandler.ts
import { useEffect } from 'react';
import { messaging } from '@/lib/firebase/client';
import { onMessage } from 'firebase/messaging';
import { useRouter } from 'next/navigation';

export function useNotificationClickHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!messaging) return;

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
      
      const data = payload.data;
      if (data?.url) {
        // Show in-app toast notification
        showInAppNotification(payload);
      }
    });

    return () => unsubscribe();
  }, [router]);

  /**
   * Listen for when the app is opened from a notification click.
   * This happens when the PWA is launched from a notification.
   */
  useEffect(() => {
    const handleAppOpen = () => {
      // Check if opened via notification
      const urlParams = new URLSearchParams(window.location.search);
      const notificationId = urlParams.get('notificationId');
      const notificationType = urlParams.get('type');

      if (notificationId && notificationType) {
        handleDeepLink(notificationType, notificationId, router);
      }
    };

    handleAppOpen();
  }, [router]);
}

function handleDeepLink(
  type: string,
  id: string,
  router: ReturnType<typeof useRouter>,
) {
  const routes: Record<string, string> = {
    outfit_reminder: `/outfits/${id}`,
    weather_alert: '/',
    calendar_event: `/calendar/${id}`,
    laundry_reminder: '/garments?filter=needs_cleaning',
    wardrobe_suggestion: `/outfits/${id}`,
    friend_request: '/profile/friends',
    outfit_like: `/outfits/${id}`,
    avatar_ready: '/profile/avatar',
    admin_announcement: '/',
  };

  const path = routes[type] || '/';
  router.push(path);
}

function showInAppNotification(payload: any) {
  // Dispatch custom event for UI to handle
  const event = new CustomEvent('in-app-notification', {
    detail: {
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data,
    },
  });
  window.dispatchEvent(event);
}
```

---

## 7. Backend Notification Service

```typescript
// src/notifications/firebase-messaging.service.ts
import { Injectable } from '@nestjs/common';
import { firebaseMessaging } from '@/lib/firebase/admin';
import { NotificationPayload, NotificationType, NotificationTemplates } from '@/lib/notifications/payload';

interface SendToUserOptions {
  type: NotificationType;
  payload: any;
  priority?: 'normal' | 'high';
  ttl?: number;
}

@Injectable()
export class FirebaseMessagingService {
  async sendToUser(userId: string, options: SendToUserOptions): Promise<void> {
    const tokens = await this.getUserTokens(userId);
    if (tokens.length === 0) return;

    const notificationPayload = NotificationTemplates[options.type](options.payload);

    const message = {
      ...notificationPayload,
      android: {
        priority: options.priority || 'normal',
        ttl: options.ttl ? `${options.ttl}s` : '86400s',
        notification: {
          channelId: options.type,
          priority: options.priority === 'high' ? 'high' : 'default',
        },
      },
      webpush: {
        headers: {
          Urgency: options.priority === 'high' ? 'high' : 'normal',
          TTL: String(options.ttl || 86400),
        },
        notification: {
          requireInteraction: options.priority === 'high',
          vibrate: [200, 100, 200],
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
        fcmOptions: {
          link: notificationPayload.data.url || '/',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notificationPayload.notification.title,
              body: notificationPayload.notification.body,
            },
            sound: 'default',
            badge: 1,
            'content-available': 1,
          },
        },
      },
    };

    // Send to all user tokens
    const results = await Promise.allSettled(
      tokens.map((token) =>
        firebaseMessaging.send({ ...message, token }, false),
      ),
    );

    // Handle failed tokens
    const failedTokens: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        if (this.isInvalidTokenError(result.reason)) {
          failedTokens.push(tokens[index]);
        }
        console.error(`Failed to send to token ${tokens[index]}:`, result.reason);
      }
    });

    // Clean up invalid tokens
    if (failedTokens.length > 0) {
      await this.removeTokens(failedTokens);
    }

    // Log delivery
    await this.logDelivery({
      userId,
      type: options.type,
      sent: tokens.length - failedTokens.length,
      failed: failedTokens.length,
      timestamp: new Date(),
    });
  }

  async sendToTopic(topic: string, options: SendToUserOptions): Promise<void> {
    const notificationPayload = NotificationTemplates[options.type](options.payload);

    await firebaseMessaging.send({
      ...notificationPayload,
      topic,
    });
  }

  async sendToCondition(condition: string, options: SendToUserOptions): Promise<void> {
    const notificationPayload = NotificationTemplates[options.type](options.payload);

    await firebaseMessaging.send({
      ...notificationPayload,
      condition,
    });
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    const devices = await this.prisma.device.findMany({
      where: { userId, fcmToken: { not: null } },
      select: { fcmToken: true },
    });
    return devices.map((d) => d.fcmToken!).filter(Boolean);
  }

  private isInvalidTokenError(error: any): boolean {
    return (
      error.code === 'messaging/invalid-argument' ||
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    );
  }

  private async removeTokens(tokens: string[]): Promise<void> {
    await this.prisma.device.updateMany({
      where: { fcmToken: { in: tokens } },
      data: { fcmToken: null },
    });
  }

  private async logDelivery(delivery: any): Promise<void> {
    await this.prisma.notificationLog.create({ data: delivery });
  }
}
```

---

## 8. Topic-Based Messaging

```typescript
// src/notifications/topic-management.service.ts
@Injectable()
export class TopicManagementService {
  /**
   * Topic naming convention:
   * - Global: 'all'
   * - By feature: 'outfit_reminders', 'weather_alerts', 'promotions'
   * - By region: 'region_{country_code}'
   * - By tier: 'tier_free', 'tier_premium', 'tier_pro'
   * - By interest: 'interest_casual', 'interest_formal', 'interest_sporty'
   */

  async subscribeToTopics(token: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, preferences: true },
    });

    const topics = [
      'all',
      `tier_${user.tier}`,
      ...this.getInterestTopics(user.preferences),
    ];

    await Promise.all(
      topics.map((topic) =>
        firebaseMessaging.subscribeToTopic(token, topic),
      ),
    );
  }

  async unsubscribeFromAll(token: string): Promise<void> {
    const topics = await this.getSubscribedTopics(token);
    if (topics.length > 0) {
      await firebaseMessaging.unsubscribeFromTopic(token, topics);
    }
  }

  private getInterestTopics(preferences: any): string[] {
    const topics: string[] = [];
    if (preferences?.style) {
      topics.push(`interest_${preferences.style}`);
    }
    return topics;
  }

  private async getSubscribedTopics(token: string): Promise<string[]> {
    // Fetch from your database since FCM doesn't expose this API
    const subs = await this.prisma.topicSubscription.findMany({
      where: { token },
      select: { topic: true },
    });
    return subs.map((s) => s.topic);
  }
}
```

---

## 9. Device Token Management

```typescript
// src/devices/device-token.service.ts
@Injectable()
export class DeviceTokenService {
  async registerToken(
    userId: string,
    fcmToken: string,
    deviceInfo: {
      platform: string;
      userAgent: string;
      language: string;
    },
  ): Promise<void> {
    // Upsert: update existing or create new
    await this.prisma.device.upsert({
      where: { fcmToken },
      update: {
        userId,
        lastSeen: new Date(),
        platform: deviceInfo.platform,
        userAgent: deviceInfo.userAgent,
        language: deviceInfo.language,
      },
      create: {
        userId,
        fcmToken,
        platform: deviceInfo.platform,
        userAgent: deviceInfo.userAgent,
        language: deviceInfo.language,
        lastSeen: new Date(),
      },
    });
  }

  async unregisterToken(fcmToken: string): Promise<void> {
    await this.prisma.device.update({
      where: { fcmToken },
      data: { fcmToken: null, unregisteredAt: new Date() },
    });
  }

  async getUserDevices(userId: string): Promise<Device[]> {
    return this.prisma.device.findMany({
      where: { userId, fcmToken: { not: null } },
      orderBy: { lastSeen: 'desc' },
    });
  }

  async cleanupStaleTokens(daysOld: number = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await this.prisma.device.updateMany({
      where: {
        lastSeen: { lt: cutoff },
        fcmToken: { not: null },
      },
      data: {
        fcmToken: null,
        unregisteredAt: new Date(),
      },
    });

    return result.count;
  }
}
```

### Token Registration Endpoint

```typescript
// app/api/notifications/register/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token, platform, userAgent, language } = await request.json();
  const userId = request.headers.get('x-user-id')!;

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  await fetch(`${process.env.BACKEND_URL}/api/devices/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, fcmToken: token, platform, userAgent, language }),
  });

  return NextResponse.json({ success: true });
}
```

---

## 10. Error Handling

```typescript
// lib/notifications/errors.ts
export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export const FCM_ERROR_CODES: Record<string, { message: string; retryable: boolean }> = {
  'messaging/invalid-argument': { message: 'Invalid argument provided', retryable: false },
  'messaging/invalid-recipient': { message: 'Invalid recipient token', retryable: false },
  'messaging/invalid-registration-token': { message: 'Invalid registration token', retryable: false },
  'messaging/registration-token-not-registered': { message: 'Token not registered', retryable: false },
  'messaging/mismatched-credential': { message: 'Credential mismatch', retryable: false },
  'messaging/invalid-payload': { message: 'Invalid payload format', retryable: false },
  'messaging/quota-exceeded': { message: 'Monthly quota exceeded', retryable: false },
  'messaging/sender-id-mismatch': { message: 'Sender ID mismatch', retryable: false },
  'messaging/third-party-auth-error': { message: 'Third-party auth error', retryable: false },
  'messaging/unavailable': { message: 'Service temporarily unavailable', retryable: true },
  'messaging/internal-error': { message: 'Internal server error', retryable: true },
  'messaging/too-many-topics': { message: 'Too many topics', retryable: false },
};

export function handleFcmError(error: any): NotificationError {
  const code = error.code || 'unknown';
  const mapping = FCM_ERROR_CODES[code];
  
  if (mapping) {
    return new NotificationError(mapping.message, code, mapping.retryable);
  }
  
  return new NotificationError(
    `Unknown FCM error: ${error.message}`,
    'unknown',
    true,
  );
}
```

### Retry Logic

```typescript
// lib/notifications/retry.ts
export async function sendWithRetry(
  sendFn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await sendFn();
    } catch (error) {
      lastError = error;
      const fcmError = handleFcmError(error);

      if (!fcmError.retryable) throw error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

---

## 11. Notification Delivery Analytics

```typescript
// src/notifications/analytics.service.ts
@Injectable()
export class NotificationAnalyticsService {
  async getDeliveryStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DeliveryStats> {
    const logs = await this.prisma.notificationLog.findMany({
      where: {
        userId,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const total = logs.length;
    const sent = logs.filter((l) => l.sent > 0).length;
    const failed = logs.filter((l) => l.failed > 0).length;
    const fullyFailed = logs.filter((l) => l.sent === 0 && l.failed > 0).length;

    return {
      total,
      sent,
      failed,
      fullyFailed,
      deliveryRate: total > 0 ? ((sent - fullyFailed) / total) * 100 : 0,
      byType: this.groupByType(logs),
      dailyBreakdown: this.dailyBreakdown(logs),
    };
  }

  private groupByType(logs: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    logs.forEach((log) => {
      grouped[log.type] = (grouped[log.type] || 0) + log.sent;
    });
    return grouped;
  }

  private dailyBreakdown(logs: any[]): { date: string; sent: number; failed: number }[] {
    const byDate: Record<string, { sent: number; failed: number }> = {};
    logs.forEach((log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { sent: 0, failed: 0 };
      byDate[date].sent += log.sent;
      byDate[date].failed += log.failed;
    });
    return Object.entries(byDate).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }
}

interface DeliveryStats {
  total: number;
  sent: number;
  failed: number;
  fullyFailed: number;
  deliveryRate: number;
  byType: Record<string, number>;
  dailyBreakdown: { date: string; sent: number; failed: number }[];
}
```

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| Notification delivery time | < 1s |
| Delivery rate | > 99% |
| Token registration latency | < 100ms |
| Permission request acceptance | > 30% |
| Notification click rate | > 15% |
| Service worker bootstrap | < 500ms |
| Background message handling | < 200ms |
