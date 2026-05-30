# Documentation Task Template

## TASK_ID: `DOCS-<TASK_ID>`

> **Title**: <TITLE>
>
> **Objective**: <OBJECTIVE — one clear sentence describing the documentation deliverable>

---

## CONTEXT FILES

```
# Example:
project-memory/architecture.md
project-memory/api-reference.md
project-memory/glossary.md
docs/backend/wardrobe-module.md
docs/frontend/components.md
docs/ai/pipeline-overview.md
README.md
```

**Guidance**: Include all documentation files that need to be read for context (existing docs to update, related docs that may need cross-references). Also include source code files that the docs will describe.

---

## ALLOWED FILES

```
project-memory/
docs/
README.md
CONTRIBUTING.md
```

---

## FORBIDDEN FILES

```
src/
ai/
prisma/
```

**Guidance**: Documentation tasks should never modify source code. If code changes are discovered to be needed during documentation, that must be a separate task.

---

## REQUIREMENTS

```
- [ ] Document the wardrobe module's public API surface (all exposed endpoints)
- [ ] For each endpoint: path, method, auth requirements, request body shape, response shape, error codes
- [ ] Include at least one curl example per endpoint
- [ ] Document the Zustand store shape and available actions
- [ ] Document the AI pipeline DAG — each step, its inputs/outputs, and ordering
- [ ] Use consistent formatting: markdown with fenced code blocks for JSON/curl examples
- [ ] All cross-references must use relative links (e.g. `../architecture.md#data-flow`)
```

**Guidance**:
- Use ADRs for decisions, architecture docs for system structure, API docs for contracts, README for project-level overview. Don't mix concerns.
- Every public API endpoint must be documented. Internal/private helpers can be omitted unless they are complex.
- Keep examples runnable — test curl commands before committing them.
- Use diagrams sparingly; when needed, use Mermaid (the project supports it). One diagram per concept, maximum.

---

## ACCEPTANCE CRITERIA

```
GIVEN a developer reads the wardrobe module docs
WHEN they follow a curl example
THEN the command works against a running dev server
AND the response matches the documented shape

GIVEN a developer reads the Zustand store docs
WHEN they look for a specific action
THEN the action name, signature, and side effects are documented
AND the store slice name is clearly indicated

GIVEN a developer reads the AI pipeline docs
WHEN they look at the pipeline DAG
THEN each step lists its file location, config key, and input/output types
AND error handling behaviour is documented per step
```

---

## EDGE CASES

```
- [ ] Endpoint returns 403 for unauthorized → documented with example response
- [ ] Endpoint returns empty array → documented (it's not an error)
- [ ] Rate limit headers → documented if applicable
- [ ] Deprecated endpoints → clearly marked with "DEPRECATED" and migration path
```

---

## FILES TO UPDATE

```
project-memory/api-reference.md          — add wardrobe endpoints section
project-memory/glossary.md               — add "Wardrobe" and "Outfit" terms (if missing)
docs/backend/wardrobe-module.md          — full rewrite (existing doc is outdated)
```

**Guidance**: List every file that will be created or modified. For each, note what will change (e.g., "add section", "full rewrite", "fix cross-reference").

---

## SYNC REQUIREMENTS

```
After merging this doc change, the following must be updated in sync:

- [ ] `docs/frontend/components.md` — update OutfitCard prop types reference
- [ ] `README.md` — update "Modules" table to link to new wardrobe docs
- [ ] `project-memory/architecture.md` — verify data flow diagram still matches
```

**Guidance**: Documentation is never standalone. Every doc change creates downstream sync requirements. List them explicitly so they aren't forgotten. If a doc change requires code changes (e.g., adding JSDoc to source), list that here too.

---

## TESTS REQUIRED

```
# Documentation validation — no unit tests, but these checks apply:
- [ ] `npx markdownlint-cli project-memory/ docs/` passes
- [ ] All internal links resolve (check with `npx broken-link-checker`)
- [ ] README table of contents matches actual sections
```

**Guidance**: Documentation testing means linting markdown, verifying links, and validating code examples. Never file a doc task without a lint and link-check step.

---

## EXPECTED OUTPUT

```
FILES MODIFIED:
  - project-memory/api-reference.md           (+45 lines)
  - project-memory/glossary.md                (+3 lines)
  - README.md                                 (+2 lines)

FILES CREATED:
  - docs/backend/wardrobe-module.md

Markdown lint passes: markdownlint-cli exits 0
All internal links resolve.
```

---

## Example: Well-Formed Documentation Task

```
TASK_ID: DOCS-0007
TITLE: Document the outfit generation AI pipeline
OBJECTIVE: Write a comprehensive pipeline overview doc covering all steps from image input to outfit output.

CONTEXT FILES:
  ai/pipelines/outfit_generator/pipeline.py
  ai/pipelines/outfit_generator/config.yaml
  ai/pipelines/outfit_generator/schemas.py
  ai/pipelines/outfit_generator/steps/
  project-memory/architecture.md
  project-memory/glossary.md

ALLOWED FILES:
  docs/ai/
  project-memory/

FORBIDDEN FILES:
  ai/
  src/

REQUIREMENTS:
  - [ ] Document the pipeline DAG: input → detect_items → classify_textures → color_compatibility → generate_outfit → output
  - [ ] For each step: file path, config key, input schema, output schema, error behaviour
  - [ ] Include a Mermaid flowchart of the pipeline
  - [ ] Document config values in config.yaml with their defaults and valid ranges
  - [ ] Document how errors propagate (ImageDecodeError, ModelLoadError, etc.)
  - [ ] Document how to add a new pipeline step
  - [ ] Link to glossary for "pHash", "IoU", "NMS", etc.

FILES TO UPDATE:
  - docs/ai/pipeline-overview.md (new)
  - project-memory/glossary.md (add missing terms)
  - project-memory/architecture.md (cross-reference)

SYNC REQUIREMENTS:
  - [ ] Add link to pipeline docs in README "AI" section
  - [ ] Verify API docs reference the correct step names

EXPECTED OUTPUT:
  FILES CREATED:
    - docs/ai/pipeline-overview.md
  FILES MODIFIED:
    - project-memory/glossary.md
    - project-memory/architecture.md
    - README.md
  Markdown lint passes, all links resolve.
```
