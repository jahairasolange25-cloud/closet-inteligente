# TASK-050

# Create WebSocket Garment Events

## OBJECTIVE

Implement WebSocket event emission for garment CRUD operations. When a garment is created, updated, or deleted, the server emits real-time events to the affected user's room so the frontend can update without polling.

## CONTEXT FILES

- `backend/src/websocket/websocket.gateway.ts`
- `backend/src/websocket/websocket.module.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/garments.controller.ts`

## ALLOWED FILES

- `backend/src/websocket/websocket.gateway.ts`
- `backend/src/websocket/websocket.module.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/garments/garments.controller.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. In `WebSocketGateway`, add methods to emit garment events:
   - `emitGarmentCreated(userId: string, garment: Garment)`: Emit `garment:created` to room `user:<userId>`.
   - `emitGarmentUpdated(userId: string, garment: Garment)`: Emit `garment:updated` to room `user:<userId>`.
   - `emitGarmentDeleted(userId: string, garmentId: string)`: Emit `garment:deleted` to room `user:<userId>`.

2. In `GarmentsService`:
   - After `create()` successfully inserts a garment, call `WebSocketGateway.emitGarmentCreated()`.
   - After `update()` successfully updates a garment, call `WebSocketGateway.emitGarmentUpdated()`.
   - After `softDelete()` successfully soft-deletes a garment, call `WebSocketGateway.emitGarmentDeleted()`.

3. Event payloads:
   - `garment:created`: Full garment object.
   - `garment:updated`: Full updated garment object.
   - `garment:deleted`: `{ id: string, deleted_at: string }`.

4. Handle edge case where the WebSocket server is not initialized (graceful fallback — log a warning, do not throw).

## ACCEPTANCE CRITERIA

- Creating a garment via `POST /garments` emits `garment:created` to the user's WebSocket room.
- Updating a garment via `PATCH /garments/:id` emits `garment:updated` to the user's WebSocket room.
- Deleting a garment via `DELETE /garments/:id` emits `garment:deleted` to the user's WebSocket room.
- The event payload matches the specified format.
- If WebSocket is unavailable, the CRUD operations still succeed (graceful degradation).

## EDGE CASES

- Events must be emitted AFTER the database operation succeeds (not before).
- If the WebSocket module is not loaded, the event emission should not throw an error (dependency injection handles this via optional provider).
- Multiple connected clients for the same user all receive the event (Socket.IO room fan-out).
- Events should not be emitted if the WebSocket gateway is not initialized.

## TESTS REQUIRED

- Unit test: `GarmentsService.create()` calls emitGarmentCreated.
- Unit test: `GarmentsService.update()` calls emitGarmentUpdated.
- Unit test: `GarmentsService.softDelete()` calls emitGarmentDeleted.
- Integration test: WebSocket client receives garment:created after POST /garments.

## EXPECTED OUTPUT

- Updated `backend/src/websocket/websocket.gateway.ts` with emit methods.
- Updated `backend/src/garments/garments.service.ts` with event emission calls.
- All tests pass.
