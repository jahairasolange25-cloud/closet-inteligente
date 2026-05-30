# Code Review Prompt — Closet Inteligente Digital

> **Purpose:** Guide for reviewing code changes across the CID platform. Covers all review categories with specific criteria, scoring rubrics, and required output format. Use this prompt when asked to perform a code review or when opening a PR that requires review.

---

## 1. Review Scope Determination

Before starting, determine the scope of the review:

| Dimension | Scope Levels |
|---|---|
| **Review Depth** | Quick scan (lint/style only) | Standard (functionality + tests) | Deep (full architecture + security) |
| **Files to Review** | PR diff only | PR + related files | PR + related + cross-cutting concerns |
| **Time Estimate** | <15 min | 15-45 min | 45-120 min |

**Default scope for:** 
- AI agent PRs → Deep review (full architecture + security)
- Bug fix PRs → Standard review
- Documentation PRs → Quick scan
- Refactor PRs → Deep review

---

## 2. Review Categories

### 2.1 Architecture & Design

**What to check:**
- Does the change follow the established architecture patterns (NestJS modules, App Router, etc.)?
- Does it violate any accepted ADR?
- Is the component placed in the correct directory?
- Are the abstractions at the right level?
- Is the code over-engineered or under-engineered for the problem?
- Does it follow the Single Responsibility Principle?
- Are there unnecessary dependencies between modules?
- Does the change respect the layer boundaries (controller → service → repository)?

**Scoring:**
- 0: Violates established architecture or ADRs
- 1: Minor deviation from patterns
- 2: Follows conventions but has design issues
- 3: Clean architecture, proper abstractions, follows all patterns

### 2.2 Security

**What to check:**
- Are all user inputs validated and sanitized?
- Are SQL queries parameterized (no string interpolation)?
- Are secrets, keys, or tokens exposed anywhere in code or logs?
- Is authentication required for protected endpoints?
- Are authorization checks in place (user can only access their own data)?
- Is there proper CORS configuration?
- Are file uploads validated (type, size, content)?
- Are rate limits applied to sensitive endpoints?
- Is there protection against XSS, CSRF, SQL injection?
- Are error messages leaking internal information?

**Scoring:**
- 0: Critical security vulnerability found (stop review, flag immediately)
- 1: Medium security concern (exposed information, missing validation)
- 2: Minor security issue (missing rate limit, permissive CORS)
- 3: All security best practices followed

### 2.3 Performance

**What to check:**
- Are there N+1 query patterns? (Watch for TypeORM lazy loading)
- Are lists paginated where there could be many results?
- Are images using Next.js `Image` component with proper sizing?
- Are heavy components lazy-loaded with `next/dynamic`?
- Are expensive computations memoized (`useMemo`, `useCallback`)?
- Are there unnecessary re-renders in React components?
- Are API responses returning too much data?
- Are database queries indexed appropriately?
- Is client-side JavaScript bundle impacted significantly?
- Are async operations properly awaited?

**Scoring:**
- 0: Critical performance issue (N+1 queries, no pagination on large dataset)
- 1: Medium concern (missing memoization, unnecessary re-renders)
- 2: Minor issue (could be optimized but acceptable)
- 3: Performance considerations addressed appropriately

### 2.4 Accessibility

**What to check (frontend changes only):**
- Are images using `alt` text?
- Are form inputs associated with labels?
- Is keyboard navigation supported (tab order, focus management)?
- Are color contrasts sufficient (WCAG 2.1 AA)?
- Are ARIA attributes used correctly?
- Are clickable elements properly identified as buttons/links?
- Are focus indicators visible?
- Is the page structure semantic (headings, landmarks)?
- Are error messages announced by screen readers?
- Is there a skip-to-content link?

**Scoring:**
- 0: Blocks user (image missing alt, no keyboard nav)
- 1: Hinders user (poor contrast, missing labels)
- 2: Minor issue (non-semantic heading, missing ARIA)
- 3: WCAG 2.1 AA compliant

