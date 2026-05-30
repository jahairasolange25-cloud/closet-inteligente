# Code Review Checklist

---

## Architecture Alignment

### Overall Design
- [ ] Changes align with the project's architectural patterns (Next.js App Router, NestJS modular, etc.)
- [ ] No violation of layered architecture (UI -> State -> API -> Service -> Data)
- [ ] New components follow existing patterns for similar features
- [ ] Separation of concerns is maintained (no business logic in UI components)
- [ ] Single Responsibility Principle is respected
- [ ] DRY principle is followed (no duplicated logic that should be extracted)
- [ ] New dependencies are justified and necessary
- [ ] No circular dependencies between modules/files
- [ ] Feature is properly modularized (can be developed/tested independently)

### Data Flow
- [ ] Data flows in one direction (unidirectional where possible)
- [ ] State management is in the correct layer (Zustand for client state, TanStack Query for server state)
- [ ] Props drilling is avoided (compose vs inherit, context/state where appropriate)
- [ ] Side effects are handled in the correct place (useEffect, mutation handlers, event handlers)
- [ ] API calls are in the correct layer (not in random components)
- [ ] Form state is managed correctly (controlled components, form libraries)

### Component Architecture
- [ ] Components are appropriately granular (not too big, not too small)
- [ ] Presentational vs container components are distinguished
- [ ] Component composition is preferred over inheritance
- [ ] Reusable logic is extracted into custom hooks
- [ ] Shared components are placed in the `components/shared` directory
- [ ] Page components are in the `app` directory following Next.js App Router conventions

---

## Security

### Authentication & Authorization
- [ ] Authentication is required for protected routes/pages
- [ ] JWT tokens are stored securely (httpOnly cookies preferred, not localStorage)
- [ ] Token expiration is handled (auto-refresh on 401)
- [ ] Authorization checks are performed on both frontend and backend
- [ ] Users can only access their own data (user_id scoping)
- [ ] Role-based access is enforced correctly (if applicable)
- [ ] No hardcoded credentials, tokens, or secrets
- [ ] Passwords are not logged or exposed in error messages
- [ ] Password fields use `type="password"` and are not stored in state as plaintext

### Input Validation
- [ ] All user inputs are validated (frontend and backend)
- [ ] Input sanitization is applied (strip XSS payloads, control characters)
- [ ] File uploads are validated (type, size, magic bytes, virus scan)
- [ ] URL parameters are validated (not just type coercion)
- [ ] Request body is validated with schema validation (class-validator, Zod)
- [ ] SQL injection is prevented (parameterized queries via ORM)
- [ ] No eval(), Function(), setTimeout(string), or similar dynamic code execution
- [ ] JSON parsing uses try/catch to prevent prototype pollution

### XSS Prevention
- [ ] User-generated content is properly escaped before rendering
- [ ] `dangerouslySetInnerHTML` is avoided (use sanitized HTML if absolutely necessary)
- [ ] React's built-in XSS protection is not bypassed
- [ ] href attributes are validated (no `javascript:` URLs)
- [ ] CSP headers are configured to prevent inline scripts
- [ ] Cookie security flags are set (HttpOnly, Secure, SameSite)

### CSRF Protection
- [ ] State-changing requests use POST/PUT/DELETE (not GET)
- [ ] CSRF tokens are implemented for cookie-based auth (double-submit cookie or synchronizer token)
- [ ] SameSite cookie attribute is set (Lax or Strict)
- [ ] CORS is configured with specific origins (not `*`)
- [ ] CORS credentials are only enabled for trusted origins

