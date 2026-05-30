# Review Rules

> Code review criteria, checklists, and procedures for every pull request.

---

## Code Review Criteria

### 1. Correctness
- Does the code do what it is supposed to do?
- Does it handle edge cases?
- Does it handle errors gracefully?
- Does it meet the acceptance criteria?

### 2. Design
- Is the code well-structured?
- Does it follow the project's architecture patterns?
- Does it follow the project's design patterns?
- Is it appropriately abstracted?
- Is it over-engineered?

### 3. Maintainability
- Is the code easy to understand?
- Are names clear and descriptive?
- Is the logic straightforward?
- Are there sufficient comments for non-obvious code?

### 4. Performance
- Are there obvious performance issues?
- Are there N+1 queries?
- Are there unnecessary re-renders?
- Is the bundle size impacted?

### 5. Security
- Are there injection vulnerabilities?
- Are there authentication/authorization gaps?
- Are secrets exposed?
- Is input validation present?

### 6. Accessibility
- Are interactive elements accessible?
- Are ARIA labels provided?
- Is keyboard navigation supported?
- Is color contrast sufficient?

### 7. Testing
- Are there tests for the new code?
- Do tests cover edge cases?
- Are tests meaningful (not just coverage padding)?
- Do all tests pass?

### 8. Documentation
- Is the code self-documenting?
- Are public APIs documented with JSDoc/TSDoc?
- Are changes reflected in project documentation?
- Is the CHANGELOG updated?

---

## Review Checklist for Every PR

### General
- [ ] PR title follows the format: `<type>(<scope>): <description>`
- [ ] PR description has all required sections filled
- [ ] PR size is within limits (max 500 lines changed)
- [ ] Branch name follows convention
- [ ] No merge conflicts with target branch
- [ ] Related issues/tasks are referenced
- [ ] Breaking changes are noted in the PR description

### Code Quality
- [ ] Code follows coding standards (`coding-standards.md`)
- [ ] Code follows naming conventions (`naming-conventions.md`)
- [ ] No commented-out code
- [ ] No debugging artifacts (`console.log`, `debugger`, `print`)
- [ ] No `TODO`/`FIXME`/`HACK` without a linked task
- [ ] No dead code (unused imports, variables, functions)
- [ ] Error handling is appropriate and complete
- [ ] Input validation is present on all user-facing APIs
- [ ] TypeScript types are used correctly (no `any`)
- [ ] Imports are organized and clean

### Architecture
- [ ] Architecture rules are followed (`architecture-protection-rules.md`)
- [ ] File boundaries are respected (`file-modification-rules.md`)
- [ ] No forbidden actions (`forbidden-actions.md`)
- [ ] Module boundaries are respected
- [ ] Dependency direction is correct (frontend -> backend -> AI)
- [ ] API contracts are maintained or properly versioned
- [ ] Database schema changes have migrations

### Testing
- [ ] Unit tests are present for new/modified code
- [ ] Integration tests are present for API changes
- [ ] Test coverage is adequate (edge cases, error cases, happy path)
- [ ] Tests are deterministic (no flaky tests)
- [ ] Test data is isolated (no shared state between tests)
- [ ] Snapshots are updated if changed (and verified)

### Security
- [ ] No hardcoded secrets
- [ ] Authentication is present on protected endpoints
- [ ] Authorization is correct (users can only access their data)
- [ ] Input is sanitized
- [ ] No injection vulnerabilities
- [ ] Rate limiting is considered for new endpoints
- [ ] No sensitive data in logs

### Performance
- [ ] No N+1 database queries
- [ ] Pagination is used for list endpoints
- [ ] Images/assets are optimized
- [ ] Bundle size is checked (frontend)
- [ ] Lazy loading is used where appropriate

### Accessibility
- [ ] Semantic HTML is used
- [ ] ARIA attributes are present where needed
- [ ] Keyboard navigation works
- [ ] Focus management is correct
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announcements are appropriate

