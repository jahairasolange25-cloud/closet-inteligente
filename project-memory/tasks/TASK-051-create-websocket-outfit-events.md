# TASK-051

# Create WebSocket Outfit Events

## OBJECTIVE

Implement WebSocket event emission for outfit operations. When an outfit is created, updated, or recommended, the server emits real-time events to the user's room for live UI updates.

## CONTEXT FILES

- `backend/src/websocket/websocket.gateway.ts`
- `backend/src/websocket/websocket.module.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/outfits.controller.ts`

## ALLOWED FILES

- `backend/src/websocket/websocket.gateway.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/outfits.controller.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. In `WebSocketGateway`, add methods:
   - `emitOutfitCreated(userId: string, outfit: Outfit)`: Emit `outfit:created` to room `user:<userId>`.
   - `emitOutfitUpdated(userId: string, outfit: Outfit)`: Emit `outfit:updated` to room `user:<userId>`.
   - `emitOutfitDeleted(userId: string, outfitId: string)`: Emit `outfit:deleted` to room `user:<userId>`.
   - `emitOutfitRecommended(userId: string, suggestions: object)`: Emit `outfit:recommended` to room `user:<userId>`.

2. In `OutfitsService`:
   - After `create()`, emit `outfit:created` with the full outfit.
   - After `update()`, emit `outfit:updated` with the full outfit.
   - After `softDelete()`, emit `outfit:deleted` with the outfit ID.
   - After `recommend()`, emit `outfit:recommended` with the suggestions object.

3. Event payloads:
   - `outfit:created`: Full outfit object with garments.
   - `outfit:updated`: Full updated outfit object with garments.
   - `outfit:deleted`: `{ id: string, deleted_at: string }`.
   - `outfit:recommended`: `{ suggestions: [...], meta: {...} }`.

## ACCEPTANCE CRITERIA

- Creating an outfit emits `outfit:created` to the user's WebSocket room.
- Updating an outfit emits `outfit:updated`.
- Deleting an outfit emits `outfit:deleted`.
- Calling recommend emits `outfit:recommended`.
- Events are emitted after successful database operations.
- If WebSocket is unavailable, outfit operations still succeed.

## EDGE CASES

- Events must be emitted after the DB transaction completes.
- If the outfit update does not change any fields, still emit the event (the version increments).
- Multiple connected clients for the same user all receive the event.
- Graceful degradation if WebSocket is not initialized.

## TESTS REQUIRED

- Unit test: `OutfitsService.create()` emits outfit:created.
- Unit test: `OutfitsService.update()` emits outfit:updated.
- Unit test: `OutfitsService.softDelete()` emits outfit:deleted.
- Unit test: `OutfitsService.recommend()` emits outfit:recommended.
- Integration test: WebSocket client receives outfit:created after POST /outfits.

## EXPECTED OUTPUT

- Updated `backend/src/websocket/websocket.gateway.ts` with outfit emit methods.
- Updated `backend/src/outfits/outfits.service.ts` with event emission calls.
- All tests pass.
