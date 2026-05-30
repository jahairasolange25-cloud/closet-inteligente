# Bug Fix Task Template

## TASK_ID: `FIX-<TASK_ID>`

> **Title**: <TITLE — concise description of the bug, e.g. "Wardrobe filter resets page to 0 instead of 1">
>
> **Objective**: <OBJECTIVE — what correct behaviour looks like>

---

## CONTEXT FILES

```
# Example:
src/components/wardrobe/WardrobeFilterBar.tsx
src/lib/stores/wardrobeStore.ts
src/app/wardrobe/page.tsx
src/lib/api/wardrobe.ts
```

**Guidance**: Include the files most likely responsible for the bug based on the bug report. Also include test files if they exist.

---

## ALLOWED FILES

```
src/components/wardrobe/
src/lib/stores/wardrobeStore.ts
```

---

## FORBIDDEN FILES

```
src/app/api/
src/lib/auth/
```

---

## REQUIREMENTS

```
- [ ] Changing any filter must reset the page to 1
- [ ] URL search params must reflect the new page value: ?category=tops&page=1
- [ ] The API call must use page=1, not page=0
- [ ] Must not cause additional re-renders (use shallow compare in Zustand selector)
```

---

## REPRODUCTION STEPS

Exact, step-by-step instructions to reproduce the bug. The agent must be able to verify the fix.

```
1. Navigate to /wardrobe?page=2
2. Select "Tops" from the category dropdown
3. Observe: URL updates to ?category=tops&page=0
4. Observe: API call includes page=0
5. Expected: URL should be ?category=tops&page=1 and API call should use page=1
```

**Guidance**: Number each step. Include specific URLs, button labels, and keyboard interactions. Be precise about what the user sees vs. what is expected. Attach screenshots or HAR logs if available.

---

## ROOT CAUSE ANALYSIS

The agent MUST document the root cause found before implementing the fix.

```
## Root Cause
In `wardrobeStore.ts:24`, the `setFilters` action sets `page: 0` instead of `page: 1`:
```
setFilters: (filters) => set({ filters, page: 0 }),
```
This was likely a copy-paste error from the pagination initial state where `page: 0` was used as a loading sentinel.
```

**Guidance**: Require the agent to identify and document the exact line(s) and logic error before writing any code. This prevents guessing and makes the review process faster. The analysis should include:
- The file and line number of the defective code
- The incorrect value/logic
- Why it was wrong (understanding the intent vs. the implementation)
- How the fix addresses it (without yet writing the code)

---

## ACCEPTANCE CRITERIA

```
GIVEN the user is on /wardrobe?page=3 with active filters
WHEN they change any filter
THEN the URL updates to page=1
AND the API call uses page=1
AND the grid shows results from page 1

GIVEN the user is on /wardrobe with no page param
WHEN they change any filter
THEN the URL remains at page=1
AND the API call uses page=1
```

---

## EDGE CASES

```
- [ ] User is on page=1 and changes filter → stays on page=1
- [ ] User is on page=0 (malformed URL) → treated as page=1
- [ ] User changes filter back to the previously selected value → no duplicate API call (TanStack Query cache hit)
```

---

## TESTS REQUIRED

```
src/lib/stores/__tests__/wardrobeStore.test.ts
  - "setFilters resets page to 1"
  - "setFilters does not trigger API call if filter value unchanged"

src/components/wardrobe/__tests__/WardrobeFilterBar.test.tsx
  - "changing filter updates URL to page=1"
```

---

## EXPECTED OUTPUT

```
FILES MODIFIED:
  - src/lib/stores/wardrobeStore.ts  (1 line changed: page: 0 → page: 1)

FILES CREATED:
  - src/lib/stores/__tests__/wardrobeStore.test.ts

Verification:
  1. Follow reproduction steps — bug no longer occurs
  2. All tests pass: npm run test -- --testPathPattern=wardrobe
  3. Lint passes
```

---

## Example: Well-Formed Bug Fix Task

```
TASK_ID: FIX-0023
TITLE: Outfit generation fails silently when AI pipeline returns empty result
OBJECTIVE: When the AI pipeline returns no outfits, the frontend must show a clear "no compatible outfits" message instead of an infinite loading spinner.

CONTEXT FILES:
  src/app/outfit/page.tsx
  src/components/outfit/OutfitGenerator.tsx
  src/lib/api/outfit.ts
  ai/pipelines/outfit_generator/pipeline.py

ALLOWED FILES:
  src/app/outfit/page.tsx
  src/components/outfit/OutfitGenerator.tsx

FORBIDDEN FILES:
  ai/pipelines/

REQUIREMENTS:
  - [ ] When API returns { outfits: [] }, show "No compatible outfits found" message
  - [ ] Include a "Try again" button that re-triggers generation
  - [ ] The loading spinner must not spin indefinitely (add a 30s timeout)

REPRODUCTION STEPS:
  1. Log in as user with wardrobe containing only socks
  2. Navigate to /outfit
  3. Click "Generate Outfit"
  4. Observe: spinner shows for 60+ seconds, then eventually a generic error toast
  5. Expected: within 5 seconds, a message "No compatible outfits found" with "Try again" button

ROOT CAUSE ANALYSIS:
  In `src/components/outfit/OutfitGenerator.tsx:42`, the `useQuery` has `refetchInterval: 5000` to poll for generation results. But when the pipeline returns `{ outfits: [] }`, the query is marked as `isSuccess` with empty data, and the component only checks `isLoading` — it never checks `data.outfits.length === 0`. The spinner shows because the component incorrectly uses a local `isGenerating` state that is never set to `false` when the result is empty.

ACCEPTANCE CRITERIA:
  GIVEN the AI pipeline returns { outfits: [] }
  WHEN the response is received
  THEN the spinner is replaced with "No compatible outfits found"
  AND "Try again" button is visible

  GIVEN the AI pipeline returns { outfits: [...] } with 3 outfits
  WHEN the response is received
  THEN the outfits are displayed normally
  AND no empty-state message is shown

EDGE CASES:
  - [ ] API returns 500 → show error toast (existing behaviour preserved)
  - [ ] Network timeout > 30s → show "Generation timed out" message

TESTS REQUIRED:
  src/components/outfit/__tests__/OutfitGenerator.test.tsx
    - "shows spinner while loading"
    - "shows outfits when API returns results"
    - "shows empty state when API returns empty array"
    - "shows timeout message after 30 seconds"

EXPECTED OUTPUT:
  FILES MODIFIED:
    - src/components/outfit/OutfitGenerator.tsx
  FILES CREATED:
    - src/components/outfit/__tests__/OutfitGenerator.test.tsx
  Bug is no longer reproducible.
  All tests pass, lint passes.
```
