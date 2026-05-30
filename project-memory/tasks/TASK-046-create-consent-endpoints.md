# TASK-046

# Create Consent Endpoints (GET and PATCH /consent)

## OBJECTIVE

Implement `GET /consent` and `PATCH /consent` endpoints that allow authenticated users to view and update their data processing consent preferences (GDPR compliance), including AI processing consent, data sharing, and marketing communications.

## CONTEXT FILES

- `backend/src/consent/consent.controller.ts`
- `backend/src/consent/consent.service.ts`
- `backend/src/consent/consent.module.ts`
- `backend/src/consent/dto/update-consent.dto.ts`

## ALLOWED FILES

- `backend/src/consent/consent.controller.ts`
- `backend/src/consent/consent.service.ts`
- `backend/src/consent/consent.module.ts`
- `backend/src/consent/dto/update-consent.dto.ts` (create)

## FORBIDDEN FILES

- Any file in `frontend/`
- Any file in `ai/`
- Any database migration files

## REQUIREMENTS

1. Create `UpdateConsentDto` with all fields optional:
   - `ai_processing`: boolean (optional), `@IsOptional()`, `@IsBoolean()` — consent to AI garment analysis
   - `data_sharing`: boolean (optional), `@IsOptional()`, `@IsBoolean()` — share anonymized data for improvements
   - `marketing_emails`: boolean (optional), `@IsOptional()`, `@IsBoolean()` — receive marketing communications
   - `third_party_integrations`: boolean (optional), `@IsOptional()`, `@IsBoolean()` — allow third-party service integrations
   - `consent_version`: string (optional), `@IsOptional()`, `@IsString()` — version of the consent terms accepted

2. In `ConsentService.getConsent(userId: string)`:
   - Query the user's consent preferences (from a `user_consent` table or a JSONB field on the users table).
   - If not set, return default values (all `false` except `ai_processing` which defaults to `true` for platform functionality).
   - Return `{ ai_processing, data_sharing, marketing_emails, third_party_integrations, consent_version, updated_at }`.

3. In `ConsentService.updateConsent(userId: string, dto: UpdateConsentDto)`:
   - Find existing consent (or create new defaults).
   - Update only the provided fields.
   - Set `updated_at = NOW()`.
   - If `consent_version` is provided, store it with a timestamp.
   - Return the updated consent.

4. In `ConsentController`:
   - `GET /consent`: Return current consent preferences.
   - `PATCH /consent`: Update consent preferences.
   - Both use `@UseGuards(JwtAuthGuard)`.

## ACCEPTANCE CRITERIA

- `GET /consent` returns HTTP 200 with all consent fields.
- `PATCH /consent` with `{ ai_processing: false }` updates only that field.
- `PATCH /consent` with `{ consent_version: 'v2' }` updates the version string.
- `PATCH /consent` with empty body returns current consent unchanged.
- Both endpoints without auth return HTTP 401.
- Default values: `ai_processing: true`, others `false`.

## EDGE CASES

- If the user has no consent record, auto-create defaults on first GET.
- Changing `ai_processing` to `false` should stop the AI pipeline from processing new uploads (application-level check, not in this task).
- A log entry should be created whenever consent is changed (audit trail for GDPR compliance).
- The `consent_version` field tracks which version of the terms the user agreed to (e.g., `'2026-05-01-v1'`).
- Past consent versions must be stored historically (if using a separate table, not just overwriting).

## TESTS REQUIRED

- Unit test: `ConsentService.getConsent()` returns defaults for new user.
- Unit test: `ConsentService.updateConsent()` updates only provided fields.
- Integration test: `GET /consent` returns 200.
- Integration test: `PATCH /consent` updates settings.

## EXPECTED OUTPUT

- `backend/src/consent/dto/update-consent.dto.ts`
- `backend/src/consent/consent.service.ts` with get/update methods.
- `backend/src/consent/consent.controller.ts` with both endpoints.
- All tests pass.