### Documentation
- [ ] JSDoc/TSDoc is present on public APIs
- [ ] README is updated if needed
- [ ] CHANGELOG is updated
- [ ] ADR is created if needed
- [ ] Architecture documentation is updated if needed

---

## Automated Checks Required

The following checks MUST pass before any PR can be merged:

### Frontend
- [ ] `npm run lint` — ESLint passes (zero errors, zero warnings)
- [ ] `npm run typecheck` — TypeScript strict mode passes (zero errors)
- [ ] `npm run test` — All unit/integration tests pass
- [ ] `npm run build` — Production build succeeds
- [ ] `npm run format:check` — Prettier formatting is correct

### Backend
- [ ] `npm run lint` — ESLint passes (zero errors, zero warnings)
- [ ] `npm run typecheck` — TypeScript strict mode passes (zero errors)
- [ ] `npm run test` — All unit/integration tests pass
- [ ] `npm run test:e2e` — E2E tests pass
- [ ] `npm run build` — Production build succeeds

### AI (Python)
- [ ] `flake8 python/` — Lint passes
- [ ] `black --check python/` — Formatting is correct
- [ ] `mypy python/` — Type check passes
- [ ] `pytest python/tests/` — All tests pass

### Infrastructure
- [ ] Docker build succeeds for all images
- [ ] Vercel build check passes (if deployed)
- [ ] Railway deploy check passes (if deployed)

---

## Manual Review Items

### Logic Review
- Does the algorithm/flow make sense?
- Are there off-by-one errors?
- Are race conditions possible?
- Are there concurrency issues?
- Is caching correct (invalidation, TTL)?

### Edge Cases
- Empty state: What happens when there's no data?
- Error state: What happens when an API call fails?
- Loading state: What is shown while data is loading?
- Overflow: What happens with very large inputs?
- Boundary: What happens at pagination limits?
- Concurrent: What happens with multiple simultaneous requests?

### State Management
- Is state in the right place (local vs store vs URL)?
- Is state normalized correctly?
- Are there unnecessary re-renders due to state?
- Is optimistic update handled correctly?

### Data Flow
- Is the data flow unidirectional?
- Are mutations predictable?
- Are side effects handled in the right layer?
- Is the data lifecycle managed correctly?

---

## Security Review Triggers

A security review is REQUIRED when a PR involves:

1. **Authentication changes**: Modifying login, signup, session management, or Auth0 integration.
2. **Authorization changes**: Modifying role-based access, permissions, or ownership checks.
3. **New API endpoints**: Especially if they expose user data or accept user input.
4. **Database schema changes**: Especially if they involve sensitive data.
5. **File upload functionality**: Any PR that adds or modifies file upload handling.
6. **Third-party integrations**: Any PR that integrates with external services.
7. **Payment processing**: Any PR that touches payment-related code.
8. **User data handling**: Any PR that processes, stores, or transmits PII (Personally Identifiable Information).
9. **Authentication bypass**: Any PR that adds "skip auth" functionality, even for testing.
10. **Dependency changes**: Adding or updating dependencies, especially with known vulnerabilities.

### Security Review Process
1. Tag the PR with `security-review-required` label.
2. Assign to a security reviewer (designated team member).
3. Security reviewer has 24 hours to review (48 hours for CRITICAL systems).
4. Security review must be completed and approved before merging.

---

## Performance Review Triggers

A performance review is REQUIRED when a PR involves:

1. **New database queries**: Adding queries without proper indexing.
2. **New API endpoints**: Especially list/search endpoints that may return large datasets.
3. **Image processing**: Adding image manipulation, upload, or transformation.
4. **3D rendering**: Adding new Three.js components, models, or scenes.
5. **Real-time features**: Adding WebSocket events, especially high-frequency ones.
6. **AI inference**: Adding new model inference calls.
7. **Batch operations**: Added operations that process multiple items.
8. **Bundle size increase**: PR increases bundle size by more than 10KB.
9. **Animation**: Adding complex animations that may impact frame rate.
10. **Background jobs**: Adding scheduled tasks or background processing.