### API Security
- [ ] Rate limiting is applied to all endpoints
- [ ] API responses don't expose internal details (stack traces, schema info)
- [ ] Error messages are generic (don't reveal if user exists, etc.)
- [ ] Request size limits are enforced
- [ ] API versioning is in place for future changes
- [ ] HTTP methods are restricted (no PUT on read-only endpoints)
- [ ] Unused endpoints are removed or disabled

### Data Protection
- [ ] Sensitive data is encrypted at rest (PII, tokens, etc.)
- [ ] Sensitive data is not sent to frontend unnecessarily
- [ ] Database credentials are not hardcoded
- [ ] API keys are stored in environment variables, not in code
- [ ] `.env` files are in `.gitignore`

---

## Performance

### Frontend
- [ ] Components are not unnecessarily re-rendering (check React.memo, useMemo, useCallback)
- [ ] Large lists use virtualization (react-window, @tanstack/react-virtual)
- [ ] Images are optimized (next/image with proper sizes, lazy loading)
- [ ] Code splitting is used for large components/dependencies (dynamic imports)
- [ ] Bundle size impact is considered (analyze with webpack-bundle-analyzer)
- [ ] Expensive computations are memoized (useMemo)
- [ ] useEffect dependencies are correct (no missing deps, no infinite loops)
- [ ] Event handlers are not recreated on every render unnecessarily
- [ ] Font loading is optimized (next/font, font-display: swap)
- [ ] Third-party scripts are loaded asynchronously
- [ ] No unnecessary CSS animations on critical elements
- [ ] Web Workers are considered for CPU-intensive tasks (if applicable)

### N+1 Query Prevention
- [ ] Database queries are batched (not in loops)
- [ ] Eager loading is used for relationships (includes, joins)
- [ ] N+1 detection tools are used (Prisma's `with`, TypeORM's `relations`)
- [ ] Frontend requests are batched where possible
- [ ] API responses include nested data to avoid waterfall requests

### Backend
- [ ] Database queries have proper indexes
- [ ] Query results are limited/paginated
- [ ] Response caching is implemented (Redis, in-memory)
- [ ] Heavy operations are done asynchronously (background jobs)
- [ ] No synchronous I/O in request handlers (await all async calls)
- [ ] Database connection pooling is configured
- [ ] API responses don't return unnecessary fields
- [ ] Compression is enabled (gzip/brotli)
- [ ] Long-running requests have timeouts

### 3D/AI Performance
- [ ] 3D models are optimized (polygon count, texture size, compression)
- [ ] LOD (Level of Detail) is implemented for 3D rendering
- [ ] WebGL context loss is handled gracefully
- [ ] AI inference is done asynchronously (not blocking API responses)
- [ ] Model inference has fallback to CPU if GPU unavailable
- [ ] Image processing pipeline has timeout and cancellation

---

## Accessibility

### Semantic HTML
- [ ] Correct HTML elements are used (nav, main, header, footer, section, article)
- [ ] Heading hierarchy is logical (h1 -> h6, no skips)
- [ ] Landmarks are properly defined
- [ ] Lists are marked up as `<ul>` / `<ol>` / `<li>`
- [ ] Tables use `<thead>`, `<tbody>`, `<th>` with scope attributes
- [ ] Buttons are `<button>` elements (not divs with click handlers)

### ARIA
- [ ] ARIA roles are correct and not redundant with semantic HTML
- [ ] ARIA labels are provided for icon-only buttons
- [ ] `aria-expanded` is used for collapsible elements
- [ ] `aria-current` is used for active navigation items
- [ ] `aria-live` regions are used for dynamic content updates
- [ ] `aria-hidden` is used correctly (not hiding interactive elements)
- [ ] Focus management is implemented (modals, drawers, skip links)
- [ ] Focus trap is implemented in modals and dialogs

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order follows visual order
- [ ] No focus traps (unless intended, like modals)
- [ ] Skip-to-content link is present
- [ ] Escape key closes modals, drawers, dropdowns
- [ ] Enter/Space activates buttons and links
- [ ] Arrow keys work for tab panels, carousels, lists
- [ ] Custom components have proper keyboard event handling

### Color & Contrast
- [ ] Text has sufficient color contrast (WCAG AA: 4.5:1 normal, 3:1 large)
- [ ] Color is not the only indicator of information (add patterns, icons, text)
- [ ] Focus indicators are visible (not removed without alternative)
- [ ] Error states are not indicated by color alone
- [ ] Custom color schemes respect user preferences

### Forms & Labels
- [ ] All form inputs have associated labels
- [ ] Placeholder is not used as a substitute for label
- [ ] Error messages are associated with inputs (aria-describedby)
- [ ] Required fields are indicated
- [ ] Form validation errors are announced to screen readers
- [ ] Autocomplete attributes are used where appropriate

### Reduced Motion
- [ ] `prefers-reduced-motion` media query is respected
- [ ] Animations are not essential for understanding content
- [ ] Auto-playing animations/videos have a pause control
- [ ] Scroll-triggered animations are accessible

---

## Testing

### Coverage
- [ ] New code has corresponding unit tests
- [ ] Critical user flows have integration/E2E tests
- [ ] Edge cases are covered (empty states, error states, loading states)
- [ ] Error handling paths are tested
- [ ] Auth/authorization scenarios are tested (unauthenticated, unauthorized)
- [ ] Boundary conditions are tested (pagination limits, max values)
- [ ] Accessibility tests are included (jest-axe for components)

### Test Quality
- [ ] Tests test behavior, not implementation details
- [ ] Test descriptions are meaningful ("should render error when API fails")
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Mocks are appropriate and not over-mocked
- [ ] Async operations are properly awaited
- [ ] Test data is realistic (not just "test", "foo", "bar")
- [ ] No test interdependence (tests can run in any order)
- [ ] Snapshot tests are meaningful and not too large
- [ ] Flaky tests are identified and addressed

### Test Coverage for Bugs
- [ ] Regression tests are added for fixed bugs
- [ ] Tests reproduce the bug scenario before asserting the fix
- [ ] Race conditions are tested (concurrent requests, timers)
- [ ] Localization/internationalization edge cases are covered

---

## Documentation

### Code Documentation
- [ ] Public APIs and complex functions have JSDoc comments
- [ ] Comments explain "why", not "what" (code should be self-documenting for "what")
- [ ] No commented-out code (remove if not needed)
- [ ] TODO/FIXME comments have associated issue numbers
- [ ] TypeScript types are documented (especially complex generics)
- [ ] Props interfaces are documented for shared components

### Project Documentation
- [ ] README is updated if necessary (new features, changed setup)
- [ ] CHANGELOG is updated with the changes
- [ ] API documentation (Swagger) is updated for new/changed endpoints
- [ ] Environment variables are documented
- [ ] Architecture Decision Records (ADRs) are created for significant decisions
- [ ] Wiki/Confluence is updated for new features

### Inline Documentation Standards
- [ ] JSDoc follows a consistent style
- [ ] @param, @returns, @throws are used correctly
- [ ] Examples are provided in JSDoc where helpful
- [ ] Type information is not duplicated (use TypeScript types, not JSDoc types)

---

## Naming Conventions

### General
- [ ] Names are descriptive and unambiguous
- [ ] Abbreviations are avoided unless universally understood (API, URL, HTML)
- [ ] Booleans use prefixes: `is`, `has`, `should`, `can`, `did`
- [ ] Event handlers use `on` or `handle` prefix (`onClick`, `handleSubmit`)
- [ ] Callback props use `on` prefix (`onSave`, `onDelete`)
- [ ] No single-letter variable names (except loop counters, common math)
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] Files are named after their default export

