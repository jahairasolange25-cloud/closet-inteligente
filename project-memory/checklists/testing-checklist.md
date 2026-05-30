# Testing Checklist

---

## Pre-Test Checklist

- [ ] Test environment is isolated from production (separate database, API keys, services)
- [ ] Test database is provisioned and migrated to latest schema
- [ ] Test data/seeds are loaded (realistic, representative data)
- [ ] All required services are running (database, Redis, storage mock)
- [ ] Environment variables for test are set correctly
- [ ] Test framework is configured (Jest, Vitest, Playwright, pytest)
- [ ] Test utilities/helpers are imported and working
- [ ] Test timeouts are configured appropriately
- [ ] CI pipeline has test step configured
- [ ] No flaky tests from previous runs (check CI history)
- [ ] Test coverage thresholds are defined
- [ ] Test reporting is configured (JUnit XML, HTML report)

---

## Unit Test Checklist

### Structure
- [ ] Tests are organized mirroring source code structure (test/unit/services, test/unit/components)
- [ ] Each file has a single `describe` block per unit under test
- [ ] Each function/method has a `describe` or `it` block
- [ ] Test names follow convention: "should [expected behavior] when [scenario]"
- [ ] Arrange-Act-Assert (AAA) pattern is followed
- [ ] Tests are independent (can run in any order, parallel)
- [ ] beforeEach/afterEach clean up side effects
- [ ] Test files are co-located or in a parallel `__tests__` directory

### Frontend Unit Tests
- [ ] Zustand stores: all actions produce correct state changes
- [ ] Zustand stores: initial state is correct
- [ ] Zustand stores: selectors return derived data correctly
- [ ] Zustand stores: persist middleware works (save/restore)
- [ ] Custom hooks: return correct values for given inputs
- [ ] Custom hooks: handle loading/error states
- [ ] Custom hooks: mutations invalidate correct queries
- [ ] Utility functions: correct output for given input
- [ ] Utility functions: handle edge cases (empty, null, undefined, boundary values)
- [ ] Utility functions: handle locale-specific formatting
- [ ] Shared components: render correctly with default props
- [ ] Shared components: render all variants (primary, secondary, sizes)
- [ ] Shared components: handle loading state
- [ ] Shared components: handle disabled state
- [ ] Shared components: handle error state
- [ ] Shared components: handle empty state (lists, tables)
- [ ] Shared components: call event handlers correctly
- [ ] Shared components: pass additional className props
- [ ] Shared components: forward refs correctly
- [ ] Constant/enum values: match expected values

### Backend Unit Tests
- [ ] Services: CRUD operations return correct data
- [ ] Services: error handling throws correct exceptions
- [ ] Services: edge cases (not found, duplicate, invalid data)
- [ ] Services: authorization checks (user can only access own data)
- [ ] Guards: return true/false for authorized/unauthorized
- [ ] Guards: throw appropriate HTTP exceptions
- [ ] Pipes/Filters: transform input correctly
- [ ] Pipes/Filters: handle validation errors
- [ ] Interceptors: modify response correctly
- [ ] Decorators: attach metadata correctly
- [ ] Custom validators: valid/invalid inputs
- [ ] DTOs: validation decorators work as expected

### AI Unit Tests
- [ ] Image preprocessing: correct output dimensions and format
- [ ] Image preprocessing: handles EXIF orientation
- [ ] Image preprocessing: handles corrupt images
- [ ] Detection: returns expected number of detections
- [ ] Detection: minimum confidence threshold filtering
- [ ] Detection: NMS removes duplicate detections
- [ ] Classification: returns top-K predictions
- [ ] Classification: handles unknown classes
- [ ] Color extraction: returns dominant colors correctly
- [ ] Color extraction: handles grayscale images
- [ ] Color mapping: maps to correct color names
- [ ] Background removal: produces RGBA output
- [ ] Background removal: handles already transparent images
- [ ] Body measurement: estimates from known input
- [ ] Skin tone detection: returns correct Fitzpatrick type

---

## Integration Test Checklist

