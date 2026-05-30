# Bug Fix Prompt — Closet Inteligente Digital

> **Purpose:** Template for structured bug investigation, root cause analysis, and fix implementation. Use this prompt when assigned a bug fix task or when a bug is reported via GitHub Issues.

---

## 1. Bug Investigation Workflow

```
RECEIVE BUG REPORT
       │
       ▼
UNDERSTAND BUG
  ├── Read bug report thoroughly
  ├── Identify affected component
  ├── Determine severity and priority
  └── Check if bug is already known (search existing issues)
       │
       ▼
REPRODUCE BUG
  ├── Set up environment matching the report
  ├── Follow reproduction steps
  ├── Verify bug exists
  └── Capture evidence (logs, screenshots, network traces)
       │
       ▼
ROOT CAUSE ANALYSIS
  ├── Hypothesize possible causes
  ├── Isolate the failing code path
  ├── Identify the exact root cause
  └── Verify the root cause (modify code to confirm)
       │
       ▼
IMPLEMENT FIX
  ├── Write regression test (must fail before fix)
  ├── Apply the fix
  ├── Verify regression test passes
  └── Verify existing tests still pass
       │
       ▼
VERIFY FIX
  ├── Run full test suite
  ├── Run lint + typecheck + build
  ├── Manual verification following reproduction steps
  └── Verify edge cases
       │
       ▼
DOCUMENT AND COMMIT
  ├── Update CHANGELOG.md
  ├── Update PROJECT_STATUS.md (if component status changed)
  ├── Write session log
  ├── Commit with fix message
  └── Create PR if applicable
```

---

## 2. Reproduction Steps Format

### 2.1 Standard Reproduction Template
```markdown
## Reproduction Steps

### Prerequisites
- **Environment:** Local | Staging | Production
- **Browser/Device:** Chrome 124 | Firefox 125 | Safari 17.4 | iOS 17.4 | Android 14
- **Screen Size:** Desktop (1920x1080) | Tablet (768x1024) | Mobile (375x667)
- **User Role:** Unauthenticated | User | Admin
- **Data State:** Fresh account | Account with 50+ garments | Account with scheduled outfits
- **Feature Flags:** <relevant flags and their values>

### Steps to Reproduce
1. Go to <URL or navigation path>
2. Click on <element>
3. Fill in <field> with value "<value>"
4. Submit the form
5. [See error]

### Expected Behavior
<what should happen>

### Actual Behavior
<what actually happens, including error messages, console errors, network responses>

### Evidence
- **Screenshot:** <link or embed>
- **Console Log:** 
  ```
  <relevant console output>
  ```
- **Network Request:** 
  ```
  Method: POST
  URL: /api/v1/garments
  Request: <truncated payload>
  Response Status: 500
  Response Body: {"error": {"code": "INTERNAL_ERROR", "message": "..."}}
  ```
- **Server Logs:**
  ```
  [2026-05-25T10:30:00.000Z] ERROR [GarmentService] Failed to create garment: ...
  ```
```

### 2.2 Non-Deterministic Bug Reproduction
If the bug is intermittent:
```
### Reproduction Frequency
- **Occurs:** Always | Often (75%+) | Sometimes (25-75%) | Rarely (<25%)

### Conditions That Affect Occurrence
- <condition that makes it more likely>
- <condition that makes it less likely>

### Attempts to Reproduce
| Attempt | Environment | Data State | Result |
|---|---|---|---|
| 1 | Local Chrome | Fresh account | ❌ Not reproduced |
| 2 | Local Chrome | 100 garments | ✅ Reproduced |
| 3 | Staging Chrome | 100 garments | ✅ Reproduced |
| 4 | Staging Firefox | 100 garments | ❌ Not reproduced |
```

---

## 3. Root Cause Analysis Format

