# PR Rules

> Rules for creating, reviewing, and merging Pull Requests.

---

## PR Title Format

PR titles MUST follow the Conventional Commits format:

```
<type>(<scope>): <description>
```

### Format Rules
- **Maximum length**: 72 characters.
- **No period at end**.
- **Imperative mood**: "Add" not "Added" or "Adds".
- **Capitalize first letter of description**: "Add feature" not "add feature".

### Examples
```
feat(wardrobe): add image upload for clothing items
fix(auth): handle expired tokens gracefully
docs(readme): update setup instructions
refactor(api): extract validation logic into shared middleware
```

### PR Title vs Commit Title
- The PR title becomes the squash merge commit message.
- The PR title should describe the overall change, not individual commits.
- The PR body provides detailed context.

---

## PR Description Template

Every PR MUST include the following sections (copy and fill):

```markdown
## Description

[Provide a clear and concise description of the changes. What problem does this solve? Why is this change needed?]

## Type of Change

- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] refactor: Code restructuring
- [ ] docs: Documentation
- [ ] test: Test additions/changes
- [ ] chore: Maintenance
- [ ] perf: Performance improvement
- [ ] ci: CI/CD changes
- [ ] style: Formatting only

## Breaking Changes

- [ ] Yes (describe below)
- [ ] No

[If yes, describe what breaks and the migration path.]

## Related Issues/Tasks

Closes #[issue-number]
Related to #[issue-number]
Implements TASK-[task-id]

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

### Test Evidence
[Describe how you tested these changes. Include screenshots, logs, or test output.]

## Checklist

- [ ] Code follows coding standards
- [ ] Naming conventions are followed
- [ ] Architecture rules are followed
- [ ] No forbidden actions are performed
- [ ] File boundaries are respected
- [ ] API contracts are maintained or properly versioned
- [ ] Database schema changes have migrations
- [ ] Accessibility requirements are met
- [ ] Error handling is complete
- [ ] Input validation is present
- [ ] No secrets are committed
- [ ] No debugging artifacts (console.log, debugger, print)
- [ ] JSDoc/TSDoc is updated for public APIs
- [ ] README is updated (if needed)
- [ ] CHANGELOG is updated (if needed)
- [ ] ADR is created (if needed)
- [ ] Tests are added/updated for the change
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds

## Documentation

- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API documentation updated
- [ ] ADR created (if needed)
- [ ] Architecture documentation updated (if needed)

## Reviewers

@[reviewer1]
@[reviewer2]

## Additional Notes

[Any additional information for reviewers.]
```

---

## PR Size Limits

### Absolute Limits
| Metric | Maximum |
|--------|---------|
| Total lines changed | 500 lines |
| Files changed | 20 files |
| New files | 10 new files |

### Why Size Limits
- Large PRs are hard to review (review quality drops).
- Large PRs take longer to review (blocking progress).
- Large PRs have more merge conflicts.
- Large PRs are harder to revert.

### Exceptions
The following do NOT count toward size limits:
- Lock file changes (`package-lock.json`)
- Generated files (Prisma client, compiled output)
- Migration files (database migrations)
- Test fixture data
- Auto-generated documentation

### What to Do If Your PR Exceeds Limits
1. Split into multiple PRs, each representing a logical change.
2. Each PR should build on the previous one (but not depend on unmerged code).
3. Use draft PRs for work-in-progress that will be split later.

### PR Splitting Example
Instead of one PR with 800 lines:
```
PR 1: refactor(wardrobe): extract image processing logic (200 lines)
PR 2: feat(wardrobe): add image upload API endpoint (250 lines)
PR 3: feat(wardrobe): add image upload UI component (200 lines)
```

---

## Required Labels

Every PR MUST have at least one label:

### Type Labels (required, exactly one)
| Label | Description |
|-------|-------------|
| `type:feat` | New feature |
| `type:fix` | Bug fix |
| `type:refactor` | Code restructuring |
| `type:docs` | Documentation |
| `type:test` | Test changes |
| `type:chore` | Maintenance |
| `type:perf` | Performance |
| `type:ci` | CI/CD |
| `type:style` | Formatting |
| `type:revert` | Revert |

### Scope Labels (recommended)
| Label | Description |
|-------|-------------|
| `scope:frontend` | Frontend changes |
| `scope:backend` | Backend changes |
| `scope:ai` | AI layer changes |
| `scope:infra` | Infrastructure changes |
| `scope:database` | Database schema/migration changes |
| `scope:deps` | Dependency updates |

### Status Labels (optional)
| Label | Description |
|-------|-------------|
| `status:wip` | Work in progress (draft PR) |
| `status:needs-review` | Ready for review |
| `status:changes-requested` | Changes requested |
| `status:approved` | Approved and ready to merge |
| `status:blocked` | Blocked by another PR/issue |

