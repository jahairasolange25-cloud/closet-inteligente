# Workflows

> Deterministic workflows for common operations. Each workflow MUST be followed exactly — no skipping steps, no reordering steps.

---

## Workflow 1: Adding a New API Endpoint

### Preconditions
- [ ] Database schema is defined (if endpoint requires new tables/columns)
- [ ] API contract is documented (request/response shapes)
- [ ] Appropriate service exists or you have approval to create one
- [ ] No existing endpoint provides similar functionality

### Steps
1. **Define DTO** — Create request/response DTOs in `backend/src/modules/<module>/dto/`.
   - Use `class-validator` decorators for validation.
   - Document all fields with JSDoc.
2. **Create service method** — Add method to the appropriate service in `backend/src/modules/<module>/services/`.
   - Accept DTO, return typed response.
   - Handle errors with typed exceptions.
   - Include audit logging.
3. **Create controller endpoint** — Add endpoint to the appropriate controller.
   - Use `@UseGuards(AuthGuard)` for authentication.
   - Use HTTP method decorator (`@Get()`, `@Post()`, etc.).
   - Validate with `@Body()`, `@Param()`, `@Query()`.
4. **Define types** — Add TypeScript types in `frontend/src/types/` mirroring the API contract.
5. **Create service function** — Add function in `frontend/src/services/` to call the new endpoint.
   - Use TanStack Query hooks where applicable.
   - Handle loading, error, and success states.
6. **Create frontend hook** (if needed) — Create a custom hook wrapping the service function.
7. **Write unit tests** — Test service method with mocked repository.
8. **Write e2e tests** — Test full request-response cycle.
9. **Document endpoint** — Update API documentation.

### Validation Checkpoints
- [ ] DTO validation catches invalid input
- [ ] Auth guard rejects unauthenticated requests
- [ ] Service returns correct response shape
- [ ] Frontend service function types match backend response
- [ ] All tests pass
- [ ] Lint and type check pass

### Postconditions
- Endpoint is available at `/api/v1/<resource>/<action>`
- Documentation is updated
- Tests are in place

### Rollback Steps
1. Revert controller changes.
2. Revert service changes.
3. Revert DTO changes.
4. Do NOT revert frontend type/service changes (they are backward-compatible).
5. Re-run tests.

---

## Workflow 2: Adding a New Database Table

### Preconditions
- [ ] Schema design is reviewed by at least one backend specialist
- [ ] Table follows naming conventions (snake_case, plural)
- [ ] Foreign keys reference existing tables
- [ ] Indexes are planned for query patterns
- [ ] No existing table covers the same data

### Steps
1. **Update Prisma schema** — Add model definition to `backend/prisma/schema.prisma`.
   - Use proper types (String, Int, Float, Boolean, DateTime, Json, etc.)
   - Define relations (hasMany, belongsTo, many-to-many)
   - Add indexes for frequent query patterns
   - Add `@updatedAt` for tracking changes
2. **Create migration** — Run `npx prisma migrate dev --name <descriptive_name>`.
   - Review the generated migration SQL.
   - Ensure the migration is reversible.
3. **Create service** — Create or update service in `backend/src/modules/<module>/services/`.
   - Include CRUD operations (or subset as needed).
   - Include pagination support.
   - Include filtering support.
4. **Create controller** — Create or update controller with standard CRUD endpoints.
5. **Define TypeScript types** — Add types in `frontend/src/types/` matching the new table.
6. **Create frontend service** — Add API service functions in `frontend/src/services/`.
7. **Seed data** — Add seed data in `backend/prisma/seed.ts` if needed for development.
8. **Create tests** — Test repository, service, and controller layers.

### Validation Checkpoints
- [ ] Migration applies cleanly
- [ ] Migration is reversible (`prisma migrate down`)
- [ ] CRUD operations work through the API
- [ ] Frontend types match database schema
- [ ] All tests pass

### Postconditions
- New table exists in database
- Migration file is committed
- API endpoints are available
- Tests are in place

### Rollback Steps
1. Run migration down: `npx prisma migrate down`.
2. Revert Prisma schema changes.
3. Revert service and controller changes.
4. Data loss: if data was inserted, restore from backup.

---

## Workflow 3: Creating a New Frontend Page

### Preconditions
- [ ] Page design is approved (Figma/design docs)
- [ ] Route path is decided
- [ ] Required API endpoints exist or are planned
- [ ] No existing page covers the same route