### 2.5 Testing

**What to check:**
- Are there unit tests for new logic?
- Do tests cover happy path + error cases + edge cases?
- Are tests deterministic (no flaky tests)?
- Do tests avoid testing implementation details?
- Are test names descriptive (`should <expected> when <condition>`)?
- Is the coverage threshold met (≥80% overall)?
- Are mocked dependencies properly set up and restored?
- Are there integration tests for service-layer changes?
- Are there E2E tests for critical user flows?
- Do bug fixes include a regression test?

**Scoring:**
- 0: No tests added for new code or bug fix
- 1: Insufficient tests (missing edge cases, low coverage)
- 2: Adequate tests but could be improved
- 3: Comprehensive tests covering all scenarios

### 2.6 Documentation

**What to check:**
- Are new public APIs documented with TSDoc/JSDoc?
- Are new endpoints documented in the API docs?
- Are new environment variables documented in `.env.example`?
- Are complex algorithms or business logic explained with comments?
- Is there a TODO comment without a GitHub Issue reference?
- Are memory system files updated (PROJECT_STATUS, CHANGELOG)?
- Is the PR description clear about WHAT and WHY?
- Are breaking changes documented?
- Are migration steps documented for database changes?

**Scoring:**
- 0: No documentation added for public API
- 1: Incomplete documentation (missing params, no examples)
- 2: Adequate documentation with minor gaps
- 3: Comprehensive documentation with examples and edge cases

### 2.7 Naming & Style

**What to check:**
- Do files follow naming conventions (kebab-case for files, PascalCase for components)?
- Do variables/functions have descriptive names?
- Do interfaces use `I` prefix (`IGarment` not `GarmentInterface`)?
- Do enums use `E` prefix (`EGarmentType` not `GarmentType`)?
- Are constants in `UPPER_SNAKE_CASE`?
- Are database columns in `snake_case`?
- Are React hooks prefixed with `use`?
- Are event handlers prefixed with `handle`?
- Are boolean variables prefixed with `is`/`has`/`can`?
- Does the code follow Prettier formatting rules?
- Are import ordering rules followed?

**Scoring:**
- 0: Widespread naming violations
- 1: Several violations in key areas
- 2: Minor naming inconsistencies
- 3: All naming conventions followed consistently

### 2.8 Error Handling

**What to check:**
- Are errors handled gracefully (not swallowed)?
- Are appropriate HTTP exceptions used (NestJS: NotFoundException, BadRequestException, etc.)?
- Are error boundaries in place for React components?
- Are API errors returned with consistent structure `{success, error: {code, message, details}}`?
- Are try/catch blocks used appropriately (not catching everything with `catch (e)`)?
- Are error messages user-friendly and not technical?
- Are promises properly handled with `.catch()` or `await` in try/catch?
- Is there a fallback UI for error states?
- Are network errors handled (timeout, offline)?
- Are async operations validated before proceeding?

**Scoring:**
- 0: Errors are swallowed or crash the application
- 1: Inconsistent error handling
- 2: Adequate error handling with minor gaps
- 3: Comprehensive error handling with fallbacks and user-friendly messages

### 2.9 Edge Cases

**What to check:**
- Empty state: What happens when there's no data?
- Loading state: Is there a loading indicator?
- Error state: What happens when an operation fails?
- Null/undefined: Are nullable values checked with optional chaining?
- Boundary values: Are max/min values tested (pagination, file size)?
- Race conditions: Could two operations interfere?
- Concurrency: What happens with simultaneous updates?
- Offline: Does the app handle network disconnection gracefully?
- Timeout: Are long-running operations handled?
- Invalid input: Are unexpected inputs rejected?

**Scoring:**
- 0: Critical edge case ignored
- 1: Some edge cases handled, others missed
- 2: Most edge cases handled
- 3: All edge cases systematically addressed

---

## 3. Scoring Criteria

### 3.1 Overall Score Calculation