### 3.1 Root Cause Analysis Template
```markdown
## Root Cause Analysis

### Bug Summary
- **Bug ID:** <GitHub Issue # or bug ID>
- **Title:** <brief description>
- **Severity:** Critical | High | Medium | Low
- **Component:** <component ID and name from PROJECT_STATUS.md>
- **Reported:** YYYY-MM-DD
- **Analyzed:** YYYY-MM-DD

### Impact Assessment
- **Users Affected:** All | Authenticated users | Specific role | Specific page visitors
- **Data Loss Risk:** Yes | No | Metadata only
- **Workaround Available:** Yes | No
- **Workaround Description:** <if yes, describe the workaround>

### Investigation Trail

#### Hypothesis 1: <description>
- **Evidence For:**
  - <evidence point>
  - <evidence point>
- **Evidence Against:**
  - <evidence point>
- **Result:** ❌ Ruled out

#### Hypothesis 2: <description>
- **Evidence For:**
  - <evidence point>
  - <evidence point>
- **Evidence Against:**
  - <evidence point>
- **Result:** ❌ Ruled out

#### Hypothesis 3: <description> (CONFIRMED)
- **Evidence For:**
  - <evidence point>
  - <evidence point>
  - <evidence point>
- **Evidence Against:**
  - <none>
- **Result:** ✅ Root cause identified

### Root Cause Statement
<A single, clear sentence describing the root cause. Include the file, line number, and the specific error.>

**Example:**
"In `apps/api/src/modules/garment/garment.service.ts:156`, the `findAll` method uses `repository.find()` without passing the `userId` filter to the `where` clause, causing it to return garments for ALL users instead of only the authenticated user."

### Root Cause Category
- Logic error (incorrect condition, missing check)
- Race condition (async operation not properly synchronized)
- Off-by-one error (boundary value)
- Null/undefined reference (missing null check)
- Type mismatch (incorrect type assertion or conversion)
- Missing validation (input not validated before use)
- Configuration error (wrong environment variable, misconfigured service)
- API contract mismatch (frontend sends different format than backend expects)
- Performance issue (timeout due to slow query or N+1)
- External service failure (downstream API, database, cache)
- Regression (previously working code broken by recent change)
- Migration issue (data migration left data in inconsistent state)

### Code Path Trace
```
<component>:<line> → <component>:<line> → <component>:<line> → ...
```

**Example:**
```
GarmentUploadPage:42 → apiClient.createGarment():120 → garmerService.create():88 → 
garmentRepository.save():95 → aiGateway.detectGarment():210 → 
aiService.detect():45 → TypeError: Cannot read properties of undefined (reading 'mask')
```

### Why It Was Not Caught Earlier
- Missing test for this specific scenario
- Test data did not cover edge case
- Code review missed it
- No type check coverage in this area
- Runtime error only occurs with specific data conditions

### Similar Bugs Detection
- <search terms to find similar patterns elsewhere in the codebase>
- <list of other locations that might have the same issue>
```

---

## 4. Fix Implementation Guide

### 4.1 Fix Planning
```markdown
## Fix Plan

### Approach
<description of how to fix the root cause>

### Minimal Change
<describe the smallest possible change to fix the bug>

### Files to Modify
| File | Change |
|---|---|
| `apps/api/src/modules/garment/garment.service.ts:156` | Add `where: { userId }` filter |
| `apps/api/src/modules/garment/garment.service.spec.ts` | Add test case for filtering by userId |

### Regression Test
```typescript
// Test that MUST fail before the fix and pass after
it('should only return garments for the specified user', async () => {
  const userAGarments = [createMockGarment({ userId: 'user-a' })];
  const userBGarments = [createMockGarment({ userId: 'user-b' })];
  
  repository.findAndCount.mockResolvedValue([userAGarments, 1]);
  
  const result = await service.findAll('user-a', { page: 1, pageSize: 20 });
  
  expect(result.data).toHaveLength(1);
  expect(result.data[0]!.userId).toBe('user-a');
  expect(repository.findAndCount).toHaveBeenCalledWith(
    expect.objectContaining({ where: { userId: 'user-a' } }),
  );
});
```

### Edge Cases to Verify
- <edge case 1>
- <edge case 2>
- <edge case 3>

### Risks of This Fix
- <potential side effect or risk>
- <mitigation for the risk>
```

### 4.2 Fix Implementation Principles
1. **Smallest change possible:** Fix the root cause with minimal code changes. Do not refactor unrelated code.
2. **Regression test first:** Write a test that reproduces the bug and fails before your fix. This test should pass after the fix.
3. **One bug, one fix:** If you discover another bug during investigation, file a new issue. Do not fix it in the same change.
4. **Do not mask symptoms:** Fix the root cause, not the symptom. Adding a try/catch that swallows an error is not a fix.
5. **Add logging if needed:** If debugging was difficult, add logging to make future debugging easier.
6. **Check for similar bugs:** After identifying the pattern that caused this bug, search for similar patterns elsewhere.

### 4.3 Fix Patterns by Bug Category

| Bug Category | Fix Pattern | Example |
|---|---|---|
| **Null reference** | Add null check with optional chaining or early return | `const name = user?.name ?? 'Unknown'` |
| **Missing validation** | Add class-validator decorators or runtime validation | `@IsUUID() @IsNotEmpty() id: string` |
| **Race condition** | Add mutex, proper async/await, or state machine | Use `Promise.all` or queue operations |
| **SQL injection** | Replace string interpolation with parameterized queries | `WHERE id = $1` not `WHERE id = '${id}'` |
| **N+1 query** | Add eager loading, join, or batch loading | `relations: ['garments']` or `findAndCount` |
| **Off-by-one** | Correct the boundary condition | `<=` instead of `<` |
| **Type mismatch** | Add type guard or proper serialization | `Number(val)` or custom type guard |
| **Auth bypass** | Add guard or middleware check | `@UseGuards(JwtAuthGuard)` |
| **Missing state update** | Add setState or Zustand action call | `set({ garments: newGarments })` |
| **UI stale data** | Invalidate TanStack Query cache | `queryClient.invalidateQueries({ queryKey: ['garments'] })` |

