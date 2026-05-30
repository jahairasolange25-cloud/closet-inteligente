# WebSocket Event Implementation Example — GarmentGateway

> **Purpose:** Reference implementation for WebSocket event patterns in the Closet Inteligente Digital project.
> **Pattern:** Gateway → Auth middleware → Room management → Event payloads → Client hooks
> **Stack:** NestJS, Socket.IO, TypeScript, React, TanStack Query, Zustand

---

## Architecture

```
┌──────────┐     Socket.IO      ┌──────────┐
│  Client   │ ◄──────────────► │  Server   │
│  (React)  │                  │ (NestJS)  │
└──────────┘                  └──────────┘
     │                             │
     │  Events:                    │  Events:
     │  garment:created            │  garment:created
     │  garment:updated            │  garment:updated
     │  garment:deleted            │  garment:deleted
     │  garment:pipeline:status    │  garment:pipeline:status
     │                             │
     │  Rooms:                     │  Rooms:
     │  user:{userId}              │  user:{userId}
     │  garment:{garmentId}        │  garment:{garmentId}
     └─────────────────────────────┘
```

---

## Payload Interfaces

```typescript
// shared/types/websocket-events.ts

export interface GarmentCreatedPayload {
  event: 'garment:created';
  data: {
    garmentId: string;
    userId: string;
    timestamp: string;
  };
}

export interface GarmentUpdatedPayload {
  event: 'garment:updated';
  data: {
    garmentId: string;
    userId: string;
    changes: string[];
    timestamp: string;
  };
}

export interface GarmentDeletedPayload {
  event: 'garment:deleted';
  data: {
    garmentId: string;
    userId: string;
    timestamp: string;
  };
}

export interface GarmentPipelineStatusPayload {
  event: 'garment:pipeline:status';
  data: {
    garmentId: string;
    userId: string;
    pipeline: 'segmentation' | 'color_analysis' | 'tagging' | 'quality_check';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message?: string;
    error?: string;
    timestamp: string;
  };
}

export type GarmentWebSocketEvent =
  | GarmentCreatedPayload
  | GarmentUpdatedPayload
  | GarmentDeletedPayload
  | GarmentPipelineStatusPayload;

export interface JoinRoomPayload {
  room: string;
}

export interface LeaveRoomPayload {
  room: string;
}

export interface ErrorResponse {
  event: 'error';
  data: {
    code: string;
    message: string;
    originalEvent?: string;
  };
}

export interface SyncConflictPayload {
  event: 'garment:sync:conflict';
  data: {
    garmentId: string;
    localVersion: number;
    serverVersion: number;
    localData: Record<string, unknown>;
    serverData: Record<string, unknown>;
    timestamp: string;
  };
}
```

---

## Server: Garment Gateway

