# Dependency Rules

> Rules for adding, updating, removing, and auditing dependencies across all layers.

---

## Dependency Addition Workflow

### Step 1: Determine Necessity
Before adding ANY dependency, ask:
1. Can the problem be solved with existing dependencies?
2. Can the problem be solved with a small amount of custom code?
3. Is the dependency well-maintained? (Last commit < 6 months ago)
4. Is the dependency widely adopted? (GitHub stars, npm downloads, PyPI downloads)
5. Is the dependency's license compatible with our project?

If the answer to #1 or #2 is "yes", do NOT add the dependency.

### Step 2: Create Dependency Request
Create a file in `project-memory/tasks/dependency-requests/` with:

```markdown
## Dependency Request: [package-name]

### Package Information
- **Name**: [package-name]
- **Version**: [x.y.z]
- **Registry**: [npm | PyPI | Other]
- **URL**: [package URL]
- **License**: [MIT, Apache 2.0, GPL, etc.]

### Justification
[Why is this dependency needed? What problem does it solve?]

### Alternatives Considered
1. [Alternative 1] - [Why not chosen]
2. [Alternative 2] - [Why not chosen]
3. Custom implementation - [Why not feasible]

### Impact Assessment
- **Bundle size increase**: [KB/MB]
- **Number of transitive dependencies**: [count]
- **Security risk**: [Low/Medium/High]
- **Maintenance risk**: [Low/Medium/High]

### Requestor
[Agent type and name]

### Date
YYYY-MM-DD
```

### Step 3: Review Process

| Dependency Type | Review Required | Approval By |
|-----------------|-----------------|-------------|
| Dev dependency | Brief review | Tech lead |
| Frontend runtime dependency | Full review | Frontend lead + tech lead |
| Backend runtime dependency | Full review | Backend lead + tech lead |
| AI Python dependency | Full review | AI lead + tech lead |
| Native/System dependency | Full review + security | Tech lead + security |
| Build/Deploy tooling | Brief review | Infrastructure lead |

### Step 4: Install and Document
1. Install with exact version pinning.
2. Update `project-memory/core/architecture.md` if the dependency affects the architecture.
3. Update the relevant `package.json` or `requirements.txt`.
4. Run the full test suite to verify no breakage.
5. Create a PR with the dependency request attached.

---

## Dependency Version Pinning

### Rule
ALL dependencies MUST be pinned to exact versions (no ranges, no `^` or `~`).

### Why
Version ranges can introduce breaking changes unexpectedly when `npm install` or `pip install` is run at different times. Exact versions ensure deterministic builds.

### Frontend/Backend (npm)
```json
{
  "dependencies": {
    "next": "14.2.3",
    "react": "18.3.1",
    "zustand": "4.5.2"
  },
  "devDependencies": {
    "typescript": "5.4.5",
    "jest": "29.7.0"
  }
}
```

### AI (Python)
```
torch==2.3.0
torchvision==0.18.0
opencv-python==4.9.0.80
mediapipe==0.10.9
transformers==4.41.2
```

### Lock Files
- Frontend: `package-lock.json` (must be committed)
- Backend: `package-lock.json` (must be committed)
- AI: No lock file (pip freeze for deployment)

### Version Update Process
1. Update the version in `package.json` or `requirements.txt`.
2. Update the lock file.
3. Run full test suite.
4. Verify no breaking changes.
5. Update CHANGELOG.

---

## Dependency Audit Requirements

### Regular Audits

| Layer | Tool | Frequency |
|-------|------|-----------|
| Frontend | `npm audit` | Every PR |
| Backend | `npm audit` | Every PR |
| AI | `safety check` or `pip-audit` | Every PR |
| All | `npm audit` (root) | Every PR |
| All | Snyk or Dependabot | Weekly |
| All | Full manual audit | Monthly |

### Audit Process
1. Run the audit tool.
2. Review all vulnerabilities:
   - **CRITICAL**: Must be fixed immediately (within 24 hours).
   - **HIGH**: Must be fixed within 1 week.
   - **MEDIUM**: Must be fixed within 1 month.
   - **LOW**: Must be fixed within 3 months.
3. For each vulnerability:
   - Update the dependency if a fix is available.
   - If no fix is available, document the risk and create a monitoring task.
   - If the dependency is unused, remove it.

### Audit Reporting
After each audit, report:
- Total vulnerabilities by severity.
- Dependencies that were updated.
- Dependencies that were removed.
- Remaining risks (with justification).

---

## License Compatibility Checks

