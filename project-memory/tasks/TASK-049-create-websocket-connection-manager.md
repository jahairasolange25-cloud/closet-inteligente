# TASK-049

# Create WebSocket Connection Manager with Socket.IO

## OBJECTIVE

Create a Socket.IO gateway in NestJS that manages WebSocket connections with JWT authentication, connection/disconnection handling, and per-user room management. This enables real-time communication for garment and outfit events.

## CONTEXT FILES

- `backend/src/websocket/websocket.gateway.ts`
- `backend/src/websocket/websocket.module.ts`
- `backend/src/auth/auth.module.ts`
- `backend/package.json` (check for @nestjs/platform-socket.io, socket.io)

## ALLOWED FILES

- `backend/src/websocket/websocket.gateway.ts` (create)
- `backend/src/websocket/websocket.module.ts` (create)
- `backend/src/app.module.ts` (register WebSocket module)
- `backend/src/common/guards/ws-auth.guard.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `WebSocketGateway`:
   - Use `@WebSocketGateway({ namespace: '/ws', cors: { origin: '*', credentials: true } })`.
   - Configure with `serveClient: false`.

2. JWT Authentication for WebSocket:
   - Create `WsAuthGuard` that extracts the JWT token from:
     - The `auth.token` query parameter during connection handshake.
     - The `Authorization` header in the handshake.
   - Verify the JWT using `JwtService`.
   - If invalid, disconnect the socket with error `AUTHENTICATION_FAILED`.
   - If valid, attach the user payload to `socket.data.user`.

3. Connection handling:
   - `handleConnection(client: Socket)`:
     - Authenticate the client.
     - On success: log connection, join user to their personal room (`user:<userId>`).
     - Emit `connected` event with `{ userId, connected_at }`.
   - `handleDisconnect(client: Socket)`:
     - Log disconnection, leave all rooms.
     - Emit `disconnected` event (broadcast to user's room if needed).

4. Room management:
   - Each user gets a personal room: `user:<userId>`.
   - The server can emit events to specific rooms for targeted notifications.

5. Error handling:
   - If authentication fails, emit `auth_error` event with message and disconnect.

## ACCEPTANCE CRITERIA

- Client connects with a valid JWT token → connection is accepted, `connected` event is emitted.
- Client connects without a token → connection is rejected with `AUTHENTICATION_FAILED`.
- Client connects with an expired token → connection is rejected with `AUTHENTICATION_FAILED`.
- On connection, client is added to room `user:<userId>`.
- On disconnection, client is removed from all rooms.
- Server can emit events to a specific user's room.
- The gateway is namespaced under `/ws`.

## EDGE CASES

- Token can be sent as a query parameter (`ws://localhost:3001/ws?token=xxx`) or as an `Authorization` header in the initial HTTP request.
- If the token is valid but the user was deleted, connection should still be accepted (the user was valid at token issue time).
- Multiple connections from the same user should each join the same room separately (Socket.IO handles this).
- Connection must support CORS for the frontend domain (configure from environment variable `CORS_ORIGIN`).
- The gateway must not interfere with HTTP endpoints.

## TESTS REQUIRED

- Unit test: `WsAuthGuard` validates JWT and attaches user.
- Unit test: `WsAuthGuard` rejects invalid tokens.
- Integration test: Connect with valid token, verify room membership.
- Integration test: Connect without token, verify rejection.
- Integration test: Disconnect and verify cleanup.

## EXPECTED OUTPUT

- `backend/src/websocket/websocket.gateway.ts`
- `backend/src/websocket/websocket.module.ts`
- `backend/src/common/guards/ws-auth.guard.ts`
- All tests pass.