```typescript
// backend/src/modules/garment/gateways/garment.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GarmentService } from '../services/garment.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

interface GarmentPipelineEvent {
  garmentId: string;
  pipeline: 'segmentation' | 'color_analysis' | 'tagging' | 'quality_check';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
}

@WebSocketGateway({
  namespace: '/garments',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class GarmentGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GarmentGateway.name);
  private readonly connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly garmentService: GarmentService,
  ) {}

  afterInit(): void {
    this.logger.log('Garment WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.query?.token as string;

      if (!token) {
        this.logger.warn(`Connection rejected: no token ${client.id}`);
        client.emit('error', {
          code: 'AUTH_REQUIRED',
          message: 'Authentication token is required',
        });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const authClient = client as AuthenticatedSocket;
      authClient.userId = payload.sub;
      authClient.userEmail = payload.email;

      const userRoom = `user:${payload.sub}`;
      await client.join(userRoom);

      this.connectedClients.set(client.id, authClient);

      this.logger.log(
        `Client connected: ${client.id} (user: ${payload.sub})`,
      );

      client.emit('connected', {
        userId: payload.sub,
        room: userRoom,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Connection rejected for ${client.id}: ${(error as Error).message}`,
      );
      client.emit('error', {
        code: 'AUTH_FAILED',
        message: 'Invalid or expired authentication token',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const authClient = client as AuthenticatedSocket;
    if (authClient.userId) {
      this.logger.log(
        `Client disconnected: ${client.id} (user: ${authClient.userId})`,
      );
    } else {
      this.logger.log(`Unauthenticated client disconnected: ${client.id}`);
    }
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('garment:watch')
  async handleWatchGarment(
    client: Socket,
    payload: { garmentId: string },
  ): Promise<void> {
    const authClient = client as AuthenticatedSocket;
    if (!authClient.userId) {
      throw new WsException('Unauthenticated');
    }

    if (!payload.garmentId) {
      throw new WsException('garmentId is required');
    }

    const garmentRoom = `garment:${payload.garmentId}`;
    await client.join(garmentRoom);

    this.logger.debug(
      `User ${authClient.userId} watching garment ${payload.garmentId}`,
    );

    client.emit('garment:watch:joined', {
      garmentId: payload.garmentId,
      room: garmentRoom,
    });
  }

  @SubscribeMessage('garment:unwatch')
  async handleUnwatchGarment(
    client: Socket,
    payload: { garmentId: string },
  ): Promise<void> {
    const authClient = client as AuthenticatedSocket;
    if (!authClient.userId) {
      throw new WsException('Unauthenticated');
    }

    const garmentRoom = `garment:${payload.garmentId}`;
    await client.leave(garmentRoom);

    this.logger.debug(
      `User ${authClient.userId} unwatched garment ${payload.garmentId}`,
    );
  }

  @SubscribeMessage('garment:join:room')
  async handleJoinRoom(
    client: Socket,
    payload: { room: string },
  ): Promise<void> {
    const authClient = client as AuthenticatedSocket;
    if (!authClient.userId) {
      throw new WsException('Unauthenticated');
    }

    if (!payload.room || typeof payload.room !== 'string') {
      throw new WsException('Valid room name is required');
    }

    await client.join(payload.room);
    this.logger.debug(`User ${authClient.userId} joined room ${payload.room}`);
  }

  @SubscribeMessage('garment:leave:room')
  async handleLeaveRoom(
    client: Socket,
    payload: { room: string },
  ): Promise<void> {
    const authClient = client as AuthenticatedSocket;
    if (!authClient.userId) {
      throw new WsException('Unauthenticated');
    }

    await client.leave(payload.room);
    this.logger.debug(
      `User ${authClient.userId} left room ${payload.room}`,
    );
  }

  emitGarmentCreated(garmentId: string, userId: string): void {
    const payload = {
      event: 'garment:created',
      data: {
        garmentId,
        userId,
        timestamp: new Date().toISOString(),
      },
    };

    this.server.to(`user:${userId}`).emit('garment:created', payload);
    this.logger.debug(
      `Emitted garment:created for ${garmentId} to user:${userId}`,
    );
  }

  emitGarmentUpdated(
    garmentId: string,
    userId: string,
    changes: string[],
  ): void {
    const payload = {
      event: 'garment:updated',
      data: {
        garmentId,
        userId,
        changes,
        timestamp: new Date().toISOString(),
      },
    };

    this.server
      .to(`user:${userId}`)
      .to(`garment:${garmentId}`)
      .emit('garment:updated', payload);

    this.logger.debug(
      `Emitted garment:updated for ${garmentId} (changes: ${changes.join(', ')})`,
    );
  }

  emitGarmentDeleted(garmentId: string, userId: string): void {
    const payload = {
      event: 'garment:deleted',
      data: {
        garmentId,
        userId,
        timestamp: new Date().toISOString(),
      },
    };

    this.server.to(`user:${userId}`).emit('garment:deleted', payload);
    this.server
      .to(`garment:${garmentId}`)
      .emit('garment:deleted', { ...payload, data: { ...payload.data, reason: 'removed' } });
    this.logger.debug(
      `Emitted garment:deleted for ${garmentId} to user:${userId}`,
    );
  }

  emitPipelineStatus(
    userId: string,
    event: GarmentPipelineEvent,
  ): void {
    const payload = {
      event: 'garment:pipeline:status',
      data: {
        garmentId: event.garmentId,
        userId,
        pipeline: event.pipeline,
        status: event.status,
        progress: event.progress,
        message: event.message,
        error: event.error,
        timestamp: new Date().toISOString(),
      },
    };

    this.server
      .to(`user:${userId}`)
      .to(`garment:${event.garmentId}`)
      .emit('garment:pipeline:status', payload);

    this.logger.debug(
      `Emitted garment:pipeline:status for ${event.garmentId}: ${event.pipeline}=${event.status} (${event.progress}%)`,
    );
  }

  emitSyncConflict(
    garmentId: string,
    userId: string,
    localVersion: number,
    serverVersion: number,
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>,
  ): void {
    const payload = {
      event: 'garment:sync:conflict',
      data: {
        garmentId,
        localVersion,
        serverVersion,
        localData,
        serverData,
        timestamp: new Date().toISOString(),
      },
    };

    this.server.to(`user:${userId}`).emit('garment:sync:conflict', payload);
    this.logger.warn(
      `Sync conflict for garment ${garmentId}: local=v${localVersion}, server=v${serverVersion}`,
    );
  }

  getConnectedUserIds(): string[] {
    const userIds: string[] = [];
    for (const client of this.connectedClients.values()) {
      if (client.userId && !userIds.includes(client.userId)) {
        userIds.push(client.userId);
      }
    }
    return userIds;
  }

  isUserConnected(userId: string): boolean {
    for (const client of this.connectedClients.values()) {
      if (client.userId === userId) return true;
    }
    return false;
  }
}
```

---

## Server: Event Emission in Service

```typescript
// backend/src/modules/garment/services/garment.service.ts (excerpt)

@Injectable()
export class GarmentService {
  constructor(
    private readonly garmentRepository: GarmentRepository,
    private readonly garmentGateway: GarmentGateway,
  ) {}

  async createGarment(userId: string, dto: CreateGarmentDto): Promise<GarmentData> {
    const garment = await this.garmentRepository.create({ ... });
    this.garmentGateway.emitGarmentCreated(garment.id, userId);
    return garment;
  }

  async updateGarment(id: string, userId: string, dto: UpdateGarmentDto): Promise<GarmentData> {
    const previous = await this.garmentRepository.findByIdAndUser(id, userId);
    const updated = await this.garmentRepository.update(id, data);

    const changedFields = Object.keys(data).filter(
      (key) => (data as Record<string, unknown>)[key] !== (previous as Record<string, unknown>)[key],
    );

    this.garmentGateway.emitGarmentUpdated(id, userId, changedFields);
    return updated;
  }

  async deleteGarment(id: string, userId: string): Promise<void> {
    await this.garmentRepository.delete(id);
    this.garmentGateway.emitGarmentDeleted(id, userId);
  }

  async reportPipelineProgress(
    userId: string,
    event: GarmentPipelineEvent,
  ): Promise<void> {
    this.garmentGateway.emitPipelineStatus(userId, event);
  }
}
```

---

## Server: Gateway Module Registration

```typescript
// backend/src/modules/garment/garment.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GarmentGateway } from './gateways/garment.gateway';
import { GarmentService } from './services/garment.service';
import { GarmentRepository } from './repositories/garment.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    GarmentGateway,
    GarmentService,
    GarmentRepository,
  ],
  exports: [GarmentGateway, GarmentService],
})
export class GarmentModule {}
```

---

## Client: useGarmentWebSocket Hook

```typescript
// frontend/src/hooks/useGarmentWebSocket.ts

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useGarmentStoreBase } from '@/src/stores/useGarmentStore';

