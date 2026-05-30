# Refactoring Rules

> Rules governing when and how code refactoring may be performed.

---

## When Refactoring Is Allowed

Refactoring is ALLOWED in the following circumstances:

### 1. Technical Debt Removal
When code has been flagged as technical debt (via a task or issue), refactoring is permitted to:
- Remove duplicated code.
- Simplify overly complex logic.
- Improve naming clarity.
- Extract reusable abstractions.
- Improve type safety.

### 2. Performance Optimization
When profiling has identified a performance bottleneck:
- Refactoring is permitted to improve performance.
- Performance improvements must be measured and documented.
- Minimum 20% improvement required to justify refactoring for performance alone.

### 3. Code Review Feedback
When a code review identifies structural issues:
- Refactoring is permitted to address review feedback.
- Scope is limited to the reviewed code.

### 4. Bug Fix Prerequisite
When a bug cannot be fixed without first refactoring the surrounding code:
- Refactoring is permitted as a prerequisite.
- Must be in a separate commit from the actual bug fix.

### 5. Architecture Alignment
When code no longer aligns with the documented architecture:
- Refactoring is permitted to restore alignment.
- Must reference the relevant architecture document or ADR.

### 6. Testability Improvement
When code cannot be adequately tested without refactoring:
- Refactoring is permitted to improve testability.
- Tests must be written before refactoring (test the existing behavior).

---

## When Refactoring Is FORBIDDEN

Refactoring is FORBIDDEN in the following circumstances:

### 1. During Bug Fixes
- NEVER refactor while fixing a bug.
- Bug fixes must be minimal, targeted changes.
- Refactoring during bug fixes introduces risk of new bugs.
- If refactoring is needed, do it in a separate PR/commit.

### 2. During Feature Development
- Do NOT refactor unrelated code while implementing a feature.
- Only refactor code directly related to the feature being implemented.
- Refactoring scope must be documented in the task description.

### 3. Without Tests
- NEVER refactor code that does not have adequate test coverage.
- If code has no tests, FIRST write tests to lock in current behavior.
- Then refactor.

### 4. Without Understanding
- NEVER refactor code you do not fully understand.
- If you cannot explain what the code does, do not refactor it.
- Ask for help or pair with someone who understands the code.

### 5. For Personal Preference
- NEVER refactor code just because you "like it better a different way."
- The codebase must maintain consistent style; personal preferences are secondary.
- If the code follows existing patterns, it does not need refactoring.

### 6. During Code Freeze
- NEVER refactor during a code freeze period.
- Only critical bug fixes and security patches are allowed.
- Refactoring is not critical.

### 7. In Production Hotfixes
- NEVER refactor in a hotfix branch.
- Hotfixes must be minimal, targeted, and low-risk.
- Refactoring introduces unnecessary risk.

### 8. To Avoid Learning Existing Patterns
- NEVER refactor because you haven't learned the existing patterns.
- Learn the existing patterns first; they exist for a reason.

---

## Refactoring Approval Process

### For Refactoring <= 3 Files (Minor Refactoring)

1. **Self-approval** allowed.
2. Must follow all refactoring rules.
3. Must include a note in the PR description about what was refactored and why.
4. Must have tests before and after.

### For Refactoring 4-10 Files (Moderate Refactoring)

1. Must create a refactoring task in `project-memory/tasks/refactoring/`.
2. Task must include:
   - Files to be refactored.
   - Reason for refactoring.
   - Expected outcome.
   - Risk assessment.
3. Must get approval from at least one other team member.
4. PR must be reviewed by at least two team members.

### For Refactoring > 10 Files (Major Refactoring)

1. Must create an ADR (Architecture Decision Record).
2. ADR must be approved by the architecture board.
3. Must create a detailed refactoring plan.
4. Refactoring must be split into multiple PRs (max 10 files per PR).
5. Each PR must be individually reviewed.
6. Must have integration tests before the refactoring begins.

---

## Refactoring Scope Limits

### Absolute Limits
- **Maximum files per refactoring PR**: 10 files
- **Maximum lines changed per refactoring PR**: 500 lines
- **Maximum refactoring PRs in progress**: 2 per agent
- **Maximum refactoring PRs active at once (project-wide)**: 5

### Recommended Limits
- **Maximum files per refactoring PR**: 3 files (preferred)
- **Maximum lines changed per refactoring PR**: 200 lines (preferred)
- **Maximum duration of a refactoring task**: 3 days

---

## Must Have Tests Before Refactoring

### Rule
You MUST have tests that cover the existing behavior of the code you are refactoring BEFORE you begin refactoring.

### Why
Without tests, you cannot be sure that your refactoring preserves existing behavior. Tests act as a safety net.

### What to Do
1. If tests exist: Run them. Verify they pass.
2. If tests are incomplete: Add tests to cover the behavior.
3. If no tests exist: Write tests that cover the current behavior (even if the behavior seems wrong — test what it does, not what it should do).
4. Only then: Begin refactoring.

### Exception
If refactoring is specifically to make code testable, AND:
- The current code is untestable
- AND no tests can be written as-is
- THEN: Write characterization tests that document observed behavior at a higher level (integration/E2E level), then refactor to enable unit tests.

---

## Must Maintain Same Public API

### Rule
Refactoring must NOT change the public API of the refactored code.