### Permitted Licenses
| License | Permitted? | Notes |
|---------|------------|-------|
| MIT | ✅ Permitted | No restrictions |
| Apache 2.0 | ✅ Permitted | Include notice |
| BSD (2/3-Clause) | ✅ Permitted | No restrictions |
| ISC | ✅ Permitted | No restrictions |
| Unlicense | ✅ Permitted | Public domain |
| LGPL | ✅ Permitted | If dynamically linked |
| MPL 2.0 | ✅ Permitted | File-level copyleft |

### Restricted Licenses
| License | Permitted? | Notes |
|---------|------------|-------|
| GPL 2.0 | ❌ Forbidden | Copyleft contaminates entire project |
| GPL 3.0 | ❌ Forbidden | Copyleft contaminates entire project |
| AGPL | ❌ Forbidden | Network copyleft |
| SSPL | ❌ Forbidden | MongoDB license, controversial |
| Commons Clause | ❌ Forbidden | Not open source |
| BUSL | ❌ Forbidden | Not open source |

### License Check Process
Before adding any dependency:
1. Check the license on the package registry (npm, PyPI).
2. Verify the license using a tool like `license-checker` (npm) or `pip-licenses` (Python).
3. Ensure the license is in the permitted list.
4. If the license is restricted, find an alternative.

---

## Bundle Size Impact Assessment

### For Frontend Dependencies
Every new frontend dependency must be assessed for bundle size impact:

1. **Check the size**: Use `bundlephobia.com` or `size-limit`.
2. **Check tree-shaking**: Ensure the package supports tree-shaking (ES module exports).
3. **Check alternatives**: Is there a smaller alternative?

### Size Budgets
| Category | Maximum Size |
|----------|-------------|
| Individual dependency | 50KB (minified + gzipped) |
| Total frontend bundle | 300KB (minified + gzipped) |
| Critical path bundle | 150KB (minified + gzipped) |

### Size Budget Violations
- If a dependency exceeds the individual budget, it must be approved by the frontend lead.
- If the total budget is exceeded, dependencies must be optimized or removed.
- Use dynamic imports for large dependencies that are not needed immediately.

---

## Security Vulnerability Check

### Automated Scanning
- **Dependabot**: Enabled on GitHub repository. Alerts for known vulnerabilities.
- **npm audit**: Run as part of CI. Fails if CRITICAL or HIGH vulnerabilities exist.
- **Snyk**: Weekly full scan of all dependencies.
- **Trivy**: Container image scanning for Docker dependencies.

### Response to Vulnerabilities

| Severity | Response Time | Action |
|----------|--------------|--------|
| CRITICAL | 24 hours | Update dependency or find alternative |
| HIGH | 1 week | Update dependency or document risk |
| MEDIUM | 1 month | Schedule update |
| LOW | 3 months | Schedule update |

### If a Fix Is Not Available
1. Document the vulnerability in `project-memory/decisions/security-accepted-risks.md`.
2. Include: CVE number, dependency, version, severity, impact, and monitoring plan.
3. Set up monitoring for a fix release.
4. Review accepted risks monthly.

---

## Peer Dependency Resolution

### Rule
All peer dependencies must be explicitly listed and compatible with the project's dependency versions.

### Frontend Example
If a package has a peer dependency on `react@18`, but the project uses `react@18.3.1`, this is compatible. If the project used `react@17`, it would be incompatible.

### Resolution Process
1. When adding a dependency, check its peer dependency requirements.
2. Ensure all peer dependencies are satisfied by the project's current dependencies.
3. If peer dependencies conflict with the project's versions:
   - Check if an alternative dependency exists with compatible peer deps.
   - If not, create a dependency request to update the conflicting dependency.
   - If the peer dep version is incompatible, do NOT add the dependency.

### Warning Signs
- `npm install` shows "unmet peer dependency" warnings.
- TypeScript compilation errors from incompatible type definitions.
- Runtime errors from incompatible package versions.

---

## Dev vs Production Dependency Rules

### Dev Dependencies
Dev dependencies are for development and testing only. They are NOT included in production builds.

#### Examples of Dev Dependencies
- Testing frameworks (Jest, pytest, React Testing Library)
- Linting tools (ESLint, Prettier, Flake8, Black)
- Type checking (TypeScript, mypy)
- Build tools (webpack, Babel, Vite)
- Development servers (nodemon, ts-node)
- Documentation generators

#### Dev Dependency Rules
- All dev dependencies must be in `devDependencies` (npm) or `dev-packages` (pip).
- Dev dependencies must NOT be imported in production code.
- Dev dependencies must NOT affect the production build.

### Production Dependencies
Production dependencies are included in the deployed application.