interface UseGarmentWebSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnectedAt: string | null;
  error: string | null;
}

const RECONNECTION_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

export function useGarmentWebSocket(
  token: string | null,
  options: UseGarmentWebSocketOptions = {},
) {
  const {
    autoConnect = true,
    reconnectionAttempts = 10,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastConnectedAt: null,
    error: null,
  });

  const updateCachedGarment = useGarmentStoreBase(
    (state) => state.updateGarmentInCache,
  );
  const removeCachedGarment = useGarmentStoreBase(
    (state) => state.removeGarmentFromCache,
  );

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

    socketRef.current = io(`${wsUrl}/garments`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10000,
    });

    socketRef.current.on('connect', () => {
      reconnectAttemptRef.current = 0;
      setConnectionState({
        isConnected: true,
        isReconnecting: false,
        lastConnectedAt: new Date().toISOString(),
        error: null,
      });
    });

    socketRef.current.on('connected', (data: { userId: string; room: string }) => {
      console.debug(`WebSocket connected as user ${data.userId} in room ${data.room}`);
    });

    socketRef.current.on('garment:created', (payload) => {
      const { garmentId } = payload.data;
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      queryClient.invalidateQueries({ queryKey: ['garment', garmentId] });
    });

    socketRef.current.on('garment:updated', (payload) => {
      const { garmentId, changes } = payload.data;
      updateCachedGarment(garmentId, {});
      queryClient.invalidateQueries({ queryKey: ['garment', garmentId] });
      queryClient.invalidateQueries({ queryKey: ['garments'] });
    });

    socketRef.current.on('garment:deleted', (payload) => {
      const { garmentId } = payload.data;
      removeCachedGarment(garmentId);
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      queryClient.removeQueries({ queryKey: ['garment', garmentId] });
    });

    socketRef.current.on('garment:pipeline:status', (payload) => {
      const { garmentId, pipeline, status, progress, message } = payload.data;
      updateCachedGarment(garmentId, {
        pipelineStatus: {
          [pipeline]: { status, progress, message, updatedAt: new Date().toISOString() },
        },
      });
      queryClient.invalidateQueries({ queryKey: ['garment', garmentId] });
    });

    socketRef.current.on('garment:sync:conflict', (payload) => {
      const { garmentId, localVersion, serverVersion } = payload.data;
      console.warn(
        `Sync conflict for ${garmentId}: local v${localVersion} != server v${serverVersion}`,
      );
      queryClient.invalidateQueries({ queryKey: ['garment', garmentId] });
    });

    socketRef.current.on('garment:watch:joined', (data) => {
      console.debug(`Joined watch room for garment ${data.garmentId}`);
    });

    socketRef.current.on('disconnect', (reason) => {
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        error: `Disconnected: ${reason}`,
      }));

      if (
        reason !== 'io client disconnect' &&
        reason !== 'io server disconnect' &&
        reconnectAttemptRef.current < reconnectionAttempts
      ) {
        scheduleReconnect();
      }
    });

    socketRef.current.on('connect_error', (error) => {
      setConnectionState((prev) => ({
        ...prev,
        isReconnecting: true,
        error: error.message,
      }));

      if (reconnectAttemptRef.current < reconnectionAttempts) {
        scheduleReconnect();
      }
    });

    socketRef.current.on('error', (error) => {
      setConnectionState((prev) => ({
        ...prev,
        error: error.message ?? 'Unknown WebSocket error',
      }));
    });

    socketRef.current.connect();
  }, [
    token,
    reconnectionAttempts,
    queryClient,
    updateCachedGarment,
    removeCachedGarment,
  ]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    reconnectAttemptRef.current += 1;
    const delayIndex = Math.min(
      reconnectAttemptRef.current - 1,
      RECONNECTION_DELAYS.length - 1,
    );
    const delay = RECONNECTION_DELAYS[delayIndex];

    setConnectionState((prev) => ({
      ...prev,
      isReconnecting: true,
      error: `Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current}/${reconnectionAttempts})`,
    }));

    reconnectTimerRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
      connect();
    }, delay);
  }, [connect, reconnectionAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = reconnectionAttempts;

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionState({
      isConnected: false,
      isReconnecting: false,
      lastConnectedAt: null,
      error: null,
    });
  }, [reconnectionAttempts]);

  const watchGarment = useCallback((garmentId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('garment:watch', { garmentId });
    }
  }, []);

  const unwatchGarment = useCallback((garmentId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('garment:unwatch', { garmentId });
    }
  }, []);

  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('garment:join:room', { room });
    }
  }, []);

  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('garment:leave:room', { room });
    }
  }, []);

  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    ...connectionState,
    watchGarment,
    unwatchGarment,
    joinRoom,
    leaveRoom,
    reconnect: connect,
    disconnect,
  };
}
```

---

## Client: Garment WebSocket Provider

```typescript
// frontend/src/components/providers/GarmentWebSocketProvider.tsx

