# WebSocket Sync Strategy

## Overview

The WebSocket synchronization system enables real-time multi-device synchronization of wardrobe data, outfit planning, and calendar events. This document covers conflict resolution, offline support, and the Socket.IO implementation for the Closet Inteligente Digital platform.

---

## 1. Architecture Overview

### Connection Topology

```
Client A (Browser)  ──────┐
Client B (Mobile)   ──────┤
Client C (Browser)  ──────┼── Socket.IO Server ── Redis Adapter ── PostgreSQL
                           │                                        │
Client D (Mobile)   ──────┘                                    Change Log
```

### Socket.IO Namespace Structure

| Namespace | Purpose | Events |
|-----------|---------|--------|
| `/wardrobe` | Garment CRUD sync | `garment:created`, `garment:updated`, `garment:deleted` |
| `/outfits` | Outfit collaboration | `outfit:created`, `outfit:updated`, `outfit:liked` |
| `/calendar` | Calendar event sync | `event:created`, `event:updated`, `event:deleted` |
| `/presence` | Online/offline status | `user:online`, `user:offline`, `user:typing` |
| `/notifications` | Real-time alerts | `notification:new`, `notification:read` |

---

## 2. Server Setup (NestJS)

### Gateway Configuration

```typescript
// src/socket/socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  namespace: '/',
  pingInterval: 25000,
  pingTimeout: 20000,
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private socketUsers = new Map<string, string>(); // socketId -> userId

  async handleConnection(client: Socket) {
    try {
      // Extract JWT from handshake
      const token = client.handshake.auth.token || 
                    client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify token and extract user
      const user = await this.verifyToken(token);
      client.data.user = user;

      // Track connection
      this.addUserConnection(user.id, client.id);
      client.join(`user:${user.id}`);

      // Join user's rooms
      client.join(`garments:${user.id}`);
      client.join(`outfits:${user.id}`);
      client.join(`calendar:${user.id}`);

      // Broadcast presence
      this.server.to(`presence:${user.id}`).emit('user:online', {
        userId: user.id,
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });

      // Send pending changes
      await this.sendPendingChanges(client, user.id);

      console.log(`User ${user.id} connected (${client.id})`);
    } catch (error) {
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.user?.id;
    if (userId) {
      this.removeUserConnection(userId, client.id);

      // Check if user has no more active sockets
      if (!this.userSockets.has(userId) || this.userSockets.get(userId)!.size === 0) {
        this.server.to(`presence:${userId}`).emit('user:offline', {
          userId,
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`User ${userId} disconnected (${client.id})`);
    }
  }

  private addUserConnection(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.socketUsers.set(socketId, userId);
  }

  private removeUserConnection(userId: string, socketId: string) {
    this.userSockets.get(userId)?.delete(socketId);
    if (this.userSockets.get(userId)?.size === 0) {
      this.userSockets.delete(userId);
    }
    this.socketUsers.delete(socketId);
  }

  getUserIdBySocket(socketId: string): string | undefined {
    return this.socketUsers.get(socketId);
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  private async sendPendingChanges(client: Socket, userId: string) {
    // Fetch unapplied changes from DB
    const pendingChanges = await this.prisma.changeLog.findMany({
      where: {
        userId,
        applied: false,
        createdAt: { gte: client.handshake.time ? new Date(client.handshake.time) : new Date(0) },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    if (pendingChanges.length > 0) {
      client.emit('sync:pending', { changes: pendingChanges });
    }
  }

  private async verifyToken(token: string): Promise<any> {
    // Verify JWT and return user payload
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}
```

### Redis Adapter (Multi-Instance Support)

```typescript
// src/socket/redis-adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

```typescript
// main.ts
import { RedisIoAdapter } from './socket/redis-adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(3001);
}
```

---

## 3. Conflict Detection Algorithm

```typescript
// src/sync/conflict-detector.ts
interface Change {
  id: string;
  entityType: 'garment' | 'outfit' | 'calendar_event' | 'avatar';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  version: number;
  timestamp: string;
  userId: string;
  clientId: string;
}

interface Conflict {
  type: 'version_stale' | 'concurrent_modification' | 'delete_modify' | 'create_duplicate';
  localChange: Change;
  serverChange: Change;
  resolution: 'lww' | 'merge' | 'manual' | 'reject';
}