### Review Labels (optional)
| Label | Description |
|-------|-------------|
| `review:security-required` | Security review needed |
| `review:performance-required` | Performance review needed |
| `review:accessibility-required` | Accessibility review needed |
| `review:urgent` | Urgent review needed |

---

## Required Reviewers

### Default Reviewers

| Change Type | Minimum Reviewers | Example Reviewers |
|-------------|------------------|-------------------|
| Frontend component | 1 | Frontend developer |
| Backend API | 1 | Backend developer |
| AI pipeline | 1 | AI developer |
| Database migration | 2 | Backend lead + DB specialist |
| Architecture change | 3 | Architecture board |
| Infrastructure change | 1 | Infrastructure lead |
| Documentation only | 0 | (Optional review) |
| Bug fix (critical) | 2 | Lead + senior developer |
| Security fix | 2 | Security reviewer + lead |

### Auto-Assignment
- PRs are automatically assigned to the default reviewer for the scope.
- The author can request additional reviewers.
- The author should NOT approve their own PR.

### Reviewer Responsibilities
1. Review within the turnaround time (see `review-rules.md`).
2. Provide constructive, specific feedback.
3. Verify the change works as described.
4. Check for edge cases, security issues, and performance impacts.
5. Approve only when all concerns are addressed.

---

## Required Checks Passing

### Pre-Merge Checks
ALL of the following must pass before a PR can be merged:

#### Frontend
- [ ] `npm run lint` — Zero errors, zero warnings
- [ ] `npm run typecheck` — Zero errors
- [ ] `npm run test` — All tests pass
- [ ] `npm run build` — Build succeeds

#### Backend
- [ ] `npm run lint` — Zero errors, zero warnings
- [ ] `npm run typecheck` — Zero errors
- [ ] `npm run test` — All unit/integration tests pass
- [ ] `npm run test:e2e` — E2E tests pass
- [ ] `npm run build` — Build succeeds

#### AI (Python)
- [ ] `flake8 python/` — Zero errors
- [ ] `black --check python/` — Formatting passes
- [ ] `mypy python/` — Zero errors
- [ ] `pytest python/tests/` — All tests pass

#### Infrastructure
- [ ] Docker build succeeds for all images
- [ ] Vercel build check passes (if applicable)
- [ ] Railway deploy check passes (if applicable)

### CI Pipeline
The CI pipeline runs automatically on every PR push. The pipeline:
1. Runs lint checks.
2. Runs type checks.
3. Runs unit tests.
4. Runs integration tests.
5. Runs build.
6. Runs E2E tests (if applicable).
7. Reports coverage.

### Skipping Checks
Checks can only be skipped with:
- A `[skip ci]` or `[ci skip]` in the commit message for documentation/trivial changes.
- Explicit approval from the tech lead for specific exceptions.

---

## PR Assignment Rules

### Author
- The person creating the PR is the author.
- The author is responsible for addressing feedback.
- The author should not merge their own PR (exception: trivial changes).

### Reviewer Assignment
1. **Default reviewers** based on changed files.
2. **Manual assignment**: Author can request specific reviewers.
3. **Random assignment**: If no specific reviewer is needed, use round-robin.
4. **Team lead assignment**: If the PR is complex, the lead assigns reviewers.

### Re-Assignment
- If a reviewer is unavailable (> 24 hours), the PR can be re-assigned.
- Re-assignment requires notifying the original reviewer.
- The author can request re-assignment if the assigned reviewer is not responsive.

---

## PR Merge Strategies

### Default Strategy: SQUASH MERGE
The project uses SQUASH MERGE as the default merge strategy.

### Why Squash Merge
1. **Keeps history clean**: One commit per feature/fix.
2. **Makes reverts easy**: Revert a single commit to undo a feature.
3. **Eliminates noise**: Removes "WIP" and "fix review feedback" commits.
4. **Preserves context**: The squash commit message describes the entire change.

### Squash Commit Message
The squash commit uses the PR title as the commit subject. The PR body is used as the commit body. Format:
```
<pr-title>

<pr-body>
```

### Other Strategies
- **Rebase and merge**: Used for PRs where individual commits are meaningful and should be preserved.
- **Merge commit**: Used only for resolving conflicts in long-running branches (rare).

### Merge Strategy Decision
| Situation | Strategy |
|-----------|----------|
| Standard PR | Squash merge |
| Multiple meaningful commits | Rebase and merge (with approval) |
| Long-running feature branch | Merge commit (rare, with approval) |
| Hotfix from main | Squash merge |
| Release branch | Merge commit |

---

## PR Branch Naming

### Branch Naming Convention
```
<type>/<issue-number>-<short-description>
```

### Examples
```
feat/123-wardrobe-image-upload
fix/456-expired-token-handling
refactor/789-extract-validation-logic
docs/readme-update-env-vars
chore/101-update-typescript
```