'use client';

import { useEffect, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useGarmentWebSocket } from '@/src/hooks/useGarmentWebSocket';

interface GarmentWebSocketProviderProps {
  children: ReactNode;
}

export function GarmentWebSocketProvider({
  children,
}: GarmentWebSocketProviderProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? null;

  const { isConnected, isReconnecting, error } = useGarmentWebSocket(token, {
    autoConnect: true,
    reconnectionAttempts: 10,
  });

  useEffect(() => {
    if (isConnected) {
      console.debug('Garment WebSocket connected');
    }
  }, [isConnected]);

  useEffect(() => {
    if (error) {
      console.warn('Garment WebSocket error:', error);
    }
  }, [error]);

  return (
    <>
      {isReconnecting && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 rounded-lg bg-warning-500 px-4 py-2 text-sm text-white shadow-lg"
        >
          Reconnecting to server...
        </div>
      )}
      {children}
    </>
  );
}
```

---

## Client: Using the Hook in a Component

```typescript
// frontend/src/components/garment/GarmentDetailPage.tsx

'use client';

import { useEffect } from 'react';
import { useGarmentWebSocket } from '@/src/hooks/useGarmentWebSocket';
import { useGarmentById } from '@/src/stores/useGarmentStore.selectors';

interface GarmentDetailPageProps {
  garmentId: string;
}

