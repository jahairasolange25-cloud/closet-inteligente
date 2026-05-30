# ADR-008: State Management

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital frontend manages multiple categories of state: server state (garment catalog, user profile, outfits, collections, AI analysis results) retrieved from the NestJS API, client state (UI preferences, theme, sidebar visibility, 3D viewer camera position), form state (garment upload forms, outfit creation, profile editing), and 3D scene state (selected garment, avatar position, lighting configuration, active textures). The state management solution must handle frequent server data fetching with caching and background refetching, provide fine-grained reactivity to avoid unnecessary re-renders of 3D scenes, and support middleware for state persistence and logging.

## DECISION
We will use **Zustand for client state** and **TanStack Query for server state**.

This dual approach separates concerns clearly:
- **TanStack Query** manages all server-derived state — garment catalog queries with pagination, outfit CRUD operations, user data fetching, AI analysis polling. It provides caching, background refetching, optimistic updates, stale-while-revalidate patterns, and request deduplication out of the box.
- **Zustand** manages all purely client-side state — UI preferences, theme toggles, sidebar/open state, 3D viewer configuration (selected garment IDs, camera position, lighting), and local form state that doesn't need server persistence.

Zustand's minimal API eliminates the boilerplate of Redux while providing the fine-grained subscriptions needed for 3D scene performance. Each store selector creates an independent subscription, so 3D render loop state changes don't trigger re-renders of UI components and vice versa.

## CONSEQUENCES

**Positive:**
- Clear separation of server state (TanStack Query) and client state (Zustand) prevents architectural confusion
- TanStack Query provides automatic cache invalidation, refetching, and optimistic updates with minimal code
- Zustand's selector-based subscriptions prevent unnecessary re-renders in 3D and UI components
- Zustand middleware (persist, devtools, immer) add functionality without architectural changes
- TanStack Query's mutation system simplifies garment CRUD operations with rollback support
- Both libraries have strong TypeScript support and small bundle sizes (~3KB Zustand, ~13KB TanStack Query)

**Negative:**
- Two state management libraries increase learning curve for new team members
- Boundary between client and server state can blur (e.g., is a draft outfit client or server state before save?)
- Zustand stores can proliferate without architectural discipline — need clear store ownership guidelines
- TanStack Query's caching layer duplicates some Redis cache functionality, requiring cache invalidation strategy alignment

## ALTERNATIVES CONSIDERED

### Redux (with Redux Toolkit)
- **Pros:** Mature ecosystem, standardized patterns (RTK Query), DevTools, middleware ecosystem
- **Cons:** Significant boilerplate even with RTK, selector performance tuning required for 3D rendering, heavier bundle size (~12KB), over-engineered for this application's state complexity

### React Context API (with useReducer)
- **Pros:** Built-in, no dependencies, simple mental model
- **Cons:** No fine-grained subscriptions — all consumers re-render on any context value change, no middleware support, no DevTools, no server state caching, no optimistic updates, performance issues with 3D scene state

### Jotai
- **Pros:** Atomic state model, fine-grained subscriptions, good React 18 compatibility, small bundle size
- **Cons:** Less mature ecosystem than Zustand, fewer middleware options, atomic model can be counterintuitive for complex state shapes (garment collections, 3D scene configuration), no built-in server state management

### MobX
- **Pros:** Reactive/observable model, automatic dependency tracking, minimal boilerplate
- **Cons:** Mutable state pattern conflicts with React best practices, decorator syntax historically unstable, less compatible with TypeScript strict mode, fewer patterns for server state caching

## DATE
2026-05-25

## REVIEWERS
Lead Frontend Engineer, Software Architect, Tech Lead