### Branch Name Rules
1. **Use lowercase**: `feat/123-add-upload` not `Feat/123-Add-Upload`.
2. **Use hyphens** (not underscores): `feat/123-image-upload` not `feat/123_image_upload`.
3. **Include issue number**: `feat/123-description` (if applicable).
4. **Keep it short**: < 50 characters (not including type prefix).
5. **Describe the change**: `feat/123-image-upload` not `feat/123-my-branch`.

### Branch Name Examples
```
✅ feat/123-wardrobe-image-upload
✅ fix/456-expired-token
✅ refactor/789-extract-validator
✅ chore/101-update-deps
✅ docs/update-readme

❌ my-branch
❌ FIX/456 (wrong case)
❌ feature/123/image/upload (too long, wrong separator)
❌ fix (no description)
❌ test-branch-1 (no meaning)
```

---

## PR Draft Rules

### When to Use Draft PRs
Draft PRs should be used when:
1. **Work in progress**: The feature is not complete but you want early feedback.
2. **Testing CI**: You want to verify CI passes before marking ready.
3. **Demonstration**: You want to show progress without blocking others.

### Draft PR Requirements
- Must have the `status:wip` label.
- Must have a clear description of what is done and what remains.
- Can be reviewed but reviewers are not expected to do a full review.
- Draft PRs should not be merged.

### Converting Draft to Ready
When converting from draft to ready:
1. Remove the `status:wip` label.
2. Add the `status:needs-review` label.
3. Ensure the PR description is complete.
4. Ensure all checks pass.
5. Request reviewers.

---

## PR Conflict Resolution

### Responsibility
- The PR author is responsible for resolving merge conflicts.
- Reviewers may assist but the author should do the resolution.

### Resolution Process
1. **Update your branch**: `git fetch origin` and `git rebase origin/main` (or merge).
2. **Resolve conflicts**: Edit conflicting files to resolve.
3. **Verify resolution**: Run tests to ensure correctness.
4. **Push the resolved branch**: `git push --force-with-lease` (if rebased) or `git push` (if merged).

### Rebasing vs Merging
| Strategy | When to Use |
|----------|-------------|
| **Rebase** | Preferred. Keeps history linear. |
| **Merge** | Used when rebasing would require too much rework. |

### Conflict Prevention
1. Keep PRs small (under 500 lines).
2. Communicate with the team about overlapping work.
3. Update your branch frequently.
4. Work on independent modules to minimize shared file conflicts.

---

## PR Rollback Procedure

### When to Rollback a PR

A PR should be rolled back if:
1. **The build breaks** after merge.
2. **Tests fail** on the main branch due to the change.
3. **A production bug** is discovered within 24 hours.
4. **A security vulnerability** is identified.
5. **Performance regression** exceeds 20%.
6. **Data integrity issue** is discovered.

### Rollback Steps

1. **Identify the merge commit**: Found in the PR merge event.
2. **Create a revert PR**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b revert/<original-pr-number>
   git revert <merge-commit-hash> --no-edit
   git push origin revert/<original-pr-number>
   ```
3. **Create a PR** with the revert.
4. **Add the `type:revert` label**.
5. **Request review** (at least one approval, two for production changes).
6. **Merge the revert**.
7. **Notify the team** about the rollback.
8. **Create a task** to re-approach the change properly.

### Rollback PR Format
```
revert(<scope>): <original-pr-title>

This reverts PR #<original-pr-number>.

Reason: <reason for rollback>

Reopens #<original-issue-number>
```

### Do NOT
- Revert a revert (creates confusing history).
- Force push to main to "undo" a merge.
- Delete branches that were merged and reverted (history is important).

---

## PR Checklist (Summary)

### Before Creating a PR
- [ ] Code is complete and working.
- [ ] All tests pass locally.
- [ ] Lint passes locally.
- [ ] Type check passes locally.
- [ ] Build succeeds locally.
- [ ] PR title follows format: `<type>(<scope>): <description>`.
- [ ] PR description has all required sections.
- [ ] Branch name follows convention.
- [ ] PR is within size limits (< 500 lines, < 20 files).

### Before Requesting Review
- [ ] All checks pass in CI.
- [ ] At least one label is applied.
- [ ] Reviewers are assigned.
- [ ] PR is marked as "ready for review" (not draft).
- [ ] Documentation is updated (README, CHANGELOG, ADRs).
- [ ] Self-review is completed (check each changed file).

### Before Merging
- [ ] All required checks pass.
- [ ] Required approvals received.
- [ ] All review comments are addressed.
- [ ] No unresolved blocking issues.
- [ ] Branch is up to date with target branch.
- [ ] Security review is completed (if required).
- [ ] Performance review is completed (if required).

### After Merging
- [ ] Verify the merge on the target branch.
- [ ] Verify CI passes on the target branch.
- [ ] Close related issues.
- [ ] Update task status.
- [ ] Notify the team (if significant change).