| Category | Weight |
|---|---|
| Architecture & Design | 15% |
| Security | 20% |
| Performance | 10% |
| Accessibility | 5% |
| Testing | 20% |
| Documentation | 10% |
| Naming & Style | 5% |
| Error Handling | 10% |
| Edge Cases | 5% |

**Formula:** `Score = Σ(CategoryScore × Weight)`

### 3.2 Score Interpretation

| Score | Verdict | Action |
|---|---|---|
| 2.5 - 3.0 | ✅ Approve | Ready to merge |
| 2.0 - 2.49 | ⚠️ Conditional Approve | Minor changes requested, can merge after addressed |
| 1.5 - 1.99 | ❌ Request Changes | Significant issues must be resolved before merge |
| < 1.5 | 🚫 Block | Critical issues, stop and redesign |

### 3.3 Thresholds by PR Type

| PR Type | Min Score |
|---|---|
| Bug fix | 2.0 |
| New feature | 2.5 |
| Refactor | 2.5 |
| Hotfix | 1.5 (post-merge review at 2.5) |
| Documentation | 2.0 (architecture + naming + doc categories only) |
| Infrastructure | 2.0 (architecture + security + performance only) |

---

## 4. Required Review Output Format

### 4.1 Standard Review Output Template

```markdown
## Code Review — PR #<number>: <PR Title>

**Reviewer:** <agent-id>  
**Date:** YYYY-MM-DD  
**Review Depth:** Quick | Standard | Deep  
**Files Reviewed:** <count>  
**Total Changes:** +<added> / -<deleted> lines

---

### Summary

<2-3 sentences summarizing the overall quality and readiness of the PR>

---

### Category Scores

| Category | Score (0-3) | Weight | Weighted |
|---|---|---|---|
| Architecture & Design | X.X | 15% | X.XX |
| Security | X.X | 20% | X.XX |
| Performance | X.X | 10% | X.XX |
| Accessibility | X.X | 5% | X.XX |
| Testing | X.X | 20% | X.XX |
| Documentation | X.X | 10% | X.XX |
| Naming & Style | X.X | 5% | X.XX |
| Error Handling | X.X | 10% | X.XX |
| Edge Cases | X.X | 5% | X.XX |
| **Overall** | | **100%** | **X.XX** |

**Verdict:** ✅ Approve | ⚠️ Conditional Approve | ❌ Request Changes | 🚫 Block

---

### Detailed Findings

#### ✅ Strengths
- <specific strength with file/line reference>
- <specific strength with file/line reference>

#### 🔴 Critical Issues (must fix before merge)
- **<file>:<line>** — <description of issue with category reference>
  - **Suggestion:** <how to fix>
  - **Severity:** Critical

#### 🟡 Major Issues (should fix before merge)
- **<file>:<line>** — <description of issue with category reference>
  - **Suggestion:** <how to fix>
  - **Severity:** Major

#### 🔵 Minor Issues (nice to fix)
- **<file>:<line>** — <description of issue with category reference>
  - **Suggestion:** <how to fix or defer>
  - **Severity:** Minor

#### 💬 Questions / Clarifications
- **<file>:<line>** — <question about the implementation>
  - **Rationale:** <why you're asking>

---

### Testing Assessment

- **Test Coverage:** <estimated % for changed code>
- **Test Quality:** ❌ Poor | ⚠️ Needs Improvement | ✅ Good
- **Missing Tests:**
  - <scenario not covered>
  - <scenario not covered>
- **Flaky Test Risk:** None | Low | Medium | High

### Security Assessment

- **Vulnerabilities Found:** None | Low | Medium | High | Critical
- **If findings:** <list of specific security concerns>

### Performance Assessment

- **Regressions Detected:** None | Low | Medium | High
- **Bundle Impact:** <estimated KB change>
- **Query Efficiency:** ✅ Good | ⚠️ Needs Review | ❌ Issues

---

### Checklist

- [ ] Code compiles and builds
- [ ] All existing tests pass
- [ ] New tests are adequate
- [ ] Documentation is complete
- [ ] No security vulnerabilities
- [ ] Naming conventions followed
- [ ] Error handling is proper
- [ ] Edge cases addressed
- [ ] Memory files updated (if applicable)
- [ ] PR description is complete

---

### Final Recommendation

<Overall recommendation with reasoning. Example:>

"This PR is well-structured and follows our conventions. The testing is comprehensive with 92% coverage on new code. There are two minor issues to address: a missing error boundary for the garment detail page, and a potential N+1 query in the outfit service. Once addressed, this is ready to merge. **Conditional Approve.** "
```

