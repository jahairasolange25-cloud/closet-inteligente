# Frontend Runtime Known Issues

> **Last Updated:** 2026-05-27
> Temporary hacks, deferred tech debt, stubs, and intentionally incomplete flows.

---

## Stubs

| Location | What Is Stubbed | Replace With |
|---|---|---|
| `src/lib/r3f/canvas-wrapper.tsx` | Placeholder canvas; no real 3D mesh | Three.js mesh + avatar model from AI pipeline |
| `src/lib/r3f/renderer-provider.tsx` | R3F context stub | Full WebGL renderer config |
| `features/avatar/avatar-page.tsx` | Avatar generation flow partial | Wire to real `/avatars/generate` + polling for job status |

---

## Deferred / Intentionally Incomplete Flows

| Feature | Gap | Reason Deferred |
|---|---|---|
| Outfit drag-and-drop builder | D-001 not implemented | Requires `@dnd-kit` or similar; complex mobile handling |
| Calendar week/day modes | D-002 not implemented | Monthly view covers MVP; weekly/daily adds complexity |
| Outfit conflict prevention | D-003 not implemented | Needs calendar + outfit state query; deferred to later phase |
| Weather adapter layer | D-004 not implemented | DO NOT call external APIs yet per instructions |
| Upload queue UX (multi-file, progress bars) | C-003 not implemented | `garment-image-uploader.tsx` only supports single file |
| Cost-per-wear calculation | C-001 partial | Backend has no `purchase_price` column; needs migration |
| Reduced-motion support | G-004 not implemented | Framer Motion supports `useReducedMotion`; not wired |
| Screen reader labels audit | G-002 partial | Some areas covered; comprehensive audit not done |
| Keyboard navigation for drag-drop | G-001 partial | Standard focusable elements covered; drag-drop fallback missing |
| Playwright E2E tests | H-002 not started | Docker required; not available on this machine |
| Integration tests | H-001 not started | Docker required for DB |

---

## Temporary Hacks / Tech Debt

| Location | Issue | Should Fix When |
|---|---|---|
| `auth-store.ts` — `isRestoring: true` initial state | On first render Zustand store starts as `isRestoring: true`. If Zustand `persist` rehydrates faster than `restoreSession()` fires, there's a brief unnecessary spinner. | When auth is stable and well-tested |
| `garments.service.ts` — `findOneRaw()` private helper | `findOne()` now returns `GarmentResponse`; internal calls that need the raw `Garment` row use `findOneRaw()`. Minor code smell; could be unified with an overload | Next garment refactor |
| `use-garments.ts` — `Map<readonly unknown[], ...>` cast | React Query `getQueriesData` key type is `readonly unknown[]`; stored in a Map and cast back. Technically safe but not elegant | React Query v6 if it improves key typing |
| `websocket.ts` — `console.warn` in development only | Connection errors logged only in `NODE_ENV === 'development'`. Prod telemetry not wired. | When Sentry / error tracking is added |
| `garment-detail-page.tsx` — no `season` edit field | `season` is an updateable field in the backend but the inline edit form omits it | Low priority; add alongside a garment edit modal |
| Migration 000036 uses `IF NOT EXISTS` guards | Migration is safe to re-run but doesn't track applied state properly | When proper migration runner (with applied table) is added |

---

## Known Missing Backend Support

| Feature | Frontend Assumes | Backend Reality |
|---|---|---|
| `purchase_price` / cost-per-wear | Frontend could show cost-per-wear if price existed | No column in DB; needs migration + DTO update |
| Garment `restore` (soft-delete undo) | Detail page has no restore button | No `DELETE /garments/:id/restore` endpoint exists |
| Outfit `color_tags` / style scoring | `OutfitRecommendation.score` exists | Score is heuristic (LRU + color group), not ML |
| Real-time garment pipeline events | WS listens for `garment:pipeline_complete` | Pipeline is simulated (`SimulatedAIPipelineAdapter`) |
