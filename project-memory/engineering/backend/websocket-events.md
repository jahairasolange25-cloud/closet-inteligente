# WebSocket Events

## Overview

- **Library:** Socket.IO v4
- **Transport:** WebSocket with long-polling fallback
- **Path:** `/ws`
- **Namespace:** `/v1` (default)
- **Authentication:** JWT token in `auth` handshake option

---

## Connection Lifecycle

### Connection Flow

```
Client                          Server
  |                               |
  |--- connect (auth: {token}) -->|
  |                               |-- Verify JWT
  |                               |-- Join user room
  |                               |-- Broadcast user:online
  |<-- connected (socketId) ------|
  |<-- ack: { status: "ok" } ----|
  |                               |
  |--- ping --------------------->|
  |<-- pong ----------------------|
```

### Authentication Handshake

```typescript
// Client connection
const socket = io('wss://api.closetinteligente.com/ws', {
  auth: {
    token: 'Bearer <jwt_token>'
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5
});

// Server-side JWT verification
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const payload = await verifyJwt(token);
    socket.data.userId = payload.sub;
    socket.data.user = payload;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});
```

### Disconnection Flow

```
Client                          Server
  |                               |
  |--- disconnect --------------->|
  |                               |-- Broadcast user:offline
  |                               |-- Leave user room
  |                               |-- Cleanup subscriptions
```

### Reconnection Strategy

| Parameter | Value |
|-----------|-------|
| Initial delay | 1000ms |
| Max delay | 30000ms |
| Multiplier | 1.5x |
| Max attempts | 10 |
| Randomization | 0.5 |
| Timeout | 20000ms |

```typescript
// Server-side reconnection handling
socket.on('disconnect', (reason) => {
  logger.info(`Socket ${socket.id} disconnected: ${reason}`);

  // Delay cleanup to handle reconnection
  setTimeout(async () => {
    const isReconnected = await redis.exists(`socket:${socket.data.userId}`);
    if (!isReconnected) {
      io.to(`user:${socket.data.userId}`).emit('user:offline', {
        userId: socket.data.userId,
        lastSeen: new Date().toISOString()
      });
    }
  }, 10000); // 10 second grace period for reconnection
});
```

---

## Event Catalog

### Client-to-Server Events

#### `garment:create`

Create a garment via WebSocket (alternative to REST).

```typescript
// Client emits
{
  name: string;
  category: GarmentCategory;
  subcategory?: string;
  color?: string;
  brand?: string;
  size?: string;
  material?: string[];
  notes?: string;
  isFavorite?: boolean;
  tags?: string[];
}

// Server acknowledges
{
  status: "ok" | "error";
  data?: Garment;
  error?: {
    code: string;
    message: string;
  }
}
```

#### `garment:update`

Update a garment in real-time.

```typescript
// Client emits
{
  id: string; // garment UUID
  updates: Partial<GarmentUpdate>;
}

// Server acknowledges
{
  status: "ok" | "error";
  data?: Garment;
  error?: { code: string; message: string; }
}
```

#### `outfit:generate`

Request outfit preview generation.

```typescript
// Client emits
{
  outfitId: string;
}

// Server acknowledges
{
  status: "accepted";
  data: {
    jobId: string;
    estimatedTime: number;
  }
}
```

#### `sync:submit`

Submit offline changes for synchronization.

```typescript
// Client emits
{
  changes: Array<{
    entityType: "garment" | "outfit" | "avatar" | "calendar_entry";
    entityId: string;
    action: "create" | "update" | "delete";
    payload: any;
    checksum: string;
    timestamp: string; // ISO 8601
    clientVersion: string;
  }>;
}

// Server acknowledges
{
  status: "ok" | "conflict";
  data?: {
    synced: string[];       // IDs of successfully synced entities
    conflicts: Array<{
      entityType: string;
      entityId: string;
      serverVersion: any;
      clientVersion: any;
      message: string;
    }>;
  };
}
```

#### `sync:resolve`

Resolve a sync conflict.