### Frontend
- [ ] Components use PascalCase (`GarmentCard.tsx`)
- [ ] Hooks use camelCase with `use` prefix (`useGarments`)
- [ ] Utility functions use camelCase (`formatCurrency`)
- [ ] CSS classes use Tailwind utility approach (or follow project conventions)
- [ ] State/React Query variables follow convention: `[data, setData]`, `{data, isLoading, error}`
- [ ] Store slices follow naming convention: `useAuthStore`, `useUIStore`
- [ ] Directory structure follows feature-based or type-based convention

### Backend
- [ ] Modules use PascalCase (`GarmentModule`)
- [ ] Services use PascalCase (`GarmentService`)
- [ ] Controllers use PascalCase (`GarmentController`)
- [ ] DTOs use PascalCase with suffix (`CreateGarmentDto`)
- [ ] Entities/Models use PascalCase (`Garment`)
- [ ] Database columns use snake_case
- [ ] API routes use kebab-case (`/api/garments/toggle-favorite`)

### Python/AI
- [ ] Modules/files use snake_case (`garment_detector.py`)
- [ ] Classes use PascalCase (`GarmentDetector`)
- [ ] Functions use snake_case (`detect_garments`)
- [ ] Variables use snake_case (`confidence_threshold`)
- [ ] Constants use UPPER_SNAKE_CASE