### What This Means
- **Same function signatures**: Same name, same parameters (type and order), same return type.
- **Same class interfaces**: Same method names, same method signatures.
- **Same exports**: Same exported names, same export type (named vs default).
- **Same module path**: The file path should not change unless explicitly planned.
- **Same behavior**: For the same inputs, the same outputs.

### What You CAN Change
- Internal implementation details.
- Variable names.
- Code structure (local functions, extracted methods).
- Comments and documentation.
- Private/internal types.

### What You CANNOT Change
- Public function signatures.
- Exported interface names.
- Module export names.
- File paths (unless documented and imports updated).

---

## Must Not Change Behavior

### Rule
Refactoring must preserve the existing behavior of the code. The code must work exactly the same way before and after refactoring.

### How to Verify
1. **Run tests**: All tests must pass before and after.
2. **Run the application**: Verify manually that the feature works.
3. **Compare outputs**: If possible, run both versions and compare outputs.
4. **Snapshot testing**: For UI components, use snapshot tests to detect visual changes.

### What IS Behavior
- What the function returns for a given input.
- What side effects occur (API calls, database writes, state changes).
- What errors are thrown.
- Performance characteristics (within reasonable bounds).

### What IS NOT Behavior
- Variable names.
- Code formatting.
- Internal function ordering.
- Comment content.

---

## Refactoring Documentation Requirements

### For Every Refactoring (Even Minor)

PR description must include:
- **What was refactored** (list of files/modules).
- **Why it was refactored** (the specific reason, e.g., "removed duplication in validation logic").
- **What was preserved** (confirmation that public API and behavior remain unchanged).
- **Test coverage** (which tests cover the refactored code).

### For Moderate Refactoring (4-10 Files)

In addition to the above:
- Link to the refactoring task.
- Summary of changes (what was extracted, renamed, restructured).
- Risk assessment (what could go wrong and what the rollback plan is).

### For Major Refactoring (> 10 Files)

In addition to the above:
- Link to the ADR.
- Detailed refactoring plan with phases.
- Migration guide for any other teams/agents affected.
- Rollback plan (how to revert if something goes wrong).

---

## Refactoring Rollback Criteria

### Immediate Rollback Required
Rollback the refactoring IMMEDIATELY if:
1. **Tests fail** after refactoring (and the failure is not a pre-existing issue).
2. **Behavior changes** are detected in production.
3. **Performance degrades** by more than 10%.
4. **Build fails** after the refactoring PR is merged.
5. **Security vulnerability** is introduced (or discovered in the refactored code).

### Rollback Process
1. **Revert the commit**: `git revert <refactoring-commit-hash>`.
2. **Verify rollback**: Run tests to confirm the code works as before.
3. **Create task**: Create a task to re-approach the refactoring more carefully.
4. **Document**: Add notes to the refactoring task explaining why it was rolled back.

### Rollback Decision Matrix

| Condition | Rollback? | Action |
|-----------|-----------|--------|
| Unit tests fail | Yes | Revert immediately |
| Integration tests fail | Yes | Revert immediately |
| E2E tests fail | Yes | Revert immediately |
| Build fails | Yes | Revert immediately |
| Production bug introduced | Yes | Revert immediately |
| Performance regression > 10% | Yes | Revert and investigate |
| Performance regression <= 10% | Maybe | Assess severity; may proceed with fix |
| Code style disagreement | No | Discuss in review; no rollback |
| Minor behavior change (internal) | Maybe | Assess impact; may proceed |
| Missing documentation | No | Add documentation; no rollback |

---

## Refactoring Checklist

### Before Refactoring
- [ ] Refactoring is allowed (check allowed circumstances).
- [ ] Refactoring is not forbidden (check forbidden circumstances).
- [ ] Approval is obtained (if required for the scope).
- [ ] Tests exist that cover the refactored code.
- [ ] All existing tests pass.

### During Refactoring
- [ ] Staying within scope limits (max 10 files, max 500 lines).
- [ ] Public API is preserved.
- [ ] Behavior is unchanged.
- [ ] Running tests frequently.

### After Refactoring
- [ ] All tests pass.
- [ ] Build succeeds.
- [ ] Lint passes.
- [ ] Type check passes.
- [ ] Documentation is updated (if needed).
- [ ] PR description includes refactoring details.
- [ ] Rollback plan is documented (if moderate/major refactoring).

---

## Common Refactoring Patterns

### Pattern 1: Extract Function
When a function is too long or doing too many things:
1. Identify related code blocks.
2. Extract each block into its own function.
3. Preserve the original function's public API.
4. Name the new functions clearly.

### Pattern 2: Rename Variable
When a variable name is unclear:
1. Use IDE rename (or search-and-replace).
2. Update all references.
3. Verify the build passes.

### Pattern 3: Extract Class/Module
When a module is doing too many things:
1. Identify the distinct responsibilities.
2. Create new modules for each responsibility.
3. Move the relevant code.
4. Update imports in all referencing files.

### Pattern 4: Simplify Conditionals
When conditionals are deeply nested:
1. Use early returns.
2. Extract conditions into named variables.
3. Use ternary operators for simple conditions.
4. Use switch/pattern matching for multiple conditions.

### Pattern 5: Remove Dead Code
When code is never used:
1. Verify through search that the code is truly unused.
2. Verify through tests that removing it doesn't break anything.
3. Remove the code.
4. Do this in a separate commit from other changes.
