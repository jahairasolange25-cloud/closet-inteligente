# Commit Rules

> Rules for creating commits in the Closet Inteligente Digital project.

---

## Commit Message Format

All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Format Rules
1. **Maximum subject length**: 72 characters.
2. **Maximum body line length**: 72 characters.
3. **No period at end of subject line**.
4. **Separate subject from body with a blank line**.
5. **Use imperative mood**: "Add feature" not "Added feature" or "Adds feature".
6. **Lowercase type and scope**: `feat(api)` not `Feat(API)`.
7. **No space before `:`**: `feat(scope):` not `feat(scope) :`.

### Examples

```
feat(wardrobe): add image upload for clothing items

Implements multipart image upload with automatic resizing and 
compression. Images are stored in Supabase storage with a 
CDN-backed URL returned to the client.

Closes #123
```

```
fix(auth): handle expired tokens gracefully

The auth guard was returning a 500 error when JWT tokens expired.
Changed to return a 401 with a clear error message and token 
refresh instructions.

Fixes #456
```

```
docs(readme): update setup instructions for new environment variables

Added documentation for the new SUPABASE_URL and SUPABASE_KEY 
environment variables required by the storage integration.
```

```
refactor(api): extract validation logic into shared middleware

Moved duplicate validation code from three controllers into a 
shared ValidationPipe to reduce code duplication.
```

---

## Allowed Commit Types

| Type | Description | When to Use |
|------|-------------|-------------|
| `feat` | A new feature | Adding a new capability, endpoint, component, or functionality |
| `fix` | A bug fix | Fixing a bug, error, or incorrect behavior |
| `chore` | Maintenance tasks | Build tasks, dependency updates, configuration changes |
| `refactor` | Code restructuring | Changing code structure without changing behavior |
| `docs` | Documentation changes | README, JSDoc, ADRs, markdown files |
| `test` | Test additions or changes | Adding or modifying tests |
| `style` | Formatting changes | Lint fixes, Prettier formatting, whitespace changes |
| `perf` | Performance improvements | Optimizations that improve speed or reduce memory |
| `ci` | CI/CD changes | GitHub Actions, Vercel, Railway configuration |
| `build` | Build system changes | Webpack, Vite, Babel, TypeScript config |
| `revert` | Reverting a previous commit | Rolling back a change |

### Discouraged Types
- `wip` — Use `chore` instead. WIP changes should not be committed.
- `init` — Use `chore` instead.
- `delete` — Use `chore` instead.
- `update` — Use a more specific type (`feat`, `fix`, `chore`, `refactor`).
- `improve` — Use `refactor` or `perf` instead.

---

## Scope Tags

### Frontend Scopes
| Scope | Description |
|-------|-------------|
| `ui` | UI components (buttons, modals, forms) |
| `wardrobe` | Wardrobe feature |
| `outfit` | Outfit builder feature |
| `tryon` | Virtual try-on feature |
| `profile` | User profile |
| `3d` | Three.js/React Three Fiber |
| `hooks` | Custom React hooks |
| `stores` | Zustand stores |
| `services` | API service layer |
| `types` | TypeScript type definitions |
| `utils` | Utility functions |
| `styles` | CSS/Tailwind styles |
| `pages` | Next.js pages/routes |
| `auth` | Authentication UI |
| `search` | Search and filter |

### Backend Scopes
| Scope | Description |
|-------|-------------|
| `api` | API endpoints/controllers |
| `auth` | Authentication and guards |
| `wardrobe` | Wardrobe module |
| `outfit` | Outfit module |
| `tryon` | Virtual try-on module |
| `profile` | User profile module |
| `notifications` | Notification system |
| `websocket` | WebSocket events |
| `database` | Database schema/migrations |
| `config` | Configuration |
| `common` | Shared utilities |
| `cache` | Redis caching |

### AI Scopes
| Scope | Description |
|-------|-------------|
| `segmentation` | Image segmentation pipeline |
| `pose` | Pose estimation pipeline |
| `recommendation` | Recommendation pipeline |
| `classification` | Clothing classification |
| `models` | Model management |
| `services` | FastAPI services |
| `utils` | Python utilities |

### Cross-Cutting Scopes
| Scope | Description |
|-------|-------------|
| `ci` | CI/CD configuration |
| `docker` | Docker configuration |
| `deps` | Dependency updates |
| `docs` | Documentation |
| `config` | Project configuration |
| `infra` | Infrastructure |

---

## Commit Body Requirements

### When a Body Is Required
A commit body is REQUIRED when:
1. **The change is non-obvious**: The "what" is not clear from the subject line.
2. **There are breaking changes**: The body must explain the breaking change and migration path.
3. **The commit closes an issue**: Reference the issue in the body.
4. **The commit affects multiple concerns**: Explain the scope of changes.