export function GarmentDetailPage({ garmentId }: GarmentDetailPageProps) {
  const { watchGarment, unwatchGarment } = useGarmentWebSocket(null);
  const garment = useGarmentById(garmentId);

  useEffect(() => {
    watchGarment(garmentId);

    return () => {
      unwatchGarment(garmentId);
    };
  }, [garmentId, watchGarment, unwatchGarment]);

  if (!garment) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{garment.name}</h1>
      {garment.pipelineStatus && (
        <div className="space-y-2">
          {Object.entries(garment.pipelineStatus as Record<string, { status: string; progress: number }>).map(
            ([pipeline, status]) => (
              <div key={pipeline}>
                <span>{pipeline}: {status.status}</span>
                <div className="h-2 w-full rounded bg-neutral-200">
                  <div
                    className="h-full rounded bg-primary-500 transition-all"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Key Patterns Demonstrated

| Pattern | Implementation |
|---------|---------------|
| **Gateway Decorator** | `@WebSocketGateway({ namespace, cors })` with typed options |
| **JWT Auth Middleware** | Token verification in `handleConnection` with `WsException` |
| **Room Management** | User-specific (`user:{userId}`) and garment-specific (`garment:{id}`) rooms |
| **Event Emission** | Typed payloads with `emitGarmentCreated`, `emitGarmentUpdated`, etc. |
| **Client Subscription** | `useGarmentWebSocket` hook with auto-reconnect and exponential backoff |
| **Reconnection Handler** | `RECONNECTION_DELAYS` array with exponential backoff and max attempts |
| **Connection State** | `ConnectionState` interface tracking `isConnected`, `isReconnecting`, `error` |
| **Sync Conflict Detection** | Version-based conflict event with local/server data comparison |
| **TanStack Query Integration** | Cache invalidation on WebSocket events |
| **Zustand Integration** | Direct cache updates for pipeline status events |
| **Error Handling** | Typed error events, connection error recovery, reconnection UI |
| **Cleanup** | Proper disconnect and listener removal in `useEffect` cleanup |
