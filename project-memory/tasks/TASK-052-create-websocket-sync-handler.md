# TASK-052

# Create WebSocket Sync Event Handler

## OBJECTIVE

Implement the WebSocket event handlers for client-to-server sync events. The gateway handles `sync:conflict` events (when the client detects a version conflict) and emits `sync:resolved` events (when the server resolves the conflict).

## CONTEXT FILES

- `backend/src/websocket/websocket.gateway.ts`
- `backend/src/outfits/outfits.service.ts`

## ALLOWED FILES

- `backend/src/websocket/websocket.gateway.ts`
- `backend/src/websocket/websocket.module.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. In `WebSocketGateway`, add event listeners (decorated with `@SubscribeMessage`):

   a. `sync:conflict` — Client sends when it detects a version mismatch:
      - Payload: `{ entity_type: 'outfit' | 'garment', entity_id: string, client_version: number, server_version: number, changes: object }`.
      - Server validates the payload and user owns the entity.
      - Server resolves the conflict by:
        - If `entity_type === 'outfit'`: Fetch the latest outfit from DB, compute diff.
        - If the client's changes can be auto-merged (non-overlapping fields), apply them.
        - If there is a real conflict, the server version wins (last-write-wins).
      - Emit `sync:resolved` back to the client:
        - `{ entity_type, entity_id, resolved_entity: object, resolution_strategy: 'server_wins' | 'merged' }`.

   b. `sync:status` — Client requests sync status:
      - Payload: `{ entity_type: string, entity_id: string }`.
      - Server responds with the current version and `updated_at` timestamp.
      - Emit `sync:status:response` with `{ entity_type, entity_id, version, updated_at }`.

2. Conflict resolution logic:
   - Auto-merge: if client and server modified different fields, merge them.
   - Server wins: if same field was modified on both sides, keep server value.
   - Log all conflicts and resolutions for audit purposes.

3. Error handling:
   - If `entity_type` is invalid, emit `sync:error` with `INVALID_ENTITY_TYPE`.
   - If `entity_id` does not exist or user does not own it, emit `sync:error` with `ENTITY_NOT_FOUND`.
   - If payload is malformed, emit `sync:error` with `INVALID_PAYLOAD`.

## ACCEPTANCE CRITERIA

- Client emits `sync:conflict` → server resolves and emits `sync:resolved`.
- Client emits `sync:status` → server responds with `sync:status:response`.
- Invalid entity type returns `sync:error` with `INVALID_ENTITY_TYPE`.
- Non-existent entity returns `sync:error` with `ENTITY_NOT_FOUND`.
- Non-owned entity returns `sync:error` with `ENTITY_NOT_FOUND`.
- Auto-merge works when fields do not overlap.
- Server-wins strategy works when fields overlap.

## EDGE CASES

- The `changes` object in `sync:conflict` may contain nested fields (handle shallow merge only for MVP).
- If the entity was soft-deleted on the server, the sync:resolved should indicate this.
- Concurrent sync requests for the same entity should be queued or handled one at a time.
- All sync events must be authenticated (only the entity owner can sync).
- The sync handler must not deadlock if the entity is being updated via the REST API simultaneously.

## TESTS REQUIRED

- Unit test: `sync:conflict` handler resolves with server-wins strategy.
- Unit test: `sync:conflict` handler auto-merges non-overlapping fields.
- Unit test: `sync:status` handler returns current version.
- Unit test: Invalid entity type returns error.
- Integration test: Full sync flow via WebSocket connection.

## EXPECTED OUTPUT

- Updated `backend/src/websocket/websocket.gateway.ts` with sync event handlers.
- All tests pass.