---

## 5. Verification Steps

### 5.1 Verification Checklist
- [ ] Regression test passes (test that failed before the fix)
- [ ] All existing unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass for the affected flow
- [ ] Lint passes (`npm run lint` / `ruff check .`)
- [ ] Type check passes (`npm run typecheck` / `mypy .`)
- [ ] Build passes (`npm run build` / `nest build`)
- [ ] Test coverage maintained (≥80%)

### 5.2 Manual Verification
- [ ] Follow the original reproduction steps — bug should no longer occur
- [ ] Test the happy path (normal usage still works)
- [ ] Test the fix with different data variations
- [ ] Test on affected browsers/devices (if frontend bug)
- [ ] Test with feature flags toggled (if applicable)

### 5.3 Edge Case Verification
- [ ] What happens if the input is empty/null/undefined?
- [ ] What happens with very large input?
- [ ] What happens with special characters or Unicode?
- [ ] What happens with concurrent requests?
- [ ] What happens when network fails or times out?
- [ ] What happens when the database is unavailable?
- [ ] What happens with rate-limited requests?

---

## 6. Documentation and Commit

### 6.1 Memory System Updates
- **CHANGELOG.md:** Add entry under `[Unreleased]` with `### Fixed` section
- **PROJECT_STATUS.md:** Update component status if applicable
- **AGENT-LOGS:** Write session log with investigation details
- **Component specs:** Update if the bug reveals missing documentation

### 6.2 Commit Message Format
```
fix(<scope>): <imperative description of fix>

<detailed explanation of the root cause and fix>

Root cause: <one-line root cause>

Memory files updated:
- CHANGELOG.md: added fix entry
- PROJECT_STATUS.md: updated component status

Fixes #<issue-number>
```

**Examples:**
```
fix(garment): filter garments by userId in findAll query

The findAll method was not passing the userId filter to the TypeORM
findAndCount query, causing it to return garments for all users instead
of only the authenticated user.

Added `where: { userId }` to the query options and a unit test that
verifies the filter is applied correctly.

Root cause: Missing where clause in repository query

Memory files updated:
- CHANGELOG.md: added fix entry

Fixes #128
```

### 6.3 PR Description for Bug Fixes
```markdown
## Summary
<2-3 sentences explaining the bug and the fix>

## Root Cause
<detailed root cause analysis>

## Fix
<description of the fix>

## Testing
- [x] Regression test added (fails before fix, passes after)
- [x] All existing tests pass
- [x] Manual verification following reproduction steps
- [x] Edge cases verified

## Memory System Updates
- [x] CHANGELOG.md updated
- [ ] PROJECT_STATUS.md updated (if applicable)

Fixes #<issue-number>
```

---

## 7. Bug Severity Classification

| Severity | Definition | Response Time | Fix Timeline |
|---|---|---|---|
| **Critical** | Data loss, security breach, complete app crash, core feature broken for all users | Immediate | <4 hours |
| **High** | Major feature broken for many users, workaround is difficult | <2 hours | <24 hours |
| **Medium** | Feature partially broken, workaround exists | <8 hours | <72 hours |
| **Low** | Cosmetic issue, minor feature affected, edge case | <48 hours | Next sprint |

---

## 8. Bug Fix Post-Mortem Template (for Critical/High bugs)

```markdown
# Bug Post-Mortem — <Bug Title>

**Bug ID:** #<issue>
**Date:** YYYY-MM-DD
**Author:** <agent-id>

## Timeline
- **YYYY-MM-DD HH:MM** — Bug reported
- **YYYY-MM-DD HH:MM** — Bug triaged (severity: Critical)
- **YYYY-MM-DD HH:MM** — Investigation started
- **YYYY-MM-DD HH:MM** — Root cause identified
- **YYYY-MM-DD HH:MM** — Fix deployed
- **YYYY-MM-DD HH:MM** — Verification complete

## Impact
- **Users Affected:** <count>
- **Downtime:** <duration>
- **Data Loss:** Yes/No <details>

## Root Cause
<detailed description>

## Why It Was Not Caught
<what tests/checks/reviews should have caught this>

## Preventative Measures
- <action to prevent this class of bug>
- <action to improve detection>
- <action to improve response time>

## Action Items
- [ ] <action item> (Owner: <name>, Due: <date>)
- [ ] <action item> (Owner: <name>, Due: <date>)
```