#### Examples of Production Dependencies
- Frameworks (React, Next.js, NestJS, PyTorch)
- UI libraries (Tailwind CSS, Radix UI)
- State management (Zustand, TanStack Query)
- Database drivers (Prisma Client, psycopg2)
- Runtime utilities (lodash, date-fns, numpy)

#### Production Dependency Rules
- All production dependencies must have security audits before addition.
- Production dependencies should be minimized (fewer deps = smaller attack surface).
- Production dependencies must be compatible with the project's license.
- Production dependencies should be well-maintained and widely adopted.

---

## Dependency Update Frequency

### Update Schedule

| Update Type | Frequency | Process |
|-------------|-----------|---------|
| Security patches | Immediately | `npm audit fix` or manual update |
| Patch updates (x.y.Z) | Monthly | Run tests, update, deploy |
| Minor updates (x.Y.z) | Quarterly | Review changelog, run tests, update |
| Major updates (X.y.z) | Per ADR | Full evaluation, ADR required |

### Automated Updates
- **Dependabot**: Configured for weekly pull requests.
- **Renovate**: If used, configured for weekly grouping.
- Manual review required for ALL automated PRs.

### Update Process
1. Read the changelog/release notes.
2. Identify breaking changes (for minor and major updates).
3. Update the version in `package.json`/`requirements.txt`.
4. Run the full test suite.
5. Fix any breaking changes (if minor).
6. Create a PR with the update.
7. For major updates, create an ADR.

---

## Dependency Removal Rules

### When to Remove a Dependency
1. **No longer used**: The dependency is no longer imported anywhere.
2. **Better alternative exists**: A better-maintained or smaller alternative is available.
3. **Security risk**: The dependency has unpatched vulnerabilities.
4. **License conflict**: The dependency's license is no longer compatible.
5. **Maintenance abandonment**: The dependency has not been updated in 2+ years.

### Removal Process
1. **Verify no usage**: Search for all imports of the dependency.
2. **Check transitive dependencies**: Other packages may depend on it.
3. **Update the package.json/requirements.txt**: Remove the dependency.
4. **Update the lock file**: Regenerate `package-lock.json` or `requirements.txt`.
5. **Run the full test suite**: Verify nothing is broken.
6. **Build the project**: Verify the build succeeds.
7. **Remove from documentation**: Update any docs referencing the dependency.

### What NOT to Remove
- Dependencies that are still in use (even if you don't like them).
- Dependencies that are transitive requirements of other dependencies.
- Dependencies that are required by the build/deploy pipeline.

---

## Dependency Management Tools

### Frontend (npm)
| Command | Purpose |
|---------|---------|
| `npm ls` | List installed dependencies |
| `npm audit` | Security audit |
| `npm outdated` | List outdated packages |
| `npm update` | Update packages (within range) |
| `npm ci` | Clean install from lock file |

### Backend (npm)
Same as frontend.

### AI (pip)
| Command | Purpose |
|---------|---------|
| `pip list` | List installed packages |
| `pip freeze` | Output installed packages in requirements format |
| `pip check` | Verify installed packages have compatible dependencies |
| `pip-audit` | Security audit |
| `pip install --upgrade` | Update a package |

### All Layers
| Tool | Purpose |
|------|---------|
| `npx synk test` | Full security audit |
| `license-checker` | License compliance check |
| `npx size-limit` | Bundle size analysis |

---

## Dependency Health Check

### Health Criteria
Before adding or keeping a dependency, evaluate:

| Criterion | Healthy | Concerning | Unhealthy |
|-----------|---------|------------|-----------|
| Last release | < 6 months | 6-12 months | > 12 months |
| GitHub stars | > 1000 | 100-1000 | < 100 |
| Open issues | < 100 | 100-500 | > 500 |
| Maintainers | > 3 | 1-3 | 0-1 |
| Weekly downloads (npm) | > 100K | 10K-100K | < 10K |
| Test coverage | > 80% | 50-80% | < 50% |
| TypeScript types | Included | DefinitelyTyped | None |

### Unhealthy Dependency Actions
- **Concerning**: Monitor; set up alert for > 12 months without release.
- **Unhealthy**: Create a task to find a replacement within 3 months.

---

## Dependency Documentation

### Required Documentation for Each Dependency

For every significant dependency, document in `project-memory/core/dependencies.md`:

```markdown
## Dependency Name
- **Version**: [current version]
- **Purpose**: [why we use it]
- **Layer**: [frontend | backend | AI | infra]
- **License**: [MIT, Apache 2.0, etc.]
- **Usage**: [where/how it's used]
- **Alternatives**: [other options considered]
- **Risk**: [low/medium/high]
- **Maintainer**: [company/community]
```

This file is updated when:
- A new dependency is added.
- An existing dependency is updated (major version).
- An existing dependency is removed.