---

## Error Handling

### Backend
- [ ] HTTP exceptions use appropriate status codes (400, 401, 403, 404, 409, 422, 429, 500)
- [ ] Error responses have consistent structure (`{ error: { code, message, details } }`)
- [ ] Unhandled errors are caught by global exception filter
- [ ] Errors are logged with sufficient context (request ID, user ID, params)
- [ ] Sensitive information is not included in error responses
- [ ] Async errors are caught (try/catch in async handlers)
- [ ] Promise rejections are handled (no unhandled promise rejections)
- [ ] External service failures are handled gracefully (fallback, circuit breaker)
- [ ] Validation errors are detailed (which fields failed, what constraints)

### Frontend
- [ ] API errors are caught and displayed to user (toast notifications)
- [ ] Error boundaries are implemented at appropriate levels
- [ ] Loading states handle errors (show error state, not blank screen)
- [ ] Form validation errors are shown inline
- [ ] Network errors are handled (retry button, offline indicator)
- [ ] Optimistic updates handle rollback on error
- [ ] 404 and error pages are user-friendly with navigation options

### AI Service
- [ ] Model loading failures are handled with fallback
- [ ] GPU out-of-memory errors fall back to CPU
- [ ] Image processing errors return useful error codes
- [ ] Timeouts are enforced on inference
- [ ] Invalid input returns 400 with specific error message

---

## Type Correctness

### TypeScript
- [ ] Strict mode is enabled in tsconfig
- [ ] `any` is not used (use `unknown` and type guards)
- [ ] Function return types are explicitly annotated
- [ ] Generic types are used appropriately (not over-abstracted)
- [ ] Union types are discriminated (tagged unions for state)
- [ ] Type assertions (`as`) are avoided or justified with comments
- [ ] Non-null assertions (`!`) are avoided
- [ ] `null` and `undefined` are handled correctly (optional chaining, nullish coalescing)
- [ ] API responses have proper TypeScript types
- [ ] Environment variables are typed (env.d.ts or validation schema)
- [ ] Prop types are explicit (interface, not inline type)
- [ ] State types are defined (not inferred from initial value)

### Python
- [ ] Type hints are used for function parameters and return values
- [ ] Pydantic models are used for request/response schemas
- [ ] Optional fields are typed with `Optional` or default `None`
- [ ] Union types use `Union` or `|` syntax (Python 3.10+)
- [ ] No `Any` types without justification

---

## Code Style & Quality

### Consistency
- [ ] Code follows the project's ESLint and Prettier configuration
- [ ] Import order is consistent (external, internal, relative)
- [ ] Line length limits are respected
- [ ] Consistent use of semicolons, quotes, trailing commas
- [ ] Consistent use of async/await vs .then()
- [ ] Consistent component patterns (same structure, same export style)

### Functional Patterns
- [ ] Pure functions are preferred over impure ones
- [ ] Side effects are isolated and documented
- [ ] State mutations are avoided (immutable update patterns)
- [ ] Array/object methods are preferred over imperative loops (map, filter, reduce)
- [ ] Destructuring is used for object/array access
- [ ] Spread operator is used for immutable updates
- [ ] Early returns reduce nesting

### CSS/Tailwind
- [ ] Tailwind classes follow a consistent order (layout, sizing, typography, visual)
- [ ] Custom CSS is avoided in favor of Tailwind utilities
- [ ] Responsive variants are used (`sm:`, `md:`, `lg:`, `xl:`)
- [ ] Dark mode variants are used (`dark:`)
- [ ] No inline styles unless dynamic values require it
- [ ] Component styles use className composition (clsx, twMerge)