### Backend API Integration
- [ ] Each endpoint returns correct HTTP status codes
- [ ] Each endpoint returns correct response structure
- [ ] CRUD flow: create -> read -> update -> delete works end-to-end
- [ ] Authentication: valid credentials return tokens
- [ ] Authentication: invalid credentials return 401
- [ ] Authentication: expired token returns 401
- [ ] Authentication: malformed token returns 401
- [ ] Authorization: user A cannot access user B's data
- [ ] Pagination: returns correct page size and total count
- [ ] Pagination: cursor/offset works correctly
- [ ] Filtering: each filter parameter works in isolation
- [ ] Filtering: combined filters work correctly
- [ ] Filtering: invalid filter values are handled
- [ ] Sorting: each sort field works correctly
- [ ] Sorting: ascending/descending works
- [ ] Search: returns matching results
- [ ] Search: handles special characters
- [ ] Validation: required fields return 422
- [ ] Validation: invalid field types return 422
- [ ] Validation: max length/min length violations return 422
- [ ] File upload: valid files upload successfully
- [ ] File upload: invalid type returns 400
- [ ] File upload: oversized file returns 413
- [ ] File upload: corrupt file returns 400
- [ ] Rate limiting: within limits succeeds
- [ ] Rate limiting: exceeded limits returns 429
- [ ] Rate limiting: resets after cooldown

### AI Service Integration
- [ ] Detection endpoint returns valid detections for known image
- [ ] Detection endpoint handles image with no garments
- [ ] Classification endpoint returns correct category for known garment
- [ ] Color endpoint returns expected colors for known input
- [ ] Background removal endpoint returns image with transparent bg
- [ ] Compression endpoint returns smaller file than input
- [ ] Batch endpoint processes all images in request
- [ ] Error handling: corrupt image returns 400
- [ ] Error handling: missing file returns 400
- [ ] Error handling: wrong format returns 400

### WebSocket Integration
- [ ] Connection with valid token succeeds
- [ ] Connection with invalid/missing token is rejected
- [ ] Client receives events for own resources
- [ ] Client does not receive events for other users
- [ ] Disconnection stops receiving events
- [ ] Reconnection works (resubscribes to rooms)
- [ ] Heartbeat/ping-pong keeps connection alive

### Third-Party Integration
- [ ] Cloudinary upload succeeds and returns URL
- [ ] Cloudinary deletion succeeds
- [ ] Firebase Cloud Messaging sends notification
- [ ] Email service sends password reset email
- [ ] Redis cache set/get/delete operations work
- [ ] Redis cache expiration works (TTL)

---

## E2E Test Checklist

### Critical User Flows
- [ ] New user registration -> login -> sees empty closet
- [ ] Add garment with image -> appears in closet list
- [ ] Upload image -> AI detects category and color -> garment detail shows AI results
- [ ] Edit garment fields -> changes persist on reload
- [ ] Delete garment -> removed from closet
- [ ] Create outfit with 2 garments -> outfit appears in list
- [ ] View outfit detail -> shows both garments
- [ ] Wear outfit -> times_worn increments
- [ ] Delete outfit -> removed from list
- [ ] Create calendar event -> appears on calendar view
- [ ] Link outfit to event -> event detail shows outfit
- [ ] Navigate calendar months -> events load correctly
- [ ] View notification -> marks as read
- [ ] View analytics -> charts render with data
- [ ] Change settings -> preferences persist on reload
- [ ] Logout -> redirected to login -> cannot access closet

### Cross-Feature Flows
- [ ] Create garment -> use in outfit -> schedule outfit in calendar -> wear event
- [ ] Upload image -> AI classifies -> edit AI results -> verify edit persists
- [ ] Favorite garment -> filter by favorites -> unfavorite -> filtered out
- [ ] Create outfit -> share -> verify shared content
- [ ] Export wardrobe -> download file -> verify file contents

### Error Flows
- [ ] Visit protected route while unauthenticated -> redirected to login
- [ ] Login with wrong password -> error message shown
- [ ] Submit empty form -> validation errors shown
- [ ] Upload invalid file type -> error toast shown
- [ ] Navigate to non-existent page -> 404 page shown
- [ ] Network error -> retry button appears -> retry succeeds
- [ ] Exceed rate limit -> error message shown -> recovers after timeout

### Browser Compatibility
- [ ] All critical flows work in Chrome (latest)
- [ ] All critical flows work in Firefox (latest)
- [ ] All critical flows work in Safari (latest)
- [ ] All critical flows work in Edge (latest)
- [ ] All critical flows work on mobile Chrome (Android)
- [ ] All critical flows work on mobile Safari (iOS)