### Performance Review Process
1. Tag the PR with `performance-review-required` label.
2. Run performance benchmarks (if available).
3. Review query plans (for database changes).
4. Measure response times (for API changes).
5. Performance review must be completed before merging.

---

## Accessibility Review Requirements

An accessibility review is REQUIRED for every PR that involves UI changes, including:

1. **New pages or components**: Every new UI component must be accessible.
2. **Modified interactions**: Any change to how users interact with the UI.
3. **Visual changes**: Any change to colors, spacing, or visual design.
4. **Form changes**: New or modified forms, inputs, or validation.
5. **Navigation changes**: Modified navigation, menus, or links.
6. **Modal/overlay changes**: Dialog boxes, popovers, tooltips.

### Accessibility Checklist
- [ ] All interactive elements have accessible names (aria-label or visible text).
- [ ] All form inputs have associated labels.
- [ ] All images have meaningful alt text.
- [ ] Color is not the only means of conveying information.
- [ ] Contrast ratio meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
- [ ] Focus indicators are visible (not `outline: none` without replacement).
- [ ] Focus order follows visual order (tab order is logical).
- [ ] Keyboard navigation works for all interactive elements (Tab, Enter, Escape, arrow keys).
- [ ] Custom components have appropriate ARIA roles, states, and properties.
- [ ] Screen reader announcements are provided for dynamic content changes.
- [ ] Touch targets are at least 44x44px.
- [ ] Motion/animation respects `prefers-reduced-motion`.
- [ ] Error messages are associated with their inputs (aria-describedby).

---

## Test Coverage Review

Test coverage review must verify:

1. **New code is tested**: Every new function, component, or API endpoint has tests.
2. **Edge cases are covered**: Empty, error, loading, and boundary states are tested.
3. **Error handling is tested**: Errors are thrown, caught, and handled appropriately.
4. **Coverage thresholds met**: Overall coverage >= 80%, new code coverage >= 90%.
5. **Tests are meaningful**: Tests verify behavior, not just presence (no "smoke tests" that only check render without assertions).
6. **Mocking is appropriate**: Mocks are at the right level (not over-mocked, not under-mocked).
7. **No test-only code**: No code added only to make tests pass (test-specific branches, etc.).

### Coverage Tool Configuration
```
Frontend: Jest with --coverage flag
Backend:  Jest with --coverage flag
Python:   pytest with --cov=python/ flag
```

### Coverage Thresholds
| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |
| New code coverage | 90% |

---

## Documentation Review

Documentation review must verify:

1. **API documentation**: New/modified endpoints are documented.
2. **Type documentation**: All public types have JSDoc/TSDoc.
3. **README**: Setup instructions are updated if changed.
4. **CHANGELOG**: The change is noted in the unreleased section.
5. **ADRs**: If the change is architecturally significant, an ADR is created or referenced.
6. **Architecture docs**: Architecture diagrams/docs are updated if the architecture changed.
7. **Component documentation**: New components have usage documentation (if non-trivial).

---

## Review Turnaround Time

| Priority | Target Time | Maximum Time |
|----------|-------------|--------------|
| CRITICAL (production outage, security) | 1 hour | 4 hours |
| HIGH (blocking feature, bug) | 4 hours | 24 hours |
| MEDIUM (standard feature, improvement) | 24 hours | 48 hours |
| LOW (chore, documentation, refactoring) | 48 hours | 72 hours |

### If Review Is Delayed
1. Ping the reviewer after 50% of the maximum time.
2. Escalate to the reviewer's lead after 75% of the maximum time.
3. Re-assign after 100% of the maximum time.

---

## Required Reviewers Per File Type

