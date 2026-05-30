# TASK-047

# Create Outfit Recommendation Endpoint (POST /outfits/recommend)

## OBJECTIVE

Implement the `POST /outfits/recommend` endpoint that generates outfit recommendations based on the user's available garments. The algorithm prioritizes available garments, checks color compatibility, and ensures garment rotation (least recently used garments are preferred). Returns the top 3 suggestions or partial suggestions with error details.

## CONTEXT FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/garments/garments.service.ts`
- `backend/src/outfits/dto/recommend-outfit.dto.ts`

## ALLOWED FILES

- `backend/src/outfits/outfits.controller.ts`
- `backend/src/outfits/outfits.service.ts`
- `backend/src/outfits/dto/recommend-outfit.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `RecommendOutfitDto`:
   - `type`: string (optional), `@IsOptional()`, `@IsEnum(OutfitType)` — desired outfit type (default: any)
   - `occasion`: string (optional), `@IsOptional()`, `@IsString()` — occasion description for context
   - `exclude_garment_ids`: array of UUIDs (optional), `@IsOptional()`, `@IsArray()`, `@IsUUID('4', { each: true })` — garments to exclude

2. In `OutfitsService.recommend(userId: string, dto: RecommendOutfitDto)`:
   - Fetch all available garments for the user (`state = 'available'`, `deleted_at IS NULL`).
   - Exclude garments in `exclude_garment_ids`.
   - Prioritize:
     a. Garments with lower `usage_count` (least used first — rotation).
     b. Garments with `last_used_at` farthest in the past.
     c. Garments matching the requested `type` (if provided, prefer that category).
   - Pick garments that form a valid outfit:
     - At least one upper garment (shirt, dresses).
     - At least one lower garment (pants, shoes).
   - Consider color compatibility:
     - Avoid clashing colors (use a simple color compatibility map).
     - Prefer complementary colors.
   - Generate up to 3 outfit suggestions.
   - For each suggestion, include the reasoning (why these garments were chosen).
   - If fewer than 3 suggestions can be generated, include partial suggestions with `reason` explaining what's missing.

3. Color compatibility (simplified):
   - Define compatible color groups: neutrals (black, white, gray, navy) go with everything.
   - Warm colors (red, orange, yellow, brown) go with neutrals.
   - Cool colors (blue, green, purple) go with neutrals.
   - Avoid warm+cool color pairing in the same outfit.

4. Return format:
   ```json
   {
     "suggestions": [
       {
         "garments": [
           { "id": "uuid", "name": "Blue Shirt", "type": "shirt", "color": "blue", ... },
           { "id": "uuid", "name": "Black Pants", "type": "pants", "color": "black", ... }
         ],
         "reason": "Least used shirt paired with versatile black pants"
       }
     ],
     "meta": {
       "total_suggestions": 3,
       "available_upper_count": 5,
       "available_lower_count": 3,
       "warning": null
     }
   }
   ```

## ACCEPTANCE CRITERIA

- `POST /outfits/recommend` returns HTTP 200 with up to 3 suggestions.
- Suggestions only include available garments (`state = 'available'`).
- Each suggestion includes at least one upper and one lower garment.
- Garments with lower usage count are preferred.
- Excluded garments are not used.
- If not enough upper or lower garments exist, `meta.warning` is set and fewer suggestions are returned.
- Without auth returns HTTP 401.

## EDGE CASES

- User with fewer than 2 garments returns a warning and 0 or minimal suggestions.
- User with all garments in `washing` or `stored` state returns a warning suggesting laundry.
- Color compatibility is a "soft" constraint: prefer compatible colors but still generate suggestions if no compatible pairing exists.
- `exclude_garment_ids` may include garments already in `washing` (they are already excluded by the availability filter).
- The recommendation should not suggest garments that are currently in use (borrowed, washing, repair).
- The `occasion` field is informational for future AI enhancement; for MVP, it does not affect the algorithm.

## TESTS REQUIRED

- Unit test: `OutfitsService.recommend()` returns valid outfit suggestions.
- Unit test: `OutfitsService.recommend()` prioritizes least used garments.
- Unit test: `OutfitsService.recommend()` respects excluded garments.
- Unit test: Insufficient garments return partial suggestions with warning.
- Integration test: `POST /outfits/recommend` returns 200 with suggestions.

## EXPECTED OUTPUT

- `backend/src/outfits/dto/recommend-outfit.dto.ts`
- Updated `backend/src/outfits/outfits.service.ts` with `recommend()` method.
- Updated `backend/src/outfits/outfits.controller.ts` with `POST /outfits/recommend`.
- All tests pass.
