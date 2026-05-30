# Frontend Task Template

## TASK_ID: `FE-<TASK_ID>`

> **Title**: <TITLE>
>
> **Objective**: <OBJECTIVE — one clear sentence describing what this task accomplishes>

---

## CONTEXT FILES

List every file the agent must read before starting.

```
# Example:
src/app/wardrobe/page.tsx
src/components/wardrobe/WardrobeGrid.tsx
src/components/wardrobe/WardrobeItemCard.tsx
src/lib/api/wardrobe.ts
src/lib/stores/wardrobeStore.ts
src/types/wardrobe.ts
```

**Guidance**: Include the page or layout file, relevant components, the API client file for the module, the Zustand store slice, and TypeScript type definitions. Also include any shared UI components (Button, Modal, etc.) that will be used.

---

## ALLOWED FILES

Files the agent may modify.

```
src/app/wardrobe/
src/components/wardrobe/
src/lib/api/wardrobe.ts
src/lib/stores/wardrobeStore.ts
```

**Guidance**: Be specific. If the task is scoped to a single page, only allow that page's directory and its direct dependencies.

---

## FORBIDDEN FILES

Files the agent must NOT touch.

```
src/app/api/
src/lib/auth/
src/lib/stores/authStore.ts
src/components/ui/
tailwind.config.ts
```

**Guidance**: Protect global config, auth logic, shared UI primitives, and other pages/modules.

---

## REQUIREMENTS

Bullet-list of functional and non-functional requirements.

```
- [ ] Create `WardrobeFilterBar` component with dropdowns for category, brand, color
- [ ] Wire filter state to `wardrobeStore` — changing a filter should reset page to 1
- [ ] Use `useQuery` from TanStack Query to fetch filtered results with debounce (300ms)
- [ ] Show loading skeleton (use `Skeleton` from `@/components/ui/skeleton`) while fetching
- [ ] Show empty state illustration when no items match filters
- [ ] Show error toast on API failure — use `useToast` from `@/hooks/useToast`
- [ ] Responsive: single column on mobile, 4-column grid on desktop
- [ ] All text uses `next-intl` translation keys, not hardcoded strings
```

**Guidance**:
- **React component patterns**: Use functional components with arrow functions. Colocate styles with Tailwind classes. Extract reusable pieces into their own components. Prefer composition over props drilling.
- **State management**: Use Zustand stores for cross-component state (filters, pagination). Use TanStack Query for server state (API data). Keep URL params in sync with store for shareable URLs via `useSearchParams`.
- **API integration**: All API calls go through `@/lib/api/` modules using a shared `apiClient` (axios/fetch wrapper) that handles auth headers and error normalization. Use TanStack Query's `useQuery`/`useMutation` — never call `fetch`/`axios` directly in components.
- **Performance**: Memoize expensive computations with `useMemo`. Wrap event handlers in `useCallback` when passed as props. Use `React.memo` on list item components.

---

## ACCEPTANCE CRITERIA

Concrete, testable pass/fail conditions.

```
GIVEN the wardrobe page is loaded with 30 items
WHEN the user selects "Tops" from the category dropdown
THEN the URL updates to include ?category=tops&page=1
AND the grid shows only items with category === "tops"
AND the skeleton is shown for < 500ms during refetch

GIVEN the user has selected filters that match zero items
WHEN the filters are applied
THEN the empty state illustration is displayed
AND a message "No items match your filters" appears (using translation key)
AND the "Clear filters" button is visible and clickable

GIVEN an API call fails (network error / 500)
WHEN any filter is changed
THEN an error toast "Failed to load wardrobe items" appears
AND the previous results remain visible (stale data is not cleared)
```

**Guidance**: Write 3-5 scenarios that cover data loading, filtering, empty state, error state, and responsive layout. Use GIVEN/WHEN/THEN.

---

## EDGE CASES