| File Type | Required Reviewer(s) |
|-----------|---------------------|
| `frontend/src/components/` | Frontend lead or senior frontend developer |
| `frontend/src/hooks/` | Frontend lead |
| `frontend/src/stores/` | Frontend lead + backend lead (if store interacts with API) |
| `frontend/src/services/` | Frontend lead + backend lead |
| `frontend/src/types/` | Any frontend or backend developer |
| `frontend/src/app/` (pages) | Frontend lead |
| `frontend/src/utils/` | Any frontend developer |
| `backend/src/modules/*/controllers/` | Backend lead |
| `backend/src/modules/*/services/` | Backend lead |
| `backend/src/modules/*/dto/` | Backend lead |
| `backend/prisma/schema.prisma` | Backend lead + database specialist |
| `backend/prisma/migrations/` | Backend lead + database specialist |
| `backend/src/common/` | Backend lead |
| `backend/src/config/` | Backend lead + infrastructure lead |
| `python/pipelines/` | AI lead |
| `python/services/` | AI lead |
| `python/models/` | AI lead |
| `python/tests/` | AI lead |
| `docker/` | Infrastructure lead |
| `.github/workflows/` | Infrastructure lead |
| `project-memory/adr/` | Architecture board (at least 2 members) |
| `project-memory/agent-control/` | Architecture board (unanimous approval) |

---

## Merge Conditions

ALL of the following must be true for a PR to be merged:

### Required Conditions
- [ ] At least one approval from a required reviewer.
- [ ] All automated checks pass (lint, typecheck, test, build).
- [ ] No merge conflicts.
- [ ] PR is up to date with the target branch.
- [ ] All security reviews are completed and approved.
- [ ] All performance reviews are completed and approved.

### Additional Conditions for Large Changes
- [ ] Two approvals (not just one) for PRs modifying > 10 files.
- [ ] Architecture board approval for PRs modifying > 20 files.
- [ ] ADR approval for PRs introducing architectural changes.

### Conditions for CRITICAL Changes
- [ ] Production hotfixes require at least two approvals.
- [ ] Security patches require security team approval.
- [ ] Database migrations require database specialist approval.

---

## Revert Conditions

A merge should be reverted if:

1. **Build breaks** in CI after merge.
2. **Tests fail** on the main branch due to the change.
3. **Production bug** is identified within 24 hours of merge.
4. **Security vulnerability** is discovered.
5. **Performance regression** exceeds 20%.
6. **Data loss** occurs.
7. **Customer-facing issue** is reported and confirmed to be caused by the change.

### Revert Process
1. Create a revert PR: `git revert <merge-commit-hash>`.
2. Add the label `revert` to the PR.
3. At least one approval required (two for production changes).
4. Merge the revert.
5. Create a task to investigate and properly fix the issue.
6. Notify the team.

---

## Review Labels

| Label | Meaning |
|-------|---------|
| `review:awaiting-review` | PR is ready for review |
| `review:changes-requested` | Changes requested; author must address |
| `review:approved` | PR is approved |
| `review:security-required` | Security review is required |
| `review:performance-required` | Performance review is required |
| `review:accessibility-required` | Accessibility review is required |
| `review:urgent` | Review needed ASAP (CRITICAL/HIGH priority) |
| `review:wip` | PR is a work in progress (not ready for review) |

---

## Review Tools

### Recommended Review Practices
1. **Pull the branch locally**: Test the changes on your machine.
2. **Check out the branch**: Switch to the PR branch and run the code.
3. **Read every changed line**: Do not skip files.
4. **Verify understanding**: If you don't understand a change, ask questions.
5. **Be specific**: Point to exact lines/files in your comments.
6. **Be constructive**: Explain why something should change and how.
7. **Separate concerns**: Distinguish between blocking issues and suggestions.

### Review Comments Format
```
<file-path>:<line-number> - <severity> - <comment>

Example:
frontend/src/components/UserProfile.tsx:42 - BLOCKING - 
This prop is not validated. User input from the URL params should 
be sanitized before being passed to the component.
```

### Severity Levels
| Severity | Meaning | Required Action |
|----------|---------|-----------------|
| BLOCKING | Must be fixed before merge | Author must fix |
| IMPORTANT | Should be fixed before merge | Author should fix |
| SUGGESTION | Consider fixing in a follow-up | Optional |
| QUESTION | I don't understand this | Author must clarify |
| PRAISE | This is well done | No action needed |