### Steps
1. **Create page file** — Create file in `frontend/src/app/<route>/page.tsx`.
   - Use default export for the page component.
   - Add metadata with `generateMetadata` or `metadata` export.
2. **Create layout** (if needed) — Create `frontend/src/app/<route>/layout.tsx`.
3. **Create loading state** — Create `frontend/src/app/<route>/loading.tsx`.
4. **Create error state** — Create `frontend/src/app/<route>/error.tsx`.
5. **Create components** — Break the page into components in `frontend/src/components/<category>/`.
   - One component per file.
   - Use existing UI primitives where possible.
6. **Create hooks** — Create custom hooks for data fetching and state management.
7. **Create/update store** — Update Zustand store if the page introduces global state.
8. **Add types** — Add any new TypeScript types needed.
9. **Write tests** — Test components with React Testing Library.
   - Test loading state.
   - Test error state.
   - Test empty state.
   - Test happy path.
   - Test edge cases.
10. **Add navigation** — Update navigation components to include the new page.

### Validation Checkpoints
- [ ] Page renders at the expected URL
- [ ] Loading state displays while data is fetching
- [ ] Error state displays on failure with retry option
- [ ] Empty state displays when no data exists
- [ ] Keyboard navigation works
- [ ] Screen reader announces page content correctly
- [ ] Mobile responsive
- [ ] All tests pass

### Postconditions
- New page is accessible at `/path/to/page`
- Components are committed
- Tests are in place

### Rollback Steps
1. Revert page file creation.
2. Revert component creation.
3. Revert navigation updates.
4. Revert store changes (if any).

---

## Workflow 4: Adding a New AI Pipeline Step

### Preconditions
- [ ] Pipeline step is designed and documented
- [ ] Input/output schemas are defined
- [ ] Required models are available or training is planned
- [ ] Performance requirements are specified (max latency, throughput)
- [ ] No existing pipeline step covers the same functionality

### Steps
1. **Define schema** — Create input/output schemas in `python/services/schemas/`.
   - Use Pydantic models for validation.
2. **Create pipeline module** — Create `python/pipelines/<pipeline_name>/<step_name>.py`.
   - Implement the `PipelineStep` interface.
   - Include input validation.
   - Include error handling with typed exceptions.
   - Include logging of inference metadata.
3. **Create service endpoint** — Create or update `python/services/routers/` with new endpoint.
   - Accept input schema, return output schema.
4. **Create test** — Write tests in `python/tests/`.
   - Test with sample data.
   - Test edge cases.
   - Test error cases.
5. **Benchmark** — Run performance benchmark.
   - Measure latency.
   - Measure memory usage.
   - Verify within requirements.
6. **Create backend integration** — Add backend service method in `backend/src/modules/` to call new AI endpoint.
7. **Update documentation** — Document the pipeline step.

### Validation Checkpoints
- [ ] Input validation rejects invalid data
- [ ] Pipeline step produces expected output
- [ ] Error handling is robust
- [ ] Performance is within requirements (latency, memory)
- [ ] Backend can successfully call the new endpoint
- [ ] All tests pass

### Postconditions
- New pipeline step is available at `/api/v1/<pipeline>/<step>`
- Backend can call the new step
- Tests are in place