export class ConflictDetector {
  /**
   * Detect conflicts between incoming change and server state.
   */
  detectConflict(change: Change, currentState: any): Conflict | null {
    // 1. Version check (optimistic concurrency)
    if (currentState && change.version < currentState.version) {
      return {
        type: 'version_stale',
        localChange: change,
        serverChange: this.getLastChange(change.entityType, change.entityId),
        resolution: this.determineResolution(change, currentState),
      };
    }

    // 2. Delete after modify
    if (change.operation === 'update' && currentState?.deleted) {
      return {
        type: 'delete_modify',
        localChange: change,
        serverChange: {
          operation: 'delete',
          timestamp: currentState.deletedAt,
        } as any,
        resolution: 'reject',
      };
    }

    // 3. Modify after delete
    if (change.operation === 'delete' && !currentState) {
      return {
        type: 'delete_modify',
        localChange: change,
        serverChange: null,
        resolution: 'lww', // Already deleted, no conflict
      };
    }

    // 4. Duplicate creation (same entityId created elsewhere)
    if (change.operation === 'create' && currentState) {
      return {
        type: 'create_duplicate',
        localChange: change,
        serverChange: {
          id: `create:${change.entityType}:${change.entityId}`,
          version: currentState.version,
        } as any,
        resolution: 'reject',
      };
    }

    return null; // No conflict
  }

  /**
   * Determine resolution strategy based on change characteristics.
   */
  private determineResolution(change: Change, currentState: any): 'lww' | 'merge' | 'manual' {
    // Non-overlapping fields: merge
    const overlappingFields = this.getOverlappingFields(change.data, currentState);
    if (overlappingFields.length === 0) {
      return 'merge';
    }

    // Last-write-wins for scalar fields
    const nonMergeableFields = overlappingFields.filter(f => 
      typeof change.data[f] !== 'object' || change.data[f] === null
    );

    if (nonMergeableFields.length === overlappingFields.length) {
      return 'lww';
    }

    // Mixed: some fields can merge, others need LWW
    return 'merge';
  }

  private getOverlappingFields(localData: any, serverData: any): string[] {
    const localKeys = Object.keys(localData || {});
    const serverKeys = Object.keys(serverData || {});
    return localKeys.filter(k => serverKeys.includes(k));
  }

  private getLastChange(entityType: string, entityId: string): Change {
    // Fetch from change log
    return {} as Change; // Placeholder
  }
}
```

---

## 4. Last-Write-Wins Strategy

```typescript
// src/sync/lww-strategy.ts
import { ConflictDetector } from './conflict-detector';

export class LastWriteWinsStrategy {
  /**
   * Resolve conflict by accepting the most recent change.
   * Tiebreaker: if timestamps are equal (within tolerance), use clientId.
   */
  resolve(
    localChange: any,
    serverChange: any,
    timestampToleranceMs: number = 100,
  ): any {
    const localTime = new Date(localChange.timestamp).getTime();
    const serverTime = new Date(serverChange.timestamp).getTime();
    const timeDiff = Math.abs(localTime - serverTime);

    if (timeDiff > timestampToleranceMs) {
      // Clear winner by timestamp
      return localTime > serverTime ? localChange.data : serverChange.data;
    }

    // Tiebreaker: lexicographic comparison of client IDs
    return localChange.clientId > serverChange.clientId
      ? localChange.data
      : serverChange.data;
  }

