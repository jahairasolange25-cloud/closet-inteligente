import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Pool } from 'pg';
import { Namespace, Socket } from 'socket.io';
import { Server } from 'socket.io';
import { DATABASE_POOL } from '../database/database.module';
import { logSecurityEvent, createSecurityEvent } from '../common/utils/security-logger';

const CONNECTION_RATE_LIMIT_WINDOW_MS = 60000;
const MAX_CONNECTIONS_PER_WINDOW = 10;
const MAX_MESSAGES_PER_MINUTE = 60;
const MESSAGE_RATE_WINDOW_MS = 60000;

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  serveClient: false,
})
@Injectable()
export class WebSocketGatewayImpl implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebSocketGatewayImpl.name);

  @WebSocketServer()
  server!: Server;

  private readonly syncLocks = new Map<string, Promise<void>>();
  private readonly reconnectTracker = new Map<string, { count: number; windowStart: number }>();
  private readonly messageRateTracker = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private readonly jwtService: JwtService,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  afterInit(server: Namespace): void {
    server.use(async (socket: Socket, next: (err?: Error) => void) => {
      const token = this.extractToken(socket);

      if (!token) {
        next(new Error('AUTHENTICATION_FAILED'));
        return;
      }

      try {
        const payload = await this.jwtService.verifyAsync(token);
        socket.data.user = { id: payload.sub, email: payload.email };
        next();
      } catch {
        logSecurityEvent(createSecurityEvent('AUTH_FAILURE', {
          ip: this.getClientIp(socket),
          metadata: { websocket: true, clientId: socket.id },
        }));
        next(new Error('AUTHENTICATION_FAILED'));
      }
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const clientIp = this.getClientIp(client);

    if (!this.checkConnectionRateLimit(client, clientIp)) {
      client.emit('auth_error', { message: 'CONNECTION_RATE_LIMITED' });
      client.disconnect();
      return;
    }

    const userId = client.data.user?.id;
    if (!userId) {
      client.disconnect();
      return;
    }

    const room = `user:${userId}`;
    client.join(room);

    this.logger.log(`Client connected: ${client.id} (user: ${userId}, ip: ${clientIp})`);

    client.emit('connected', {
      userId,
      connected_at: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.user?.id;
    this.logger.log(`Client disconnected: ${client.id} (user: ${userId ?? 'unknown'})`);

    for (const room of client.rooms) {
      if (room !== client.id) {
        client.leave(room);
      }
    }
  }

  emitGarmentCreated(userId: string, garment: any): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping garment:created');
      return;
    }
    this.server.to(`user:${userId}`).emit('garment:created', garment);
  }

  emitGarmentUpdated(userId: string, garment: any): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping garment:updated');
      return;
    }
    this.server.to(`user:${userId}`).emit('garment:updated', garment);
  }

  emitGarmentDeleted(userId: string, garmentId: string, deletedAt: Date): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping garment:deleted');
      return;
    }
    this.server.to(`user:${userId}`).emit('garment:deleted', { id: garmentId, deleted_at: deletedAt.toISOString() });
  }

  emitOutfitCreated(userId: string, outfit: any): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping outfit:created');
      return;
    }
    this.server.to(`user:${userId}`).emit('outfit:created', outfit);
  }

  emitOutfitUpdated(userId: string, outfit: any): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping outfit:updated');
      return;
    }
    this.server.to(`user:${userId}`).emit('outfit:updated', outfit);
  }

  emitOutfitDeleted(userId: string, outfitId: string, deletedAt: Date): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping outfit:deleted');
      return;
    }
    this.server.to(`user:${userId}`).emit('outfit:deleted', { id: outfitId, deleted_at: deletedAt.toISOString() });
  }

  emitOutfitRecommended(userId: string, suggestions: any): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping outfit:recommended');
      return;
    }
    this.server.to(`user:${userId}`).emit('outfit:recommended', suggestions);
  }

  private isValidEntityType(type: string): type is 'outfit' | 'garment' {
    return type === 'outfit' || type === 'garment';
  }

  private checkMessageRateLimit(client: Socket): boolean {
    const clientKey = client.id;
    const now = Date.now();
    let tracker = this.messageRateTracker.get(clientKey);

    if (!tracker || now - tracker.windowStart > MESSAGE_RATE_WINDOW_MS) {
      tracker = { count: 0, windowStart: now };
      this.messageRateTracker.set(clientKey, tracker);
    }

    tracker.count++;

    if (tracker.count > MAX_MESSAGES_PER_MINUTE) {
      this.logger.warn(`Message rate limit exceeded for client ${client.id}`);
      client.emit('error', { message: 'MESSAGE_RATE_LIMITED' });
      return false;
    }

    return true;
  }

  private checkConnectionRateLimit(client: Socket, clientIp: string): boolean {
    const key = clientIp || client.id;
    const now = Date.now();
    let tracker = this.reconnectTracker.get(key);

    if (!tracker || now - tracker.windowStart > CONNECTION_RATE_LIMIT_WINDOW_MS) {
      tracker = { count: 0, windowStart: now };
      this.reconnectTracker.set(key, tracker);
    }

    tracker.count++;

    if (tracker.count > MAX_CONNECTIONS_PER_WINDOW) {
      this.logger.warn(`Connection rate limit exceeded for ${key}`);
      logSecurityEvent(createSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip: clientIp,
        metadata: { websocket: true, clientId: client.id, reason: 'connection_throttle' },
      }));
      return false;
    }

    return true;
  }

  @SubscribeMessage('sync:conflict')
  async handleSyncConflict(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): Promise<void> {
    if (!this.checkMessageRateLimit(client)) return;

    const userId = client.data.user?.id;
    if (!userId || !payload || typeof payload !== 'object') {
      client.emit('sync:error', { message: 'INVALID_PAYLOAD' });
      return;
    }

    const { entity_type, entity_id, client_version, changes } = payload;
    if (!entity_type || !entity_id || client_version === undefined || !changes || typeof changes !== 'object') {
      client.emit('sync:error', { message: 'INVALID_PAYLOAD' });
      return;
    }

    if (!this.isValidEntityType(entity_type)) {
      client.emit('sync:error', { message: 'INVALID_ENTITY_TYPE' });
      return;
    }

    const lockKey = `${entity_type}:${entity_id}`;
    const previous = this.syncLocks.get(lockKey) ?? Promise.resolve();
    const current = previous.then(async () => {
      let dbEntity: any;

      if (entity_type === 'outfit') {
        const result = await this.pool.query(
          `SELECT * FROM outfits WHERE id = $1 AND user_id = $2`,
          [entity_id, userId],
        );
        dbEntity = result.rows[0];
      } else {
        const result = await this.pool.query(
          `SELECT * FROM garments WHERE id = $1 AND user_id = $2`,
          [entity_id, userId],
        );
        dbEntity = result.rows[0];
      }

      if (!dbEntity) {
        client.emit('sync:error', { message: 'ENTITY_NOT_FOUND', entity_type, entity_id });
        return;
      }

      if (dbEntity.deleted_at) {
        client.emit('sync:resolved', {
          entity_type,
          entity_id,
          resolved_entity: dbEntity,
          resolution_strategy: 'server_wins',
          deleted: true,
        });
        return;
      }

      const serverVersionField = entity_type === 'outfit' ? 'version' : null;
      const serverVersion = serverVersionField ? (dbEntity as any).version : null;

      const clientFields = Object.keys(changes);
      let resolution_strategy: 'server_wins' | 'merged';

      const resolvableFields = entity_type === 'outfit'
        ? ['name', 'type']
        : ['name', 'state', 'brand', 'size', 'color', 'season'];

      const overlappingFields = clientFields.filter((f) => resolvableFields.includes(f) && dbEntity[f] !== undefined);

      if (overlappingFields.length > 0 && serverVersion !== null && client_version < serverVersion) {
        resolution_strategy = 'server_wins';
      } else {
        resolution_strategy = 'merged';
      }

      if (resolution_strategy === 'merged') {
        const sets: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        for (const field of clientFields) {
          if (resolvableFields.includes(field) && changes[field] !== undefined) {
            sets.push(`${field} = $${paramIndex++}`);
            params.push(changes[field]);
          }
        }

        if (sets.length > 0) {
          if (serverVersionField) {
            sets.push(`${serverVersionField} = ${serverVersionField} + 1`);
          }

          params.push(entity_id, userId);
          if (entity_type === 'outfit') {
            await this.pool.query(
              `UPDATE outfits SET ${sets.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
              params,
            );
          } else {
            await this.pool.query(
              `UPDATE garments SET ${sets.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
              params,
            );
          }
        }

        const resolvedResult = entity_type === 'outfit'
          ? await this.pool.query(`SELECT * FROM outfits WHERE id = $1`, [entity_id])
          : await this.pool.query(`SELECT * FROM garments WHERE id = $1`, [entity_id]);

        this.logger.log(`Sync merged for ${entity_type}:${entity_id} by user ${userId}`);
        client.emit('sync:resolved', {
          entity_type,
          entity_id,
          resolved_entity: resolvedResult.rows[0] ?? dbEntity,
          resolution_strategy: 'merged',
        });
      } else {
        this.logger.log(`Sync server_wins for ${entity_type}:${entity_id} by user ${userId}`);
        client.emit('sync:resolved', {
          entity_type,
          entity_id,
          resolved_entity: dbEntity,
          resolution_strategy: 'server_wins',
        });
      }
    });

    this.syncLocks.set(lockKey, current);
    await current;
  }

  @SubscribeMessage('sync:status')
  async handleSyncStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): Promise<void> {
    if (!this.checkMessageRateLimit(client)) return;

    const userId = client.data.user?.id;
    if (!userId || !payload || typeof payload !== 'object') {
      client.emit('sync:error', { message: 'INVALID_PAYLOAD' });
      return;
    }

    const { entity_type, entity_id } = payload;
    if (!entity_type || !entity_id) {
      client.emit('sync:error', { message: 'INVALID_PAYLOAD' });
      return;
    }

    if (!this.isValidEntityType(entity_type)) {
      client.emit('sync:error', { message: 'INVALID_ENTITY_TYPE' });
      return;
    }

    let result: any;
    if (entity_type === 'outfit') {
      result = await this.pool.query(
        `SELECT version, updated_at FROM outfits WHERE id = $1 AND user_id = $2`,
        [entity_id, userId],
      );
    } else {
      result = await this.pool.query(
        `SELECT updated_at FROM garments WHERE id = $1 AND user_id = $2`,
        [entity_id, userId],
      );
    }

    if (!result.rows[0]) {
      client.emit('sync:error', { message: 'ENTITY_NOT_FOUND', entity_type, entity_id });
      return;
    }

    client.emit('sync:status:response', {
      entity_type,
      entity_id,
      version: result.rows[0].version ?? null,
      updated_at: result.rows[0].updated_at,
    });
  }

  private getClientIp(client: Socket): string {
    const forwarded = client.handshake.headers['x-forwarded-for'];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]?.trim()) || 'unknown';
    }
    return client.handshake.address || 'unknown';
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token;
    if (auth) return auth;

    const queryToken = client.handshake.query?.token as string | undefined;
    if (queryToken) return queryToken;

    const header = client.handshake.headers?.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }
}