### Rollback Steps
1. Revert router changes.
2. Revert pipeline step creation.
3. Revert backend integration.
4. Do NOT revert schema changes (they don't affect existing functionality).

---

## Workflow 5: Creating a New WebSocket Event

### Preconditions
- [ ] Event contract is documented (event name, direction, payload)
- [ ] Event follows naming convention: `namespace:event:action`
- [ ] No existing event covers the same purpose

### Steps
1. **Document event** — Add event to `backend/src/common/websocket/events.md`.
   - Event name
   - Direction (client→server or server→client)
   - Payload schema (all fields with types)
2. **Define types** — Add TypeScript types in `frontend/src/types/websocket/`.
3. **Implement server handler** — Add handler in `backend/src/modules/<module>/<module>.gateway.ts`.
   - Use `@SubscribeMessage()` decorator.
   - Validate payload.
   - Handle errors.
   - Emit response events.
4. **Implement client handler** — Add listener in `frontend/src/hooks/useWebSocket.ts` or similar.
5. **Create frontend hook** — Create a custom hook for the event (e.g., `useWardrobeUpdates`).
6. **Write tests** — Test server handler and client handler.
7. **Update frontend documentation** if needed.

### Validation Checkpoints
- [ ] Server emits event with correct payload shape
- [ ] Client receives and processes event correctly
- [ ] Event is documented in events.md
- [ ] Types match between server and client
- [ ] All tests pass

### Postconditions
- WebSocket event is operational
- Documentation is updated
- Tests are in place

### Rollback Steps
1. Revert gateway changes.
2. Revert client handler changes.
3. Revert documentation changes.

---

## Workflow 6: Adding a New Notification Type

### Preconditions
- [ ] Notification design is approved (title, message, icon, action)
- [ ] Trigger conditions are defined
- [ ] Target audience is defined (user, role, specific users)
- [ ] No existing notification type covers the same purpose

### Steps
1. **Define notification type** — Add type to `frontend/src/types/notifications.ts`.
   - Add to the notification type union.
   - Define payload shape.
2. **Create notification component** — Create component in `frontend/src/components/notifications/`.
   - Handle the specific notification type rendering.
   - Include icon, title, message, action button.
3. **Create backend notification service** — Add method in `backend/src/modules/notifications/services/`.
   - Create notification in database.
   - Emit WebSocket event for real-time delivery.
   - Handle push notification if applicable.
4. **Add trigger** — Add trigger logic where the notification condition is met.
   - In the relevant service or controller.
5. **Write tests** — Test notification creation, delivery, and rendering.
6. **Update notification preferences** — Ensure users can opt in/out of the new type.

### Validation Checkpoints
- [ ] Notification renders correctly in the UI
- [ ] Notification is delivered in real-time via WebSocket
- [ ] Notification is persisted in the database
- [ ] User can view notification history
- [ ] User can opt out of the notification type
- [ ] All tests pass

### Postconditions
- Notification type is operational
- Users receive notifications
- Tests are in place

### Rollback Steps
1. Revert trigger logic.
2. Revert notification service changes.
3. Revert frontend component changes.
4. Do NOT revert database schema changes (types are additive).

---

## Workflow 7: Implementing a New Filter/Search

### Preconditions
- [ ] Filter/search requirements are defined (fields, operators, behavior)
- [ ] Performance requirements are defined (max response time)
- [ ] Existing query patterns don't already cover the need

### Steps
1. **Design query** — Design the database query in `backend/prisma/schema.prisma` (add indexes if needed).
2. **Create migration** — If indexes are needed, create migration.
3. **Add backend filter logic** — Add filtering to `backend/src/modules/<module>/services/`.
   - Use Prisma filtering capabilities.
   - Support pagination.
   - Support sorting.
   - Support field selection.
4. **Create DTO** — Create filter DTO with validation.
5. **Create frontend filter types** — Add TypeScript types for the filter.
6. **Create frontend filter UI** — Create filter component.
   - Include filter form.
   - Include search input.
   - Include clear filters button.
   - Include results count.
7. **Create frontend search hook** — Create hook that manages filter state and API calls.
   - Debounce search input.
   - Reset pagination on filter change.
8. **Write tests** — Test backend filtering (unit + e2e) and frontend filtering.
9. **Add to navigation/UI** — Integrate the filter into the appropriate page.

### Validation Checkpoints
- [ ] Filter returns correct results
- [ ] Filter performs within response time requirements
- [ ] Empty results have proper messaging
- [ ] Filter state is preserved on page navigation
- [ ] Clear filters resets to default state
- [ ] URL reflects filter state (for shareable URLs)
- [ ] All tests pass

### Postconditions
- Filter/search is functional
- Performance is acceptable
- Tests are in place

### Rollback Steps
1. Revert frontend filter UI changes.
2. Revert hook changes.
3. Revert backend filter logic.
4. Do NOT revert migration (indexes are beneficial even without the filter).

---

## Workflow 8: Adding a New 3D Scene Element

### Preconditions
- [ ] 3D model is created/obtained and optimized
- [ ] Scene requirements are defined (position, scale, rotation, interaction)
- [ ] Performance budget is defined (poly count, draw calls, texture size)
- [ ] No existing scene element covers the same purpose

### Steps
1. **Prepare 3D assets** — Add models/textures to `frontend/public/models/` or `frontend/public/textures/`.
   - Optimize models (glTF/glb format, Draco compression).
   - Optimize textures (WebP, appropriate resolution).
2. **Create 3D component** — Create component in `frontend/src/components/3d/`.
   - Use React Three Fiber primitives (mesh, group, etc.).
   - Load GLTF with `useGLTF` or `useLoader`.
   - Handle loading state.
   - Handle error state.
3. **Add animations** (if needed) — Use `useFrame` or `useSpring` for animations.
4. **Add interactions** — Add click, hover, drag interactions.
   - Use `@react-three/drei` helpers where applicable.
   - Raycasting for click/hover detection.
5. **Optimize performance** — Ensure within budget.
   - Use `useMemo` for geometries.
   - Use instancing for repeated objects.
   - Reduce shadow maps if expensive.
   - Use LOD if needed.
6. **Write tests** — Test rendering (basic render test).
7. **Integrate into scene** — Add the component to the parent scene.

### Validation Checkpoints
- [ ] Model renders correctly
- [ ] Textures load and display correctly
- [ ] Animations play correctly
- [ ] Interactions work (click, hover, drag)
- [ ] Performance is within budget (FPS, draw calls, memory)
- [ ] Loading state displays before model loads
- [ ] Error state displays on load failure
- [ ] All tests pass

### Postconditions
- 3D element is visible in the scene
- Interactions are functional
- Performance is acceptable

### Rollback Steps
1. Revert scene integration.
2. Revert component creation.
3. Revert asset addition (models/textures). Clean up unused assets.

---

## Workflow 9: Deploying a New Version

### Preconditions
- [ ] All tests pass (frontend, backend, AI)
- [ ] Lint and type check pass
- [ ] Build succeeds for all layers
- [ ] All PRs are merged to `main`/`master`
- [ ] No blocking issues or known regressions
- [ ] Version number is updated (semver: MAJOR.MINOR.PATCH)
- [ ] CHANGELOG.md is updated
- [ ] Deploy approval is obtained (if production)

### Steps
1. **Create release branch** — `release/v<major>.<minor>.<patch>` from `main`.
2. **Run full test suite** — All tests in CI.
3. **Run build** — Build all layers in CI.
4. **Deploy to staging** — Deploy to staging environment.
5. **Run smoke tests** — Verify critical flows in staging.
6. **Run E2E tests** — Full E2E test suite against staging.
7. **Deploy to production** — Deploy to production environment.
8. **Monitor** — Watch logs, metrics, and error tracking for 30 minutes.
9. **Tag release** — `git tag v<major>.<minor>.<patch>`.

### Validation Checkpoints
- [ ] Staging deployment succeeds
- [ ] Smoke tests pass on staging
- [ ] E2E tests pass on staging
- [ ] Production deployment succeeds
- [ ] Health checks pass on production
- [ ] Error rate is normal
- [ ] Response times are normal

### Postconditions
- New version is live on production
- Git tag is pushed
- Release notes are published

### Rollback Steps
1. Revert deployment to previous version.
   - Vercel: Rollback via Vercel dashboard.
   - Railway: Rollback via Railway dashboard.
   - Docker: Deploy previous image tag.
2. Verify rollback is successful.
3. Mark release as failed in documentation.
4. Create task to fix issues before next deployment.

---

## Workflow 10: Handling a Bug Fix

### Preconditions
- [ ] Bug is reported (via task, issue, or direct report)
- [ ] Bug is categorized (CRITICAL, HIGH, MEDIUM, LOW)
- [ ] Bug is reproduced (if possible, with exact steps)
- [ ] Priority is determined

### Steps
1. **Reproduce bug** — Confirm the bug exists.
   - Document exact reproduction steps.
   - Document environment details (browser, OS, version).
2. **Diagnose root cause** — Find the root cause.
   - Add logging if needed for diagnosis.
   - Check error logs.
   - Check recent changes (git log, related commits).
3. **Write a failing test** — Write a test that reproduces the bug.
   - This test will pass once the bug is fixed.
4. **Fix the bug** — Make the minimum change necessary.
   - Do NOT refactor.
   - Do NOT improve unrelated code.
   - Do NOT change behavior beyond the bug fix.
5. **Verify fix** — Run the failing test + all related tests.
6. **Add regression test** — Ensure the bug cannot reappear.
7. **Run full test suite** — Ensure no regressions.
8. **Document** — Add notes to the bug report.
   - Root cause.
   - Fix approach.
   - Verification results.
9. **Create PR** — Follow PR rules.

### Validation Checkpoints
- [ ] Bug is no longer reproducible
- [ ] Failing test now passes
- [ ] Regression test is in place
- [ ] All related tests pass
- [ ] Full test suite passes
- [ ] No new bugs introduced

### Postconditions
- Bug is fixed
- Regression test is in place
- PR is merged

### Rollback Steps
1. Revert the bug fix commit(s).
2. Verify bug returns (confirms rollback worked).
3. Create task to re-approach the fix.
4. If rollback is needed for a production fix, deploy the previous version.

---

## Workflow 11: Creating a New ADR

### Preconditions
- [ ] A decision point has been reached that requires an ADR
- [ ] All options have been researched
- [ ] Stakeholders have been consulted

### Steps
1. **Copy template** — Use the ADR template from `project-memory/adr/template.md`.
2. **Set ADR number** — Next sequential number.
3. **Fill in metadata** — Date, status, deciders, consulted.
4. **State the context** — Why is this decision needed? What constraints exist?
5. **Describe the decision** — What was decided? Be specific.
6. **List options considered** — At least 2-3 alternatives with pros/cons.
7. **Document consequences** — What will change? What trade-offs exist?
8. **Save file** — Save as `project-memory/adr/adr-YYYYMMDD-brief-description.md`.
9. **Submit for review** — Open PR with ADR.
10. **Revise if needed** — Address feedback.
11. **Merge** — ADR is accepted and becomes part of project memory.

### Validation Checkpoints
- [ ] ADR number is sequential (no gaps)
- [ ] All sections are filled
- [ ] Consequences are documented
- [ ] Alternatives are listed
- [ ] Stakeholders have reviewed

### Postconditions
- ADR is accepted
- Project memory is updated

---

## Workflow 12: Adding a New Dependency

### Preconditions
- [ ] Existing project technologies cannot solve the problem
- [ ] Dependency review is initiated

### Steps
1. **Create dependency request** in `project-memory/tasks/dependency-requests/`.
2. **Evaluate the dependency**:
   - Security audit.
   - License compatibility.
   - Bundle size impact.
   - Maintenance status.
   - Community adoption.
3. **Get approval** — Architecture board or tech lead.
4. **Install dependency** with exact version pinning.
5. **Update documentation** — Add to tech stack documentation.
6. **Update CI/CD** — Ensure dependency scanning includes the new dependency.
7. **Write tests** — If the dependency wraps core functionality, test the integration.

### Validation Checkpoints
- [ ] Dependency is approved
- [ ] Security scan passes
- [ ] License is compatible (MIT, Apache 2.0, BSD)
- [ ] Bundle size impact is documented
- [ ] All tests pass

### Postconditions
- Dependency is installed
- Documentation is updated
- CI/CD scanning is updated

---

## Workflow 13: Code Review

### Preconditions
- [ ] PR is created following PR rules
- [ ] All automated checks pass
- [ ] PR is assigned to reviewer

### Steps
1. **Review checklist** — Follow checklist in `review-rules.md`.
2. **Read through changed files** — Understand the change.
3. **Verify functionality** — Check for correctness.
4. **Check standards** — Verify coding standards, naming conventions, architecture rules.
5. **Check tests** — Verify test coverage and correctness.
6. **Check security** — Review for security issues.
7. **Leave feedback** — Be constructive, specific, and kind.
8. **Approve or request changes**.
9. **Follow up** — Check that feedback is addressed.

### Validation Checkpoints
- [ ] All checklist items pass
- [ ] No security issues
- [ ] Tests are adequate
- [ ] Documentation is updated

### Postconditions
- PR is approved or has actionable feedback
- Review is documented

---

## Rollback Procedures — General

### Always Do
1. **Identify the exact change to revert** (commit hash, PR number).
2. **Create a revert branch** from `main`.
3. **Revert the commit(s)**: `git revert <hash>`.
4. **Test the revert**: run tests.
5. **Create a PR** with the revert.
6. **Document the revert reason** in the PR description.

### Never Do
- Force push to main.
- Delete git history.
- Revert a revert (creates infinite loops).
- Cherry-pick without understanding the full change.

### Post-Rollback
- Create a task to investigate why the original change failed.
- Update relevant ADRs if the decision has changed.
- Notify the team.
