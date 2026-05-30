# Documentation Rules

> Rules for when and how documentation is created, updated, and maintained.

---

## When Documentation Is Required

### Mandatory Documentation Events
Documentation MUST be created or updated in the following situations:

1. **New feature**: Any new feature, page, component, API endpoint, or AI pipeline.
2. **API change**: Any modification to an existing API contract (request/response shape).
3. **Database change**: Any schema modification, new table, or migration.
4. **Architecture change**: Any modification to the system architecture, module boundaries, or data flow.
5. **Dependency change**: Adding, removing, or updating dependencies.
6. **Configuration change**: Modifying build, deployment, or CI/CD configuration.
7. **Bug fix**: Only for non-obvious bugs (root cause documentation).
8. **Refactoring**: Only for significant structural changes.
9. **Process change**: Modifying workflows, standards, or governance.
10. **Project setup**: Initial project setup for new developers/environments.

### Optional Documentation Events
Documentation SHOULD be created or updated in the following situations:
1. **Learning**: When you learn something non-obvious about the codebase.
2. **Decision**: When you make a decision that future developers should know about.
3. **Gotcha**: When you encounter a tricky bug or workaround.

---

## Documentation Format

### All documentation MUST use Markdown (`.md`)

### Markdown Style Guide
- Use `#` for top-level headings, `##` for second-level, etc.
- Use `-` for unordered lists.
- Use `1.` for ordered lists.
- Use inline code `` `code` `` for variable/function names.
- Use fenced code blocks with language identifier for code examples.
- Use `**bold**` for emphasis, `*italic*` for secondary emphasis.
- Use `[text](url)` for links.
- Use `> quote` for blockquotes.
- Use `---` for horizontal rules (section breaks).
- Use `[ ]` and `[x]` for checklists.

### Code Blocks
````markdown
```typescript
// TypeScript example
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```
````

### Linking Between Documents
- Use relative paths: `[Architecture](../core/architecture.md)`
- Use anchor references: `[Testing Standards](#testing-standards)`
- Do NOT use absolute paths or URLs for internal documents.

---

## Documentation Location Conventions

### Directory Structure
```
project-memory/
├── core/                          # Core project documentation
│   ├── architecture.md            # System architecture
│   ├── coding-standards.md        # Coding standards
│   ├── naming-conventions.md      # Naming conventions
│   ├── store-design.md            # State management design
│   └── database-schema.md         # Database schema overview
├── adr/                           # Architecture Decision Records
│   ├── adr-template.md            # ADR template
│   ├── adr-20240501-auth-strategy.md
│   └── ...
├── agent-control/                 # Agent governance (THIS DIRECTORY)
│   └── ...
├── tasks/                         # Task tracking
│   └── ...
└── decisions/                     # Historical decisions (non-ADR)
    └── ...
```

### Code-Level Documentation
- **JSDoc/TSDoc**: Attached to exported functions, classes, interfaces, types.
- **README files**: One per major directory explaining its purpose.
- **Inline comments**: For non-obvious logic only (not for obvious code).

---

## API Documentation Requirements

### JSDoc/TSDoc for All Public APIs

Every exported function, class, interface, and type MUST have JSDoc/TSDoc:

```typescript
/**
 * Fetches wardrobe items for a user with optional filtering and pagination.
 *
 * @param userId - The unique identifier of the user.
 * @param options - Filtering and pagination options.
 * @param options.category - Filter by clothing category (optional).
 * @param options.page - Page number for pagination (default: 1).
 * @param options.pageSize - Items per page (default: 20, max: 100).
 * @returns A promise resolving to a paginated list of wardrobe items.
 * @throws {NotFoundError} If the user does not exist.
 * @throws {ValidationError} If the input parameters are invalid.
 *
 * @example
 * const items = await getWardrobeItems('user-123', {
 *   category: 'top',
 *   page: 1,
 *   pageSize: 10,
 * });
 */
export async function getWardrobeItems(
  userId: string,
  options?: WardrobeQueryOptions
): Promise<PaginatedResult<WardrobeItem>> {
  // ...
}
```

### Required JSDoc Elements
| Element | Required For | Description |
|---------|-------------|-------------|
| `@param` | All parameters | Name and description |
| `@returns` | All functions | Return type and description |
| `@throws` | Functions that throw | Conditions that cause errors |
| `@example` | Complex functions | Usage example |
| `@deprecated` | Deprecated APIs | Replacement guidance |
| `@see` | Related functions | Cross-reference |

### REST API Documentation
API endpoints are documented via JSDoc on controller methods and in the API documentation file:
```
backend/src/common/api-documentation.md
```