---

## Coverage Validation Checklist

- [ ] Frontend code coverage >= 70%
- [ ] Backend code coverage >= 80%
- [ ] AI service code coverage >= 70%
- [ ] All new code has >= 80% coverage
- [ ] No untested lines in critical paths (auth, payments, data deletion)
- [ ] Branch coverage is >= 60% (conditionals are tested)
- [ ] Statement coverage >= 70%
- [ ] Function coverage >= 80%
- [ ] Line coverage report is generated and reviewed
- [ ] Coverage thresholds are enforced in CI
- [ ] uncovered lines are reviewed and either tested or justified
- [ ] Integration tests cover 100% of defined API endpoints

### Areas Requiring Minimum 90% Coverage
- [ ] Authentication/authorization logic
- [ ] File upload validation
- [ ] Data export (GDPR compliance)
- [ ] Data deletion (user account deletion)
- [ ] Payment/transaction processing (if applicable)
- [ ] Personal data handling
- [ ] Input sanitization/validation

---

## Test Review Checklist

### Test Code Quality
- [ ] Tests are readable and well-structured
- [ ] Test names describe behavior, not implementation
- [ ] No commented-out tests
- [ ] No `.only` or `.skip` left in test files
- [ ] No tests with empty bodies or placeholder assertions
- [ ] Mocks are not overused (integration over mocking)
- [ ] Mock implementations are realistic
- [ ] Async tests properly await promises
- [ ] No test interdependence (shared mutable state)
- [ ] Tests don't depend on external services that may be unavailable
- [ ] Test data is cleaned up after test suite

### Assertion Quality
- [ ] Assertions test behavior, not implementation details
- [ ] Each test has at least one assertion
- [ ] Assertions are specific (not just `toBeTruthy()`)
- [ ] Error messages in assertions are helpful
- [ ] Snapshot assertions are meaningful and not too large
- [ ] Floating point comparisons use `toBeCloseTo` (not `toEqual`)
- [ ] Array/object assertions use `toContainEqual`, `toEqual` (not reference equality)
- [ ] Negative testing is included (what should NOT happen)

### Edge Cases Coverage
- [ ] Empty state (no data)
- [ ] Single item (boundary)
- [ ] Maximum items (pagination boundary)
- [ ] Null/undefined values
- [ ] Special characters in strings
- [ ] Unicode characters (emoji, non-Latin scripts)
- [ ] Very long strings (truncation, overflow)
- [ ] Very large numbers (overflow)
- [ ] Negative numbers (if applicable)
- [ ] Concurrent/race conditions
- [ ] Network timeout
- [ ] API returns unexpected response format
- [ ] API returns error
- [ ] User session expires mid-flow

---

## Regression Test Checklist

### Test Selection
- [ ] All tests pass in existing test suite
- [ ] Tests related to changed files are rerun
- [ ] Tests for features that interact with changed code are rerun
- [ ] All critical user flows are tested after deployment
- [ ] Performance benchmarks are within expected range

### Smoke Regression Suite (run after every deployment)
- [ ] User registration
- [ ] User login/logout
- [ ] Create garment
- [ ] Read/update/delete garment
- [ ] Create outfit
- [ ] Read/update/delete outfit
- [ ] Create calendar event
- [ ] Read/update/delete calendar event
- [ ] Upload image (storage integration)
- [ ] AI processing (detection, classification)
- [ ] Notification delivery
- [ ] Analytics display

### Full Regression Suite (run before every release)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Accessibility tests pass (jest-axe, axe-core)
- [ ] Performance tests pass (Lighthouse thresholds)
- [ ] Security tests pass (dependency scanning, SAST)
- [ ] Visual regression tests pass (screenshots match baselines)
- [ ] API contract tests pass
- [ ] Database migration tests pass (up and down)
- [ ] Backup/restore test passes

### Regression Test Triggers
- [ ] Before each production deployment
- [ ] After database schema changes
- [ ] After dependency updates (especially major versions)
- [ ] After refactoring without behavior change
- [ ] After adding new features that touch existing code
- [ ] Weekly automated regression run
- [ ] After infrastructure changes (database, cache, storage)