  /**
   * Apply LWW resolution and save to database.
   */
  async apply(
    change: any,
    currentState: any,
    changeLog: any[],
  ): Promise<any> {
    const winnerData = this.resolve(change, currentState);

    // Update entity
    const updated = await this.prisma.$transaction(async (tx) => {
      // Apply changes
      const entity = await tx[change.entityType].update({
        where: { id: change.entityId },
        data: {
          ...winnerData,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Record in change log
      await tx.changeLog.create({
        data: {
          userId: change.userId,
          entityType: change.entityType,
          entityId: change.entityId,
          operation: change.operation,
          data: winnerData,
          version: entity.version,
          conflictResolution: 'lww',
          resolvedAt: new Date(),
        },
      });

      return entity;
    });

    return updated;
  }
}
```

---

## 5. Operational Transform Approach

```typescript
// src/sync/operational-transform.ts
interface Operation {
  type: 'insert' | 'delete' | 'update' | 'reorder';
  path: string[];           // JSON path to affected field
  value?: any;              // For insert/update
  position?: number;        // For array operations
  length?: number;          // For delete operations (string/array)
  clientId: string;
  seq: number;              // Client-side sequence number
}

export class OperationalTransform {
  /**
   * Transform operation A against operation B so they can be applied
   * in either order and produce the same result.
   */
  transform(a: Operation, b: Operation): { aPrime: Operation; bPrime: Operation } {
    // Same path: conflict
    if (this.pathsEqual(a.path, b.path)) {
      return this.transformSamePath(a, b);
    }

    // Different paths: no transformation needed
    return { aPrime: a, bPrime: b };
  }

  /**
   * Transform operations when they target the same path.
   */
  private transformSamePath(a: Operation, b: Operation): { aPrime: Operation; bPrime: Operation } {
    // String/array insert after another insert
    if (a.type === 'insert' && b.type === 'insert') {
      if (a.position! <= b.position!) {
        // B's insert happens after A's insert
        return {
          aPrime: a,
          bPrime: { ...b, position: b.position! + (a.length || 1) },
        };
      } else {
        return {
          aPrime: { ...a, position: a.position! + (b.length || 1) },
          bPrime: b,
        };
      }
    }

    // Insert + delete at same position
    if (a.type === 'insert' && b.type === 'delete') {
      if (a.position! <= b.position!) {
        return {
          aPrime: a,
          bPrime: { ...b, position: b.position! + (a.length || 1) },
        };
      }
      return { aPrime: a, bPrime: b };
    }

    if (a.type === 'delete' && b.type === 'insert') {
      if (a.position! < b.position!) {
        return { aPrime: a, bPrime: b };
      }
      return {
        aPrime: a,
        bPrime: { ...b, position: b.position! - (a.length || 1) },
      };
    }

    // Both delete: adjust indices
    if (a.type === 'delete' && b.type === 'delete') {
      if (a.position! < b.position!) {
        return {
          aPrime: a,
          bPrime: { ...b, position: b.position! - (a.length || 1) },
        };
      } else {
        return {
          aPrime: { ...a, position: a.position! - (b.length || 1) },
          bPrime: b,
        };
      }
    }

    // Update + update: LWW on the field
    return { aPrime: a, bPrime: b };
  }

  private pathsEqual(p1: string[], p2: string[]): boolean {
    return p1.length === p2.length && p1.every((v, i) => v === p2[i]);
  }
}
```

---

## 6. Conflict Resolution UI Pattern

```tsx
// components/sync/ConflictResolutionDialog.tsx
'use client';

import { useState } from 'react';

interface Conflict {
  entityType: string;
  entityName: string;
  localChanges: Record<string, any>;
  serverChanges: Record<string, any>;
  fieldDiffs: FieldDiff[];
}

interface FieldDiff {
  field: string;
  label: string;
  localValue: any;
  serverValue: any;
  resolution: 'local' | 'server' | 'custom';
  customValue?: any;
}

export function ConflictResolutionDialog({
  conflict,
  onResolve,
  onSkip,
}: {
  conflict: Conflict;
  onResolve: (resolutions: Record<string, any>) => void;
  onSkip: () => void;
}) {
  const [fieldDiffs, setFieldDiffs] = useState<FieldDiff[]>(
    conflict.fieldDiffs.map(f => ({ ...f, resolution: 'server' })),
  );

  const handleResolutionChange = (index: number, resolution: 'local' | 'server' | 'custom') => {
    setFieldDiffs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], resolution };
      return updated;
    });
  };

  const handleResolve = () => {
    const merged: Record<string, any> = {};
    fieldDiffs.forEach(diff => {
      if (diff.resolution === 'local') merged[diff.field] = diff.localValue;
      else if (diff.resolution === 'server') merged[diff.field] = diff.serverValue;
      else if (diff.resolution === 'custom') merged[diff.field] = diff.customValue;
    });
    onResolve(merged);
  };

  const allLocal = fieldDiffs.every(f => f.resolution === 'local');
  const allServer = fieldDiffs.every(f => f.resolution === 'server');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Sync Conflict Detected
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {conflict.entityType === 'garment' && 'A garment'}
            {conflict.entityType === 'outfit' && 'An outfit'}
            {conflict.entityType === 'calendar_event' && 'A calendar event'}
            {' '}"{conflict.entityName}" was modified on another device.
          </p>
        </div>

        <div className="p-4 space-y-4">
          {fieldDiffs.map((diff, index) => (
            <div key={diff.field} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{diff.label}</span>
                <div className="flex gap-1">
                  {['local', 'server', 'custom'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleResolutionChange(index, opt as any)}
                      className={`px-2 py-0.5 text-xs rounded ${
                        diff.resolution === opt
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {opt === 'local' ? 'Keep Mine' : opt === 'server' ? 'Keep Theirs' : 'Custom'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500 mb-1">Your Change</div>
                  <div className="font-mono">{JSON.stringify(diff.localValue)}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500 mb-1">Server Version</div>
                  <div className="font-mono">{JSON.stringify(diff.serverValue)}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setFieldDiffs(prev => prev.map(f => ({ ...f, resolution: 'local' })))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                allLocal ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Keep All My Changes
            </button>
            <button
              onClick={() => setFieldDiffs(prev => prev.map(f => ({ ...f, resolution: 'server' })))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                allServer ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accept Server Version
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Skip for Now
          </button>
          <button
            onClick={handleResolve}
            className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Apply Resolution
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Offline Queue and Replay

```typescript
// lib/sync/offline-queue.ts
interface QueuedChange {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

const STORAGE_KEY = 'offline_changes';

export class OfflineChangeQueue {
  private queue: QueuedChange[] = [];
  private processing = false;
  private maxRetries = 5;

  constructor() {
    this.loadFromStorage();
    window.addEventListener('online', () => this.processQueue());
  }

  enqueue(change: Omit<QueuedChange, 'id' | 'retryCount' | 'timestamp'>): void {
    this.queue.push({
      ...change,
      id: crypto.randomUUID(),
      retryCount: 0,
      timestamp: new Date().toISOString(),
    });
    this.saveToStorage();

    // Attempt immediate processing if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const socket = await this.getSocket();

    while (this.queue.length > 0) {
      const change = this.queue[0];

      try {
        const response = await this.sendChange(socket, change);

        if (response.conflict) {
          // Store conflict for UI handling
          this.handleConflict(response.conflict);
          this.queue.shift(); // Remove from queue (conflict handled separately)
        } else {
          this.queue.shift(); // Success, remove from queue
        }
      } catch (error) {
        change.retryCount++;
        change.lastError = error.message;

        if (change.retryCount >= this.maxRetries) {
          // Give up on this change
          this.queue.shift();
          this.notifyFailure(change);
        } else {
          // Exponential backoff: stop processing, will retry later
          break;
        }
      }
    }

    this.saveToStorage();
    this.processing = false;
  }

  private async sendChange(socket: any, change: QueuedChange): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 30000);

      socket.emit(`sync:${change.entityType}:${change.operation}`, change, (response: any) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getFailedChanges(): QueuedChange[] {
    return this.queue.filter(c => c.retryCount > 0);
  }

  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) this.queue = JSON.parse(stored);
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
  }

  private async getSocket(): Promise<any> {
    // Import socket client
    const { io } = await import('socket.io-client');
    return io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token: localStorage.getItem('auth_token') },
    });
  }

  private handleConflict(conflict: any): void {
    window.dispatchEvent(new CustomEvent('sync-conflict', { detail: conflict }));
  }

  private notifyFailure(change: QueuedChange): void {
    window.dispatchEvent(new CustomEvent('sync-failed', { detail: change }));
  }
}

export const offlineQueue = new OfflineChangeQueue();
```

### Reconnection Strategy with Exponential Backoff

```typescript
// lib/sync/socket-client.ts
import { io, Socket } from 'socket.io-client';

export class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private maxDelay = 30000;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.baseDelay,
      reconnectionDelayMax: this.maxDelay,
      randomizationFactor: 0.3,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;

      // Custom backoff: exponential with jitter
      const delay = Math.min(
        this.baseDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
        this.maxDelay,
      );

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.socket?.close();
      }
    });

    // Re-register stored event listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(cb => this.socket?.on(event, cb));
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => reject(new Error('Emit timeout')), 30000);
      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClient();