```
- [ ] Rapid filter changes → only the latest request is processed (debounce + query cancellation)
- [ ] URL has invalid filter params (?category=invalid) → silently fall back to "all"
- [ ] Screen resizes from mobile to desktop → grid reflows without glitching
- [ ] Image fails to load → show placeholder with item initials/brand logo
- [ ] Very long brand name → text truncates with ellipsis, tooltip shows full name
```

**Guidance**: Think about rapid user interactions, malformed URL state, responsive breakpoints, asset loading failures, and overflowing content.

---

## TESTS REQUIRED

```
src/components/wardrobe/__tests__/WardrobeFilterBar.test.tsx
  - "renders category, brand, color dropdowns"
  - "calls store.setFilters on dropdown change"
  - "resets page to 1 when filter changes"

src/app/wardrobe/__tests__/page.test.tsx
  - "fetches items on mount using useQuery"
  - "shows skeleton while loading"
  - "shows empty state when items array is empty"
  - "shows error toast on query failure"
```

**Guidance**: Use Vitest + React Testing Library. Prefer testing behaviour over implementation. Mock API calls at the `@/lib/api` layer, not at the fetch level.

---

## EXPECTED OUTPUT

```
FILES CREATED:
  - src/components/wardrobe/WardrobeFilterBar.tsx
  - src/components/wardrobe/__tests__/WardrobeFilterBar.test.tsx

FILES MODIFIED:
  - src/app/wardrobe/page.tsx              (+15 lines)
  - src/lib/stores/wardrobeStore.ts        (+10 lines)
  - src/components/wardrobe/WardrobeGrid.tsx  (+8 lines)

All tests pass: npm run test -- --testPathPattern=wardrobe
Lint passes: npm run lint
TypeScript compiles: npm run typecheck
```

---

## Example: Well-Formed Frontend Task

```
TASK_ID: FE-0031
TITLE: Build outfit-of-the-day display card
OBJECTIVE: Create a responsive outfit card component that displays a generated outfit with item images, labels, and a "wear now" action.

CONTEXT FILES:
  src/app/outfit/page.tsx
  src/components/outfit/OutfitGenerator.tsx
  src/lib/api/outfit.ts
  src/lib/stores/outfitStore.ts
  src/types/outfit.ts
  src/components/ui/Card.tsx
  src/components/ui/Button.tsx
  src/components/ui/Badge.tsx

ALLOWED FILES:
  src/components/outfit/
  src/app/outfit/
  src/lib/stores/outfitStore.ts

FORBIDDEN FILES:
  src/components/ui/
  src/lib/stores/authStore.ts
  src/app/api/

REQUIREMENTS:
  - [ ] `OutfitCard` component receives `outfit: OutfitWithItems` prop
  - [ ] Displays hero image (full-body render) as the card background
  - [ ] Overlays item labels (shirt: "Nike Dri-FIT", pants: "Levi's 501") at bottom
  - [ ] "Wear Now" button logs the outfit as worn via `useMutation`
  - [ ] Shows success toast after logging
  - [ ] Optimistic update: card greys out immediately after clicking "Wear Now"
  - [ ] Responsive: full width on mobile, max-w-sm on desktop

ACCEPTANCE CRITERIA:
  GIVEN an outfit with 4 items
  WHEN the component renders
  THEN the hero image is visible
  AND all 4 item labels are displayed
  AND the "Wear Now" button is enabled

  GIVEN the user clicks "Wear Now"
  WHEN the mutation succeeds
  THEN a success toast appears
  AND the card shows a "worn today" badge replacing the button

EDGE CASES:
  - [ ] Outfit has no items → show fallback message
  - [ ] Hero image fails → show gradient placeholder
  - [ ] "Wear Now" clicked twice → mutation is idempotent (no duplicate toasts)

TESTS REQUIRED:
  src/components/outfit/__tests__/OutfitCard.test.tsx

EXPECTED OUTPUT:
  FILES CREATED:
    - src/components/outfit/OutfitCard.tsx
    - src/components/outfit/__tests__/OutfitCard.test.tsx
  FILES MODIFIED:
    - src/app/outfit/page.tsx
  Tests pass, lint passes, typecheck passes.
```