### WebSocket Event Documentation
All WebSocket events are documented in:
```
backend/src/common/websocket/events.md
```

---

## README Update Requirements

### When to Update the README
1. **Setup changes**: Modified installation steps, requirements, or environment setup.
2. **New commands**: Added npm/pip scripts or Makefile targets.
3. **Environment variables**: Added, removed, or renamed environment variables.
4. **Architecture changes**: Modified project structure or system design.
5. **Technology changes**: Added or removed technologies from the stack.
6. **Contribution changes**: Modified how to contribute or the PR process.

### README Sections
```
# Project Name
Brief description of the project.

## Tech Stack
List of technologies and versions.

## Prerequisites
Required software and versions.

## Getting Started
Installation and setup steps.

## Project Structure
Overview of the directory structure.

## Available Scripts
Common commands for development.

## Environment Variables
List of required environment variables.

## Architecture
Brief overview of the system architecture.

## Contributing
Link to contributing guide.

## License
License information.
```

### README Template
The project's README must follow the template in `project-memory/core/readme-template.md`.

---

## CHANGELOG Update Requirements

### Format
The CHANGELOG follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [Unreleased]

### Added
- New feature X for wardrobe management
- API endpoint for batch item deletion

### Changed
- Improved search performance by adding database indexes
- Updated Prisma schema for user settings

### Fixed
- Bug where outfit builder crashed on empty wardrobe
- Memory leak in 3D rendering component

### Deprecated
- Legacy item upload endpoint (will be removed in v2.0)

### Removed
- Deprecated `GET /api/v1/items/legacy` endpoint

### Security
- Fixed XSS vulnerability in item description
- Updated dependencies with security patches
```

### When to Update
- **Added**: New features, endpoints, components, or capabilities.
- **Changed**: Changes to existing functionality (breaking or non-breaking).
- **Fixed**: Bug fixes.
- **Deprecated**: Features that will be removed in future versions.
- **Removed**: Features that were previously deprecated.
- **Security**: Security fixes and vulnerability patches.

### Versioning
- Follow semver: `MAJOR.MINOR.PATCH`
- Breaking changes = MAJOR version bump
- New features = MINOR version bump
- Bug fixes = PATCH version bump

---

## ADR Creation Requirements

### When to Create an ADR

An ADR is REQUIRED when:
1. **Architecture decision**: Choosing between architectural approaches.
2. **Technology choice**: Adding or replacing a technology in the stack.
3. **Design pattern**: Introducing a new design pattern or paradigm.
4. **Process change**: Changing development workflows or governance.
5. **Significant refactoring**: Refactoring that spans > 10 files.
6. **API versioning**: Changing API versioning strategy.
7. **Database technology**: Changing database or ORM.
8. **Deployment platform**: Changing deployment or hosting.

### ADR Template
```markdown
# ADR-XXXX: Title

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Date
YYYY-MM-DD

## Deciders
[List of people involved in the decision]

## Context
[Describe the problem, constraints, and forces at play]

## Decision
[Describe the decision that was made. Be specific.]

## Options Considered
### Option 1: [Name]
- **Pros**: [List]
- **Cons**: [List]

### Option 2: [Name]
- **Pros**: [List]
- **Cons**: [List]

### Option 3: [Name]
- **Pros**: [List]
- **Cons**: [List]

## Consequences
[Describe the positive and negative consequences of this decision]

## Compliance
[How will compliance with this decision be verified?]

