# Storage / Media Task Template

## TASK_ID: `STORAGE-<TASK_ID>`

> **Title**: <TITLE>
>
> **Objective**: <OBJECTIVE — one clear sentence describing the storage or media processing change>

---

## CONTEXT FILES

```
# Example:
src/modules/media/media.service.ts
src/modules/media/media.controller.ts
src/modules/media/dto/upload-media.dto.ts
src/common/config/cloudinary.config.ts
src/common/interceptors/image-transform.interceptor.ts
prisma/schema.prisma  (media table)
```

**Guidance**: Include the media module (service, controller, DTOs), cloud storage config, image processing interceptors/utilities, and the relevant database schema.

---

## ALLOWED FILES

```
src/modules/media/
src/common/config/cloudinary.config.ts
```

---

## FORBIDDEN FILES

```
src/modules/auth/
src/modules/payments/
prisma/schema.prisma  (unless explicitly modifying the media schema)
src/common/config/database.config.ts
```

---

## REQUIREMENTS

```
- [ ] Upload endpoint: `POST /media/upload` accepts `multipart/form-data` with a single file
- [ ] Validate file type — allow only image/jpeg, image/png, image/webp
- [ ] Validate file size — max 10 MB
- [ ] Upload original to Cloudinary under `/users/{userId}/originals/`
- [ ] Auto-generate 3 Cloudinary transformations: thumbnail (150x150), medium (600x600), large (1200x1200)
- [ ] Save media record to database with: userId, originalUrl, thumbUrl, mediumUrl, largeUrl, mimeType, fileSize
- [ ] Return the media record in the response body
```

**Guidance on Cloudinary**:
- Use the Cloudinary Node.js SDK (`@cloudinary/url-gen` + `cloudinary`). Never construct URLs manually.
- Store transformation presets in `cloudinary.config.ts` as constants (not hardcoded in service methods).
- Use `upload_stream` for direct uploads. Set `public_id` to a UUID for deduplication.
- For secure uploads from the client, generate signed upload presets with expiration.
- Always set `folder` in upload options to organise assets: `/users/{userId}/{entityType}/`.

**Guidance on encryption**:
- Encrypt files at rest using Cloudinary's built-in AES encryption (`type: "authenticated"`) for sensitive uploads.
- For local file storage (dev), encrypt with `crypto.createCipheriv` using AES-256-GCM. Store the IV alongside the file.
- Never log file contents, encryption keys, or derived URLs.
- Database columns containing URLs should not be considered secrets — URLs are not access tokens.

**Guidance on image processing**:
- Resize server-side images before upload using `sharp` for local processing or let Cloudinary handle transformations.
- For AI pipeline input, always generate a standardized 1024x1024 version with `fit: "cover"`.
- Strip EXIF data on upload to reduce file size and remove potentially sensitive metadata.
- Generate a perceptual hash (pHash) for deduplication — compare incoming image hashes against existing ones.

---

## ACCEPTANCE CRITERIA

```
GIVEN a logged-in user
WHEN they upload a valid image (JPEG, 3MB)
THEN status is 201
AND response contains: id, originalUrl, thumbUrl, mediumUrl, largeUrl, mimeType, fileSize
AND all 4 URLs return 200 when fetched
AND the thumbnail is exactly 150x150 pixels

GIVEN a user uploads an invalid file type (.exe)
WHEN the request is submitted
THEN status is 400
AND response contains: "Only image/jpeg, image/png, image/webp are allowed"

GIVEN a user uploads a file larger than 10MB
WHEN the request is submitted
THEN status is 413
AND response contains: "File size exceeds 10 MB limit"
```

---

## EDGE CASES

```
- [ ] Empty file (0 bytes) → 400 "File is empty"
- [ ] No file attached → 400 "No file provided"
- [ ] Cloudinary upload fails (timeout, auth error) → 502 "Upload service unavailable", log error details
- [ ] Duplicate upload (identical image already uploaded) → return existing media record (200 OK), log "DUPLICATE_SKIPPED"
- [ ] Concurrent uploads by the same user → both succeed, no race condition on DB writes
```

---

## TESTS REQUIRED

```
src/modules/media/__tests__/media.service.spec.ts
  - "upload validates file type"
  - "upload validates file size"
  - "upload calls Cloudinary upload_stream with correct options"
  - "upload saves media record to database"
  - "upload returns existing record for duplicate image"
  - "upload handles Cloudinary failure gracefully"

src/modules/media/__tests__/media.controller.spec.ts
  - "POST /media/upload returns 201 on success"
  - "POST /media/upload returns 400 for invalid file type"
  - "POST /media/upload returns 413 for oversized file"
```

---

## EXPECTED OUTPUT

```
FILES MODIFIED:
  - src/modules/media/media.service.ts          (+40 lines)
  - src/modules/media/media.controller.ts       (+10 lines)
  - src/modules/media/dto/upload-media.dto.ts   (+8 lines)
  - src/common/config/cloudinary.config.ts      (+5 lines)

FILES CREATED:
  - src/modules/media/__tests__/media.service.spec.ts
  - src/modules/media/__tests__/media.controller.spec.ts

All tests pass, lint passes.
```

---

## Example: Well-Formed Storage Task

```
TASK_ID: STORAGE-0003
TITLE: Add perceptual hash deduplication on image upload
OBJECTIVE: Compute and store a pHash for every uploaded image, rejecting exact duplicates within the same user's library.

CONTEXT FILES:
  src/modules/media/media.service.ts
  src/modules/media/dto/upload-media.dto.ts
  prisma/schema.prisma

ALLOWED FILES:
  src/modules/media/
  prisma/schema.prisma

FORBIDDEN FILES:
  src/common/config/cloudinary.config.ts
  src/modules/auth/

REQUIREMENTS:
  - [ ] Compute pHash using `sharp` after receiving the file buffer
  - [ ] Check for existing media record with same userId AND same pHash
  - [ ] If duplicate found → return existing record, do NOT upload to Cloudinary
  - [ ] pHash column: `String` in Prisma, indexed
  - [ ] Hash collisions (identical hash, different image) → log warning and allow upload anyway

ACCEPTANCE CRITERIA:
  GIVEN a user uploads "photo-a.jpg"
  WHEN they upload the exact same file again
  THEN status is 200 (not 201)
  AND the same media ID is returned
  AND Cloudinary is NOT called a second time

EDGE CASES:
  - [ ] Two different images produce the same pHash (collision) → second upload proceeds normally
  - [ ] sharp fails to process the image → skip hashing, allow upload

TESTS REQUIRED:
  src/modules/media/__tests__/media-dedup.service.spec.ts
    - "detects identical upload by pHash"
    - "allows upload when pHash differs"
    - "allows upload on hash collision"
    - "skips hashing when sharp fails"

EXPECTED OUTPUT:
  FILES MODIFIED:
    - src/modules/media/media.service.ts
    - prisma/schema.prisma
  FILES CREATED:
    - src/modules/media/__tests__/media-dedup.service.spec.ts
  Tests pass, lint passes.
```