```

---

## 8. Event Ordering and Deduplication

```typescript
// src/sync/event-ordering.ts
interface Event {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  version: number;
  timestamp: string;
  userId: string;
  data: any;
}

export class EventOrderingService {
  private receivedEvents = new Map<string, Set<string>>(); // entityType:entityId -> Set<eventId>

  /**
   * Ensure events are processed in correct order.
   * Drop duplicates and reorder out-of-sequence events.
   */
  async processEvent(event: Event): Promise<'accepted' | 'duplicate' | 'out_of_order'> {
    const key = `${event.entityType}:${event.entityId}`;

    // Deduplication
    if (!this.receivedEvents.has(key)) {
      this.receivedEvents.set(key, new Set());
    }

    if (this.receivedEvents.get(key)!.has(event.id)) {
      return 'duplicate';
    }

    this.receivedEvents.get(key)!.add(event.id);

    // Version check
    const currentVersion = await this.getCurrentVersion(event.entityType, event.entityId);

    if (event.version <= currentVersion) {
      return 'duplicate'; // Already applied
    }

    if (event.version > currentVersion + 1) {
      // Gap detected: queue this event, request missing versions
      await this.queueForLater(event);
      await this.requestMissingVersions(event, currentVersion + 1, event.version - 1);
      return 'out_of_order';
    }

    return 'accepted';
  }