## Notes
[Any additional notes, references, or follow-up tasks]
```

### ADR Lifecycle
1. **Proposed**: Initial draft, under review.
2. **Accepted**: Decision is made and adopted.
3. **Deprecated**: No longer recommended but still in use.
4. **Superseded**: Replaced by a newer ADR (referenced in the text).

---

## Architecture Documentation Sync Requirements

### When to Sync Architecture Documentation
Architecture documentation (primarily `project-memory/core/architecture.md`) must be updated when:
1. Module boundaries change.
2. Data flow changes.
3. New services or layers are added.
4. Deployment architecture changes.
5. Communication protocols change.
6. Security architecture changes.

### Sync Process
1. Update the architecture document to reflect the change.
2. Update any related diagrams (in `project-memory/core/diagrams/`).
3. Update ADR if the change required an ADR.
4. Verify consistency: Check that all references to the changed architecture are updated.
5. Notify the team of the architecture change.

### Consistency Check
After making an architecture change, verify that these documents are still accurate:
- `project-memory/core/architecture.md`
- `project-memory/core/database-schema.md`
- `project-memory/core/naming-conventions.md`
- `project-memory/adr/*.md`
- `project-memory/agent-control/architecture-protection-rules.md`
- `README.md`
- Any module-level README files

---

## Outdated Documentation Handling

### Detecting Outdated Documentation

Signs of outdated documentation:
1. **Code-doc mismatch**: Code does something different from what the docs describe.
2. **Missing files**: Documentation references files or directories that no longer exist.
3. **Stale ADRs**: ADR status is not updated (e.g., should be "Deprecated" but is "Accepted").
4. **Broken links**: Internal or external links that return 404.
5. **Incorrect versions**: Version numbers that don't match the actual versions used.
6. **Orphaned docs**: Documentation for features that no longer exist.

### Handling Outdated Documentation

#### For Small Inconsistencies (1-2 sentences, 1-2 files)
- Update the documentation directly in the same PR/commit as the code change.
- Note in the PR description that documentation was updated.

#### For Major Outdated Documentation (> 2 files)
1. Create a task: `project-memory/tasks/YYYYMMDD_HHMMSS_update-documentation.md`.
2. Mark the documentation as outdated with a banner:
   ```markdown
   > **NOTE**: This document may be outdated. Last verified: YYYY-MM-DD.
   > See task #1234 for the planned update.
   ```
3. Prioritize the documentation update task.

#### For Critical Outdated Documentation (causing confusion or errors)
1. Immediately flag the documentation as outdated.
2. Add a warning banner at the top of the document.
3. Create a HIGH priority task to fix it within 24 hours.
4. Notify the team.

### Preventing Outdated Documentation

1. **Documentation check is part of code review**: Reviewers verify doc updates.
2. **"Documentation" is a required PR section**: Every PR has a documentation section.
3. **Automated checks**: CI checks for broken links in documentation.

---

## Documentation Review Process

### Pre-Merge Documentation Review
Every PR must include a documentation review:
1. Has the README been updated if needed?
2. Has the CHANGELOG been updated?
3. Have JSDoc/TSDoc comments been added/updated for new/modified code?
4. Have ADRs been created if needed?
5. Has architecture documentation been synced?
6. Are there any dead/broken links in the documentation?

### Documentation Review Checklist
- [ ] All exported symbols have JSDoc/TSDoc.
- [ ] README is accurate and up to date.
- [ ] CHANGELOG has an [Unreleased] section with the change noted.
- [ ] ADR is created if the change is architecturally significant.
- [ ] Architecture documentation is updated if architecture changed.
- [ ] No broken links in any documentation.
- [ ] Naming conventions document is accurate.

### Documentation Review Turnaround
| Type | Target | Maximum |
|------|--------|---------|
| JSDoc/TSDoc in PR | Part of code review | 24 hours |
| README update | Part of code review | 24 hours |
| CHANGELOG update | Part of code review | 24 hours |
| ADR creation | 1 week | 2 weeks |
| Architecture documentation | 1 week | 2 weeks |
| Full documentation audit | Quarterly | — |

---

## Documentation Quality Standards

### Mandatory Requirements
- [ ] No spelling or grammatical errors.
- [ ] Code examples are correct and runnable.
- [ ] All links resolve to valid targets.
- [ ] Consistent terminology with the rest of the project.
- [ ] No placeholder text, TODO, or Lorem Ipsum.
- [ ] Version numbers are accurate.

### Style Requirements
- Use active voice ("The function returns...") over passive voice ("It is returned by...").
- Use present tense ("The API returns...") over future tense ("The API will return...").
- Use second person ("You can configure...") for instructions.
- Use imperative mood for headings ("How to Configure" not "Configuring").
- Keep paragraphs short (3-5 sentences max).
- Use lists for steps, options, and enumerations.

---

## Documentation Ownership

| Document | Owner | Review Frequency |
|----------|-------|-----------------|
| `project-memory/core/architecture.md` | Architecture board | Quarterly |
| `project-memory/core/coding-standards.md` | Tech lead | Quarterly |
| `project-memory/core/naming-conventions.md` | Tech lead | Quarterly |
| `project-memory/core/store-design.md` | Frontend lead | Per store change |
| `project-memory/core/database-schema.md` | Backend lead | Per migration |
| `project-memory/adr/*.md` | Architecture board | Per decision |
| `project-memory/agent-control/*.md` | Architecture board | Quarterly |
| `README.md` | Project lead | Per release |
| `CHANGELOG.md` | Project lead | Per release |
| Module-level README files | Module owner | Per module change |
| API documentation | Backend lead | Per API change |
| WebSocket events documentation | Backend lead | Per event change |