```typescript
// Client emits
{
  entityType: "garment" | "outfit" | "avatar" | "calendar_entry";
  entityId: string;
  resolution: "use_server" | "use_client" | "merge";
  mergedData?: any; // required if resolution is "merge"
}

// Server acknowledges
{
  status: "ok" | "error";
  data?: {
    entityType: string;
    entityId: string;
    resolvedVersion: any;
  };
  error?: { code: string; message: string; }
}
```

#### `notification:read`

Mark notification as read.

```typescript
// Client emits
{
  notificationId: string;
}

// Server acknowledges
{
  status: "ok";
  data: { id: string; isRead: true; }
}
```

#### `user:typing`

Indicate user activity/typing.

```typescript
// Client emits
{
  inProgress: "garment_upload" | "outfit_edit" | null;
}
```

No server acknowledgement expected.

---

### Server-to-Client Events

#### `garment:created`

Broadcast when a new garment is processed.

```typescript
// Server emits
{
  garment: Garment;
  source: "user" | "ai";
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `garment:updated`

Broadcast when a garment is modified.

```typescript
// Server emits
{
  garment: Garment;
  changes: string[]; // list of changed fields
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `garment:deleted`

Broadcast when a garment is removed.

```typescript
// Server emits
{
  id: string;
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `garment:processing`

Real-time processing status updates.

```typescript
// Server emits
{
  garmentId: string;
  step: "upload" | "detection" | "background_removal" | "color_detection"
       | "classification" | "compression" | "thumbnail" | "metadata" | "embedding";
  progress: number;   // 0-100
  status: "processing" | "completed" | "failed";
  error?: string;
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `outfit:created`

Broadcast when a new outfit is created.

```typescript
// Server emits
{
  outfit: Outfit;
  source: "user" | "ai";
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `outfit:updated`

Broadcast when an outfit is modified (including preview generation progress).

```typescript
// Server emits
{
  outfit: Outfit;
  changes: string[];
  previewProgress?: {
    status: "generating" | "completed" | "failed";
    progress: number; // 0-100
    previewUrl?: string;
    error?: string;
  };
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `outfit:deleted`

Broadcast when an outfit is removed.

```typescript
// Server emits
{
  id: string;
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `outfit:recommended`

Broadcast when AI recommends new outfits.

```typescript
// Server emits
{
  recommendations: Array<{
    outfit: Outfit;
    score: number;
    reasons: string[];
  }>;
  context: {
    occasion?: string;
    season?: string;
    temperature?: number;
  };
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `avatar:generated`

Broadcast when avatar generation completes.

```typescript
// Server emits
{
  avatar: Avatar;
  status: "completed" | "failed";
  error?: string;
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `avatar:updated`

Broadcast when avatar is modified.

```typescript
// Server emits
{
  avatar: Avatar;
  changes: string[];
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `calendar:updated`

Broadcast when calendar entries change.

```typescript
// Server emits
{
  entry: CalendarEntry;
  action: "created" | "updated" | "deleted";
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `notification:new`

Real-time notification delivery.

```typescript
// Server emits
{
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, any> | null;
    isRead: false;
    createdAt: string;
  };
}
```

**Room:** `user:{userId}`

#### `sync:conflict`

Alert client about sync conflicts.

```typescript
// Server emits
{
  conflicts: Array<{
    entityType: string;
    entityId: string;
    serverVersion: any;
    clientVersion: any;
    serverChecksum: string;
    clientChecksum: string;
    message: string;
  }>;
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `sync:resolved`

Confirm conflict resolution.

```typescript
// Server emits
{
  entityType: string;
  entityId: string;
  resolution: "use_server" | "use_client" | "merge";
  timestamp: string;
}
```

**Room:** `user:{userId}`

#### `user:online`

Broadcast when a user comes online.

```typescript
// Server emits
{
  userId: string;
  timestamp: string;
}
```

**Room:** `user:{userId}` (for own status) or `global`

#### `user:offline`

Broadcast when a user goes offline.

```typescript
// Server emits
{
  userId: string;
  lastSeen: string; // ISO 8601
  timestamp: string;
}
```

**Room:** `user:{userId}` (for own status) or `global`

#### `analytics:insight`

Periodic analytics insights.

```typescript
// Server emits
{
  type: "tip" | "alert" | "achievement";
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}
```

**Room:** `user:{userId}`

---

## Room Management

### Room Naming Convention

| Room | Members | Purpose |
|------|---------|---------|
| `user:{userId}` | Single user | Private events |
| `global` | All connected users | Broadcast only for critical events |
| `garment:{garmentId}` | Owner + processing services | Processing progress |
| `avatar:{avatarId}` | Owner + rendering services | Generation progress |

### Room Joining

```typescript
// Server-side auto-join on authentication
io.on('connection', (socket) => {
  const userId = socket.data.userId;

  // Join user's private room
  socket.join(`user:${userId}`);

  // Set user as online in Redis
  redis.set(`socket:${userId}`, socket.id, 'EX', 60);

  // Broadcast online status
  io.to('global').emit('user:online', {
    userId,
    timestamp: new Date().toISOString()
  });

  // Handle garment-specific rooms
  socket.on('garment:subscribe', (garmentId: string) => {
    socket.join(`garment:${garmentId}`);
  });

  socket.on('garment:unsubscribe', (garmentId: string) => {
    socket.leave(`garment:${garmentId}`);
  });

  // Handle avatar-specific rooms
  socket.on('avatar:subscribe', (avatarId: string) => {
    socket.join(`avatar:${avatarId}`);
  });
});
```

---

## Error Handling

### Error Event Format

```typescript
// Server emits
{
  event: "error",
  data: {
    code: string;
    message: string;
    details?: any;
    originalEvent?: string;
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | No authentication token |
| AUTH_EXPIRED | Token expired |
| AUTH_INVALID | Token validation failed |
| RATE_LIMITED | Too many events |
| VALIDATION_ERROR | Invalid payload |
| NOT_FOUND | Resource not found |
| FORBIDDEN | No permission |
| CONFLICT | Sync conflict |
| INTERNAL_ERROR | Server error |
| PROCESSING_ERROR | AI/rendering error |

### Client-Side Error Handling

```typescript
socket.on('error', (error) => {
  switch (error.code) {
    case 'AUTH_EXPIRED':
      // Refresh token and reconnect
      refreshToken().then(() => socket.connect());
      break;
    case 'RATE_LIMITED':
      // Back off
      setTimeout(() => socket.emit(error.data.originalEvent, error.data.payload), 5000);
      break;
    case 'CONFLICT':
      // Show resolution UI
      handleSyncConflict(error.data);
      break;
    default:
      // Log and notify user
      console.error('WebSocket error:', error);
  }
});
```

---

## Event Rate Limiting

| Event Group | Events per second | Burst |
|-------------|-------------------|-------|
| garment:* | 10 | 20 |
| outfit:* | 5 | 10 |
| sync:* | 3 | 5 |
| user:* | 20 | 30 |

```typescript
// Server-side rate limiting
const rateLimiter = new RateLimiter({
  points: 10,
  duration: 1,
  blockDuration: 5
});

socket.use(async ([event, ...args], next) => {
  const eventGroup = event.split(':')[0];
  const limits = {
    garment: 10,
    outfit: 5,
    sync: 3,
    user: 20
  };

  const limit = limits[eventGroup] || 30;
  try {
    await rateLimiter.consume(`${socket.data.userId}:${eventGroup}`, 1);
    next();
  } catch (error) {
    next(new Error(`RATE_LIMITED: ${eventGroup} limit of ${limit}/s exceeded`));
  }
});
```

---

## Server Implementation (NestJS)

```typescript
// Gateway decorator
@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true
  },
  transports: ['websocket', 'polling']
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket) {
    // Connection logic
  }

  async handleDisconnect(socket: Socket) {
    // Disconnection logic
  }

  // Event handlers
  @SubscribeMessage('garment:create')
  async handleGarmentCreate(@ConnectedSocket() socket: Socket, @MessageBody() data: any) {
    // ...
  }
}
```