### 4.2 Quick Review Output (for hotfixes or urgent PRs)
```
## Quick Review — PR #<number>

**Reviewer:** <agent-id>
**Date:** YYYY-MM-DD

### Verdict: ✅ Approve | ❌ Issues Found

### Issues (if any)
1. <file:line> — <brief description>
2. <file:line> — <brief description>

### Note
<1-2 sentences about any concerns or context>
```

### 4.3 Deep Review Output (adds to standard output)
```
### Cross-Cutting Concerns

<analysis of how this change affects other parts of the system>

### Long-Term Considerations
- <maintainability concern>
- <tech debt introduced>
- <future refactoring opportunity>

### Integration Points
- <how this interacts with other modules>
- <API contract changes>
- <database migration impact>

### Compliance Check
- [ ] GDPR / data privacy
- [ ] WCAG 2.1 AA accessibility
- [ ] Performance budgets
- [ ] Security best practices
```

---

## 5. Review Behavior Rules

### 5.1 Tone and Constructiveness
- Focus on the code, not the author. Use "this code" not "you did"
- Be specific: include file paths, line numbers, and concrete suggestions
- Explain WHY something is a concern, not just that it is
- Acknowledge what was done well, not only what needs improvement
- Offer alternatives, not ultimatics

### 5.2 Good Comments
```
✅ GOOD: "In garment.service.ts:42, this query uses find() without pagination.
If a user has 10,000 garments, this will load all into memory.
Consider using findAndCount() with skip/take for pagination."
```

```
✅ GOOD: "The GarmentCard component looks clean and well-tested. The
loading skeleton and error state are a nice touch. One suggestion:
in garment-card.tsx:78, the handleClick function is recreated on
every render. Wrapping it in useCallback would prevent unnecessary
child re-renders."
```

### 5.3 Needs Improvement Comments
```
❌ NEEDS IMPROVEMENT: "This is wrong." (too vague, no explanation)
❌ NEEDS IMPROVEMENT: "You should use pagination." (no why, no how)
❌ NEEDS IMPROVEMENT: "Bad code." (not constructive)
❌ NEEDS IMPROVEMENT: "Why would you do this?" (dismissive)
```

### 5.4 Comment Prioritization
When many issues are found, prioritize the review output:
1. **Critical:** Security vulnerabilities, data loss risk, crashes (must fix)
2. **Major:** Incorrect behavior, performance regressions, missing tests (should fix)
3. **Minor:** Style issues, naming, documentation gaps (nice to fix)
4. **Nitpick:** Personal preference, edge cases unlikely to occur (optional)

---

## 6. Automated Review Integration

Before starting a manual review, check automated results:

```bash
# Lint results
npm run lint

# Type check results
npm run typecheck

# Test results with coverage
npm run test -- --coverage

# Build check
npm run build

# Bundle analysis (frontend)
cd apps/web && npx next-bundle-analyzer

# Security audit
npm audit
cd services/ai && safety check
```

Do NOT repeat checks that are already passing in CI. Focus your review on things automated tools cannot catch: design, correctness, edge cases, security logic, and long-term maintainability.

---

## 7. Post-Review Follow-up

After submitting your review:

- [ ] Check back within 24 hours for responses to your comments
- [ ] Resolve conversations when changes are addressed
- [ ] Re-review if requested (focus on changed areas only)
- [ ] Update your verdict if the author addresses all concerns
- [ ] Log the review session in your agent session file
