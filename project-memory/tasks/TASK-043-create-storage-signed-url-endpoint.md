# TASK-043

# Create Storage Signed URL Endpoint (GET /storage/signed-url)

## OBJECTIVE

Implement the `GET /storage/signed-url` endpoint that generates a signed URL for accessing private files from Cloudinary. This enables secure, time-limited access to user-specific assets.

## CONTEXT FILES

- `backend/src/storage/storage.controller.ts`
- `backend/src/storage/storage.service.ts`

## ALLOWED FILES

- `backend/src/storage/storage.controller.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/dto/signed-url.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `SignedUrlDto`:
   - `public_id`: string, `@IsString()`, `@IsNotEmpty()` — the Cloudinary public ID.
   - `expires_in`: number (optional), `@IsOptional()`, `@IsInt()`, `@Min(60)`, `@Max(86400)` — seconds until URL expires (default 3600, max 86400).
   - `transformations`: string (optional), `@IsOptional()`, `@IsString()` — optional image transformations (e.g., "w_200,h_200,c_fill").

2. In `StorageService.generateSignedUrl(publicId: string, expiresIn: number, transformations?: string)`:
   - Generate a signed Cloudinary URL with the given public_id.
   - Apply transformations if provided.
   - Set expiration timestamp (current time + expires_in seconds).
   - Use Cloudinary's `url()` method with `sign_url: true` and `type: 'authenticated'`.
   - Return `{ url: string, expires_at: ISO string, public_id: string }`.

3. In `StorageController.getSignedUrl()`:
   - Use `@UseGuards(JwtAuthGuard)`.
   - Accept `@Query() dto: SignedUrlDto`.
   - Return HTTP 200.

## ACCEPTANCE CRITERIA

- `GET /storage/signed-url?public_id=abc123` returns HTTP 200 with a signed URL.
- `GET /storage/signed-url?public_id=abc123&expires_in=3600` returns a URL valid for 1 hour.
- `GET /storage/signed-url?public_id=abc123&transformations=w_200,h_200,c_fill` includes transformations in the URL.
- `GET /storage/signed-url` without `public_id` returns HTTP 400.
- `GET /storage/signed-url` with `expires_in` less than 60 returns HTTP 400.
- `GET /storage/signed-url` with `expires_in` more than 86400 returns HTTP 400.
- The returned URL is signed and cannot be accessed after expiry.
- Without auth returns HTTP 401.

## EDGE CASES

- The signed URL must use the authenticated delivery type (not public).
- If Cloudinary is not configured for private files, the URL generation should still work but note that public files would be accessible without signing.
- Expiration times must be rounded down to the nearest second.
- Transformations string must be validated against Cloudinary's transformation syntax.

## TESTS REQUIRED

- Unit test: `StorageService.generateSignedUrl()` generates correctly signed URL.
- Unit test: `SignedUrlDto` validates parameters.
- Integration test: `GET /storage/signed-url` returns 200 with signed URL.
- Integration test: `GET /storage/signed-url` with missing public_id returns 400.

## EXPECTED OUTPUT

- `backend/src/storage/dto/signed-url.dto.ts`
- Updated `backend/src/storage/storage.service.ts` with `generateSignedUrl()` method.
- Updated `backend/src/storage/storage.controller.ts` with `GET /storage/signed-url`.
- All tests pass.