### Body Format
```
<what changed>
<why it changed>
<references to issues/tasks>
```

### Body Example
```
feat(wardrobe): add bulk delete for wardrobe items

Adds a new POST /api/v1/wardrobe/items/bulk-delete endpoint
that accepts an array of item IDs and deletes them in a single
transaction.

This is needed for the new multi-select feature in the wardrobe
grid view where users can select and delete multiple items at once.

Implements: #234
Closes: #235
```

---

## Breaking Change Notation

### How to Notate
Breaking changes MUST be indicated with `BREAKING CHANGE:` in the commit footer:

```
feat(api): redesign wardrobe item response

Restructured the wardrobe item response to include nested
category and image objects instead of flat fields.

BREAKING CHANGE: The wardrobe item response format has changed.
Old format: { category_id, category_name }
New format: { category: { id, name } }
Migration: Update all consumers to access item.category.id and item.category.name
```

### Alternative Syntax
```
feat(api)!: redesign wardrobe item response
```

### What Constitutes a Breaking Change
- API response format changes
- API request format changes
- Removing a function/endpoint
- Changing function signatures
- Changing database schema (non-additive)
- Changing environment variable requirements
- Upgrading to a new major version of a framework

### Breaking Change Checklist
- [ ] BREAKING CHANGE notation in commit message.
- [ ] Migration path documented.
- [ ] Old behavior deprecated (not immediately removed).
- [ ] ADR created (for significant breaking changes).
- [ ] CHANGELOG updated with migration notes.

---

## Commit Size Limits

### Maximum Limits
| Metric | Maximum |
|--------|---------|
| Files changed | 10 files per commit |
| Lines changed | 200 lines per commit |
| Total diff | +200 / -200 lines |

### Why Size Limits
- Small commits are easier to review.
- Small commits are easier to revert.
- Small commits are easier to understand.
- Small commits reduce merge conflicts.

### Exceptions
The following are NOT counted toward size limits:
- Lock file changes (`package-lock.json`)
- Generated files (Prisma client, compiled output)
- Renamed files (if content is unchanged)
- Test fixture data
- Migration files

### What to Do If Your Commit Exceeds Limits
1. Split the change into multiple logical commits.
2. Each commit should represent a single concern.
3. Use `git add -p` to stage changes selectively.
4. Create a series of commits that build on each other.

### Commit Organization Example
```
Commit 1: refactor(wardrobe): extract image processing logic
Commit 2: feat(wardrobe): add bulk image upload endpoint
Commit 3: feat(wardrobe): add bulk image upload UI
```

---

## Related Issue/Task Reference

### Requirement
Every commit MUST reference a related issue or task, EXCEPT for:
- Documentation only changes (`docs` scope)
- Formatting/style only changes (`style` scope)
- Trivial fixes (typos, comments)

### Reference Format

```
#123              — Issue number (GitHub issues)
TASK-456          — Task ID (task tracker)
PROJ-789          — Project management tool ID
```

### Keywords
Use these keywords to auto-close issues:

| Keyword | Action |
|---------|--------|
| `Closes #123` | Closes issue when merged to default branch |
| `Fixes #123` | Closes issue when merged to default branch |
| `Resolves #123` | Closes issue when merged to default branch |
| `Refs #123` | References issue (no auto-close) |
| `Related to #123` | References issue (no auto-close) |
| `Implements TASK-456` | References task (no auto-close) |

### Examples
```
feat(wardrobe): add image upload

Closes #123
```

```
fix(auth): handle token expiration

Fixes AUTH-789
```

---

## Co-Author Attribution Rules

### When to Add Co-Authors
Co-authors should be added when:
1. Pair programming was used.
2. Multiple people contributed to the commit.
3. Someone provided significant guidance or debugging help.

### Co-Author Format
```
Co-authored-by: Name <email@example.com>
```

### Example
```
feat(wardrobe): add drag-and-drop outfit builder

Implements drag-and-drop functionality for the outfit builder.

Co-authored-by: Jane Smith <jane.smith@example.com>
Co-authored-by: Bob Johnson <bob.johnson@example.com>
```

---

## Squash Rules

### When to Squash
Squashing is RECOMMENDED when:
1. Cleaning up a feature branch before merging.
2. Combining "work in progress" commits into a meaningful commit.
3. Removing commits that add and then remove code (noise).
4. Before merging a PR with many small commits.

### When NOT to Squash
Squashing is NOT recommended when:
1. Commits represent distinct, meaningful changes.
2. Commits were made by different authors.
3. Squashing would lose important context.
4. The branch has been reviewed commit-by-commit.

### Squash Merge Strategy
The project uses SQUASH MERGE as the default merge strategy for PRs. This means all commits in a PR are squashed into a single commit when merged to the target branch.