  private async getCurrentVersion(entityType: string, entityId: string): Promise<number> {
    const entity = await this.prisma[entityType].findUnique({
      where: { id: entityId },
      select: { version: true },
    });
    return entity?.version || 0;
  }

  private async queueForLater(event: Event): Promise<void> {
    await this.prisma.pendingEvent.create({
      data: {
        eventId: event.id,
        entityType: event.entityType,
        entityId: event.entityId,
        version: event.version,
        data: event.data,
        receivedAt: new Date(),
      },
    });
  }

  private async requestMissingVersions(event: Event, from: number, to: number): Promise<void> {
    // Emit request for missing versions via WebSocket
    eventBus.emit('sync:request-versions', {
      entityType: event.entityType,
      entityId: event.entityId,
      fromVersion: from,
      toVersion: to,
      requestorId: event.userId,
    });
  }

  /**
   * Process queued out-of-order events when gap is filled.
   */
  async onGapFilled(entityType: string, entityId: string, version: number): Promise<void> {
    const nextEvent = await this.prisma.pendingEvent.findFirst({
      where: {
        entityType,
        entityId,
        version: version + 1,
      },
      orderBy: { version: 'asc' },
    });

    if (nextEvent) {
      // Process and recurse
      await this.applyEvent(nextEvent);
      await this.prisma.pendingEvent.delete({ where: { id: nextEvent.id } });
      await this.onGapFilled(entityType, entityId, version + 1);
    }
  }
}
```

---

## 9. Room-Based User Isolation

```typescript
// src/socket/room-manager.ts
export class RoomManager {
  /**
   * Users can only receive events for their own data.
   * Each user has private rooms:
   * - user:{userId}
   * - garments:{userId}
   * - outfits:{userId}
   * - calendar:{userId}
   */

  joinUserRooms(socket: Socket, userId: string): void {
    socket.join(`user:${userId}`);
    socket.join(`garments:${userId}`);
    socket.join(`outfits:${userId}`);
    socket.join(`calendar:${userId}`);
    socket.join(`presence:${userId}`);
  }

  leaveUserRooms(socket: Socket, userId: string): void {
    socket.leave(`user:${userId}`);
    socket.leave(`garments:${userId}`);
    socket.leave(`outfits:${userId}`);
    socket.leave(`calendar:${userId}`);
    socket.leave(`presence:${userId}`);
  }

  /**
   * Emit event to all sockets owned by a specific user.
   */
  emitToUser(server: Server, userId: string, event: string, data: any): void {
    server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit to all user's sockets for a specific entity type.
   */
  emitToEntityRoom(
    server: Server,
    userId: string,
    entityType: 'garments' | 'outfits' | 'calendar',
    event: string,
    data: any,
  ): void {
    server.to(`${entityType}:${userId}`).emit(event, data);
  }
}
```

---

## 10. Presence Detection

```typescript
// src/socket/presence.service.ts
@Injectable()
export class PresenceService {
  private onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private HEARTBEAT_TIMEOUT = 30000; // 30 seconds

  constructor(private readonly gateway: SocketGateway) {
    // Cleanup stale heartbeats every 15 seconds
    setInterval(() => this.cleanupStaleUsers(), 15000);
  }

  markOnline(userId: string, socketId: string): void {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
  }

  markOffline(userId: string, socketId: string): void {
    this.onlineUsers.get(userId)?.delete(socketId);
    if (this.onlineUsers.get(userId)?.size === 0) {
      this.onlineUsers.delete(userId);
    }
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }

