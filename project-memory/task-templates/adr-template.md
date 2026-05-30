# Architecture Decision Record (ADR) Template

## TITLE

**ADR-<NNN>: <Short descriptive title>**

> A short, present-tense phrase describing the decision. Example: "ADR-014: Use TanStack Query for server state management"

---

## STATUS

One of: `Proposed` | `Accepted` | `Deprecated` | `Superseded by ADR-<NNN>`

If `Superseded`, include a link to the superseding ADR.

---

## CONTEXT

The background, problem statement, and motivating factors that led to this decision.

```
**Problem**:
The wardrobe page makes 6 redundant API calls on mount, causing a 3-second render delay.

**Constraints**:
- Must work with existing REST API (no GraphQL migration)
- Must support caching, pagination, and optimistic updates
- Team is familiar with React Query (TanStack Query)
- Server state must stay in sync with URL search params

**Assumptions**:
- The API won't migrate from REST to GraphQL in the next 6 months
- Client-side caching (30s stale time) is acceptable for this data

**Alternatives evaluated**:
- SWR: similar functionality, smaller bundle, but less mature devtools
- Zustand + manual fetch: more control but requires building cache layer from scratch
- RTK Query: heavier dependency, team unfamiliar
```

**Guidance**: Describe the problem context in enough detail that someone reading 6 months later understands why this decision was made. Include constraints, assumptions, and a brief (2-4 item) list of alternatives that were seriously considered. Don't list straw-man alternatives you dismissed immediately.

---

## DECISION

The decision itself — what was chosen and what was rejected.

```
We will use TanStack Query (React Query v5) for all server state across the application.

Key details:
- Every API call will use useQuery or useMutation from @tanstack/react-query
- Default staleTime: 30 seconds, gcTime: 5 minutes
- Query keys follow the convention: ['entity', 'list', { filters }] or ['entity', id]
- Mutations invalidate related queries via queryClient.invalidateQueries
- The Zustand wardrobeStore will be refactored to remove server state — it will only hold UI state (dropdown open/closed, selected filter values)
- URL search params will be the source of truth for pagination and filters, synced via useSearchParams
```

**Guidance**: State the decision clearly and concretely. Include specific implementation details: library versions, key configuration values, naming conventions, and architectural patterns. The decision should be detailed enough that a developer can implement it without ambiguity.

---

## CONSEQUENCES

The positive and negative effects of this decision.

```
Positive:
+ Reduces API calls from 6 to 1 per page load
+ Built-in caching eliminates redundant network requests
+ Devtools enable debugging query state in development
+ Optimistic updates improve perceived performance
+ Standardises data fetching across all frontend modules

Negative:
- Adds 28KB to the bundle (gzipped ~9KB)
- Learning curve for team members unfamiliar with TanStack Query
- Migration cost: ~40 person-hours to refactor existing pages
- Caching adds complexity for real-time data (must invalidate manually)

Mitigations:
- Bundle impact tracked in performance budget (current budget: 300KB gzipped)
- Pair-programming sessions scheduled for migration
- Real-time data (notifications) will use Socket.IO directly, bypassing query cache
```

**Guidance**: List at least 3 positive and 3 negative consequences. Be honest about trade-offs. For each negative consequence, describe a mitigation strategy. This section is critical for future reviewers evaluating whether the decision should be revisited.

---

## ALTERNATIVES CONSIDERED

Detailed evaluation of alternatives that were seriously considered.

```
### Alternative 1: SWR (stale-while-revalidate)

Pros:
+ Smaller bundle (~6KB vs ~28KB)
+ Lighter API surface
+ Good performance characteristics

Cons:
- Fewer features (no query cancellation, no dependent queries)
- Less mature devtools
- Smaller community
- Mutation support is less ergonomic (useSWRMutation)

Why rejected: The team preferred TanStack Query's more comprehensive feature set for our complex filtering and pagination needs.

### Alternative 2: Zustand + fetch

Pros:
+ Zero additional dependencies
+ Full control over caching strategy
+ Team already knows Zustand

Cons:
- Must build and maintain cache layer (TTL, invalidation, deduplication)
- No built-in devtools for query debugging
- Must manually handle race conditions on filter changes
- Higher risk of bugs in the caching layer

Why rejected: Building a reliable cache layer would take 3-4x the migration time, with ongoing maintenance cost. Not a good use of team velocity.

### Alternative 3: RTK Query

Pros:
+ Tight integration with Redux (if we used Redux)
+ Powerful code generation from OpenAPI specs

Cons:
- We don't use Redux (we use Zustand)
- Would require adding Redux + RTK, doubling state management complexity
- Team unfamiliar with Redux toolkit
- Heavier bundle than TanStack Query

Why rejected: Does not fit our existing state management architecture. Adding Redux solely for data fetching is over-engineering.
```

**Guidance**: For each alternative, include 3-5 pros and cons, and a clear "Why rejected" statement. This section demonstrates that the decision was well-researched and helps future teams understand why other paths were not taken. Only include alternatives that were seriously discussed (at least 30 minutes of debate).

---

## DATE

The date the ADR was authored or accepted.

```
YYYY-MM-DD
```

---

## REVIEWERS

People who reviewed and approved the ADR.

```
- @tech-lead
- @senior-engineer
- @product-manager (for product-impacting decisions)
```

**Guidance**: List the people who must sign off on this ADR before it moves from Proposed to Accepted. For technical decisions, at minimum: tech lead and one senior engineer. For decisions with product impact (e.g., changing how data is displayed), include the PM.

---

## Full Example ADR

```
TITLE: ADR-014: Use TanStack Query for server state management
STATUS: Accepted
CONTEXT:
  The wardrobe page makes 6 redundant API calls on mount causing 3s render delay.
  Must support caching, pagination, optimistic updates.
  Team uses Zustand for UI state but has no standard for server state.
DECISION:
  Use TanStack Query (React Query v5). Default staleTime: 30s, gcTime: 5min.
  Query key convention: ['entity', 'list', { filters }].
  Zustand stores will only hold UI state going forward.
CONSEQUENCES:
  + Reduces API calls, standardizes data fetching, enables optimistic updates
  - Adds 9KB gzipped, requires team training, migration cost ~40h
  Mitigation: pair-programming sessions, bundle budget monitoring
ALTERNATIVES CONSIDERED:
  SWR — rejected for less mature devtools and mutation ergonomics
  Zustand + fetch — rejected due to cost of building/maintaining cache layer
  RTK Query — rejected because we don't use Redux
DATE: 2026-05-15
REVIEWERS: @tech-lead, @senior-engineer
```