### Pre-Squash Cleanup
Before squashing:
1. Reword commits to have meaningful messages.
2. Reorder commits to make logical sense.
3. Fix up commits that contain only "fix review feedback".
4. Ensure the final squashed commit message follows the commit format.

---

## Revert Commit Format

### Revert Subject
```
revert(<scope>): <original subject>

This reverts commit <commit-hash>.
```

### Revert Example
```
revert(wardrobe): add bulk delete for wardrobe items

This reverts commit a1b2c3d4e5f6.

Reason: The bulk delete endpoint has a performance issue
with large batches (>1000 items). Reverting until the 
batching logic can be fixed.

Fixes #456 (reopens the issue)
```

### Revert Rules
1. **Use `git revert`**, not manual code changes.
2. **Explain why** the revert was needed in the body.
3. **Reopen any issues** that were closed by the original commit.
4. **Create a task** to re-approach the feature/fix properly.
5. **Do NOT revert a revert**: If a revert needs to be reversed, create a new commit.

---

## Prohibited Commit Practices

### NEVER Do These
1. **Commit secrets**: API keys, passwords, tokens, certificates.
2. **Commit large files**: > 10MB (binary files, datasets, models).
3. **Commit generated files**: `dist/`, `build/`, `.next/`, `__pycache__/`.
4. **Commit IDE files**: `.vscode/`, `.idea/`, `*.swp`.
5. **Commit OS files**: `.DS_Store`, `Thumbs.db`.
6. **Commented-out code**: Remove it, don't commit it.
7. **`git commit --no-verify`**: Never skip hooks.
8. **`git commit --amend` on pushed commits**: Rewrites history.
9. **Force push to shared branches**: `main`, `develop`, `staging`.
10. **Empty commit messages**: Every commit must have a meaningful message.

---

## Commit Checklist

Before every commit, verify:
- [ ] Commit message follows conventional commits format.
- [ ] Type is correct (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `ci`, `build`, `revert`).
- [ ] Scope is correct and descriptive.
- [ ] Subject is 72 characters or fewer.
- [ ] Body explains what and why (if non-obvious change).
- [ ] Breaking changes are noted with `BREAKING CHANGE:`.
- [ ] Related issue/task is referenced.
- [ ] Co-authors are attributed (if applicable).
- [ ] Commit is within size limits (max 10 files, max 200 lines).
- [ ] No secrets or sensitive data in the commit.
- [ ] No generated files in the commit.
- [ ] No large binary files in the commit.
- [ ] Tests pass (run relevant tests).
- [ ] Lint passes (run `npm run lint` or equivalent).
- [ ] Type check passes (run `npm run typecheck` or equivalent).

---

## Git Configuration

### Recommended Git Config
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
git config commit.template .gitmessage   # If project has a template
```

### Commit Template (if exists)
The project may have a `.gitmessage` file at the root with a commit template. If so, use it:
```
git config commit.template .gitmessage
```

---

## Commit Message Examples by Type

### feat
```
feat(wardrobe): add category filtering to wardrobe grid

Adds a dropdown filter that allows users to filter wardrobe
items by category (tops, bottoms, shoes, accessories).

Closes #234
```

### fix
```
fix(auth): clear session on logout

The session was not being cleared from the Zustand store
when the user logged out, causing protected routes to still
show authenticated content until page refresh.

Fixes #345
```

### chore
```
chore(deps): update typescript to 5.4.5

Updates TypeScript from 5.3.3 to 5.4.5 for the latest type
inference improvements. No breaking changes expected.
```

### refactor
```
refactor(api): extract image resizing into shared service

Moves image resizing logic from the wardrobe controller into
a reusable ImageProcessingService that can be used by other
modules.
```

### docs
```
docs(readme): add environment variables documentation

Documents all required environment variables with descriptions
and example values for local development setup.
```

### test
```
test(wardrobe): add unit tests for image upload validation

Adds tests covering file type validation, file size validation,
and duplicate file name handling for the image upload endpoint.
```

### perf
```
perf(wardrobe): optimize image loading with lazy loading

Implements IntersectionObserver-based lazy loading for wardrobe
grid images. Reduces initial page load by 40% (from 5MB to 3MB).
```

### ci
```
ci: add lint step to CI pipeline

Adds ESLint and Prettier checks to the CI pipeline to catch
formatting issues before code review.
```

### build
```
build: update Next.js config for image optimization

Configures Next.js image optimization for Supabase storage
domain to enable optimized image delivery.
```

### revert
```
revert(wardrobe): add bulk image upload

This reverts commit f1e2d3c4b5a6.

Reason: The bulk upload feature introduced a memory leak
when processing large batches. Reverting until the issue
is fixed.

Reopens #456
```