  getOnlineUsers(userIds: string[]): Map<string, boolean> {
    const result = new Map<string, boolean>();
    userIds.forEach(uid => result.set(uid, this.isOnline(uid)));
    return result;
  }

  getOnlineCount(): number {
    return this.onlineUsers.size;
  }

  private cleanupStaleUsers(): void {
    const now = Date.now();
    this.onlineUsers.forEach((socketIds, userId) => {
      // Remove stale sockets (those without recent heartbeat)
      socketIds.forEach(socketId => {
        // Socket.IO handles this via ping/pong
      });
    });
  }
}
```

### Presence Frontend Hook

```typescript
// hooks/usePresence.ts
import { useEffect, useState, useCallback } from 'react';
import { socketClient } from '@/lib/sync/socket-client';

export function usePresence(userId: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Date>(new Date());

  useEffect(() => {
    if (!socketClient.isConnected()) return;

    socketClient.on('user:online', (data: { userId: string }) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId));
    });

    socketClient.on('user:offline', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    socketClient.on('presence:update', (data: { onlineUserIds: string[] }) => {
      setOnlineUsers(new Set(data.onlineUserIds));
    });

    return () => {
      socketClient.off('user:online', () => {});
      socketClient.off('user:offline', () => {});
      socketClient.off('presence:update', () => {});
    };
  }, [userId]);

  const getOnlineStatus = useCallback((targetUserId: string): boolean => {
    return onlineUsers.has(targetUserId);
  }, [onlineUsers]);

  return { isOnline, onlineUsers: Array.from(onlineUsers), getOnlineStatus, lastSeen };
}
```

---

## 11. Heartbeat Mechanism

```typescript
// src/socket/heartbeat.ts
export class HeartbeatService {
  private readonly HEARTBEAT_INTERVAL = 15000; // 15 seconds
  private readonly HEARTBEAT_TIMEOUT = 30000;  // 30 seconds

  startHeartbeat(socket: Socket): void {
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
        });
      } else {
        clearInterval(interval);
      }
    }, this.HEARTBEAT_INTERVAL);

    socket.on('disconnect', () => clearInterval(interval));
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { timestamp: string; socketId: string },
  ): void {
    // Update last heartbeat time in presence service
    const presenceService = socket.data.presenceService;
    if (presenceService) {
      // Touch the user's presence timestamp
    }
  }

  /**
   * Detect stale connections (no heartbeat within timeout).
   */
  monitorStaleConnections(server: Server): void {
    setInterval(() => {
      const sockets = server.sockets.sockets;
      sockets.forEach((socket) => {
        const lastHeartbeat = socket.data.lastHeartbeat;
        if (lastHeartbeat && Date.now() - lastHeartbeat > this.HEARTBEAT_TIMEOUT) {
          console.log(`Stale connection detected: ${socket.id}`);
          socket.disconnect(true);
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }
}
```

---

## 12. Full Sync Flow Diagram

```
Client Action (e.g., update garment name)
    │
    ├── Apply locally (optimistic update)
    │     └── Update Zustand store
    │     └── Update React state
    │
    ├── Queue in OfflineChangeQueue
    │
    ├── If online: send via Socket.IO
    │     └── Emit `garment:update`
    │           │
    │           └── Server receives
    │                 ├── ConflictDetector checks
    │                 │     ├── No conflict → apply
    │                 │     ├── Version stale → LWW or merge
    │                 │     └── Delete/modify conflict → reject
    │                 │
    │                 ├── Apply to database
    │                 │     └── Record in ChangeLog
    │                 │
    │                 └── Broadcast to user's rooms
    │                       └── `garment:updated` event
    │                             └── All connected devices receive
    │                                   └── Update local state
    │
    └── If offline: store in IndexedDB
          └── On reconnect: processQueue
                └── Send stored changes in order
                └── Handle conflicts per event
```

---

## 13. Performance Targets

| Metric | Target |
|--------|--------|
| Message delivery latency (p95) | < 100ms |
| Message delivery latency (p99) | < 500ms |
| Conflict detection time | < 10ms |
| Offline queue replay rate | > 1000 changes/sec |
| Reconnection time (warm) | < 1s |
| Reconnection time (cold) | < 5s |
| Heartbeat interval | 15s |
| Presence update propagation | < 2s |
| Max message size | 256KB |
| Concurrent connections per instance | 10,000 |
