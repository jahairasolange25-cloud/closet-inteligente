/**
 * Reusable test factories for frontend unit tests.
 */

import type { User } from '@/types/auth';
import type { Garment } from '@/types/garment';
import type { Outfit } from '@/types/outfit';
import type { Notification } from '@/types/notification';

let idCounter = 1;
function nextId(): string {
  return `test-${idCounter++}`;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId(),
    email: `user${idCounter}@test.com`,
    name: 'Test User',
    avatar: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as User;
}

export function createAuthTokens() {
  return {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };
}

// ─── Garment ──────────────────────────────────────────────────────────────

export function createGarment(overrides: Partial<Garment> = {}): Garment {
  const id = nextId();
  return {
    id,
    userId: 'user-1',
    name: `Garment ${id}`,
    category: 'tops',
    state: 'available',
    brand: null,
    size: null,
    color: null,
    season: null,
    usageCount: 0,
    lastUsedAt: null,
    imageUrl: null,
    thumbnailUrl: null,
    isFavorite: false,
    pipelineStatus: 'pending',
    notes: null,
    tags: [],
    material: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Garment;
}

export function createGarmentList(count: number, overrides: Partial<Garment> = {}): Garment[] {
  return Array.from({ length: count }, () => createGarment(overrides));
}

// ─── Outfit ───────────────────────────────────────────────────────────────

export function createOutfit(overrides: Partial<Outfit> = {}): Outfit {
  const id = nextId();
  return {
    id,
    userId: 'user-1',
    name: `Outfit ${id}`,
    type: 'casual',
    isFavorite: false,
    garments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Outfit;
}

// ─── WebSocket Mock Factory ────────────────────────────────────────────────

type MockFn = ((...args: unknown[]) => unknown) & { calls: unknown[][] };
function mockFn(impl?: (...args: unknown[]) => unknown): MockFn {
  const calls: unknown[][] = [];
  const fn = ((...args: unknown[]) => { calls.push(args); return impl?.(...args); }) as MockFn;
  fn.calls = calls;
  return fn;
}

export function createMockWebSocket() {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    on: mockFn((event: unknown, cb: unknown) => {
      const e = event as string;
      listeners[e] = listeners[e] ?? [];
      listeners[e].push(cb as (...args: unknown[]) => void);
    }),
    off: mockFn((event: unknown, cb: unknown) => {
      const e = event as string;
      listeners[e] = (listeners[e] ?? []).filter((l) => l !== cb);
    }),
    emit: mockFn(),
    disconnect: mockFn(),
    connect: mockFn(),
    connected: false,
    _trigger: (event: string, ...args: unknown[]) => {
      (listeners[event] ?? []).forEach((cb) => cb(...args));
    },
  };
}

// ─── API Mock Factory ──────────────────────────────────────────────────────

export function createPaginatedResponse<T>(items: T[], total?: number) {
  return {
    data: items,
    meta: {
      total: total ?? items.length,
      page: 1,
      limit: 24,
      totalPages: 1,
    },
  };
}

// ─── Notification ──────────────────────────────────────────────────────────

export function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: nextId(),
    type: 'garment_ready',
    title: 'Test Notification',
    message: 'Test message',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Notification;
}
