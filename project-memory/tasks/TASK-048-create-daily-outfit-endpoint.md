# TASK-048

# Create Daily Outfit Endpoint (GET /outfits/daily)

## OBJECTIVE

Implement the `GET /outfits/daily` endpoint that returns the outfit scheduled for today from the calendar. If no outfit is scheduled, it returns null with a suggestion to create one or use the recommendation endpoint.

## CONTEXT FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/calendar/calendar.service.ts`

## ALLOWED FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/calendar/calendar.service.ts`

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. In `OutfitsService.getDailyOutfit(userId: string)`:
   - Query the calendar for today's date with an outfit association.
   - If found, return the calendar event with the full outfit details (including garments).
   - If not found, return `{ outfit: null, suggestion: { message: 'No outfit planned for today. Would you like to create one?', actions: ['/outfits/recommend', '/outfits'] } }`.

2. In `OutfitsController.getDailyOutfit()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Return HTTP 200.

3. The response format:
   ```json
   {
     "outfit": null,
     "suggestion": {
       "message": "No outfit planned for today.",
       "actions": [
         { "label": "Get recommendation", "method": "POST", "path": "/outfits/recommend" },
         { "label": "Browse outfits", "method": "GET", "path": "/outfits" }
       ]
     }
   }
   ```

   Or when outfit exists:
   ```json
   {
     "outfit": { ...full outfit with garments... },
     "suggestion": null
   }
   ```

## ACCEPTANCE CRITERIA

- `GET /outfits/daily` when an outfit is scheduled for today returns HTTP 200 with the outfit.
- `GET /outfits/daily` when no outfit is scheduled returns HTTP 200 with `outfit: null` and `suggestion` object.
- The suggestion object includes actionable paths the frontend can use.
- Today is determined by the server's current date (UTC).
- Without auth returns HTTP 401.

## EDGE CASES

- "Today" means `event_date = CURRENT_DATE` in the server's timezone (use UTC for consistency).
- If there are multiple events today, return the most recently created one.
- The returned outfit must include all associated garments.
- If the scheduled outfit contains garments that are now in `washing` or `repair` state, include a `warning` field noting that some garments may need attention.

## TESTS REQUIRED

- Unit test: `OutfitsService.getDailyOutfit()` returns outfit for today.
- Unit test: `OutfitsService.getDailyOutfit()` returns null with suggestion when no outfit.
- Integration test: `GET /outfits/daily` returns 200.
- Integration test: `GET /outfits/daily` with no calendar event returns null outfit.

## EXPECTED OUTPUT

- Updated `backend/src/outfits/outfits.service.ts` with `getDailyOutfit()` method.
- Updated `backend/src/outfits/outfits.controller.ts` with `GET /outfits/daily`.
- All tests pass.
