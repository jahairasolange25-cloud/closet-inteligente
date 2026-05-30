# Debugging Rules

> Rules and procedures for debugging issues in the Closet Inteligente Digital platform.

---

## Debugging Workflow

### Step 1: Reproduce the Issue
Before any debugging begins, the issue must be reproducible.

- [ ] Document the exact steps to reproduce.
- [ ] Document the expected behavior.
- [ ] Document the actual behavior.
- [ ] Document the environment (browser, OS, app version, user account).
- [ ] Capture screenshots or screen recordings (if UI issue).
- [ ] Capture network logs (if API issue).
- [ ] Capture error messages and stack traces.

If the issue cannot be reproduced consistently:
- Document the frequency (e.g., "happens 1 out of 10 times").
- Document any patterns (e.g., "only happens after 3PM", "only on mobile").
- Add additional logging to capture the issue next time.
- Mark as "intermittent" in the task tracker.

### Step 2: Gather Context
- [ ] Check error logs (backend logs, AI logs, browser console).
- [ ] Check monitoring dashboards (if available).
- [ ] Check recent deployments (did this start after a deployment?).
- [ ] Check recent code changes (git log for affected files).
- [ ] Check related issues/tasks (has this been reported before?).
- [ ] Check the database (is data in an unexpected state?).

### Step 3: Formulate a Hypothesis
- Based on the symptoms, what is the likely root cause?
- What is the simplest explanation?
- What one thing would confirm or disprove this hypothesis?

### Step 4: Test the Hypothesis
- Add targeted logging to confirm the hypothesis.
- Create a minimal reproduction.
- Test in an isolated environment (not production).
- Verify by fixing the suspected cause and confirming the issue is resolved.

### Step 5: Fix the Root Cause
- Make the minimum change necessary to fix the root cause.
- Do NOT fix symptoms (address the underlying cause).
- Do NOT refactor unrelated code.
- Write a regression test first (test that fails before the fix, passes after).

### Step 6: Verify the Fix
- [ ] The issue is no longer reproducible.
- [ ] The regression test passes.
- [ ] All related tests pass.
- [ ] The full test suite passes.
- [ ] No new issues introduced.

### Step 7: Document
- [ ] Document the root cause in the issue/task.
- [ ] Document the fix approach.
- [ ] Update the CHANGELOG if applicable.
- [ ] Add monitoring/alerting if the issue could recur.

---

## Logging Requirements Before Debugging

### When to Add Logging
Add logging when:
1. The issue cannot be reproduced locally.
2. The issue occurs intermittently.
3. The issue is environment-specific.
4. The root cause is not obvious from error messages.
5. The data flow is complex and needs tracing.

### Logging Standards

#### Log Levels
| Level | When to Use | Color |
|-------|-------------|-------|
| `ERROR` | Application errors, unhandled exceptions | Red |
| `WARN` | Unexpected but handled situations | Yellow |
| `INFO` | Normal application flow (startup, shutdown, major state changes) | Green |
| `DEBUG` | Detailed information for debugging | Blue |
| `TRACE` | Very detailed tracing (function entry/exit) | Gray |

#### What to Log
- Function entry/exit (at DEBUG level)
- Key variable values
- API request/response summaries (not full bodies for large payloads)
- Database query parameters
- Error stack traces
- Performance timings

#### What NOT to Log
- Passwords, secrets, tokens, or API keys
- Personal Identifiable Information (PII)
- Full credit card numbers
- Full request/response bodies for large payloads
- Binary data (images, files)
- Session tokens or JWTs

### Structured Logging
All logs must be structured (JSON format) for machine parsing:

```typescript
// Backend logging
logger.info('Wardrobe item created', {
  event: 'wardrobe.item.created',
  userId: userId,
  itemId: newItem.id,
  category: newItem.category,
  duration: Date.now() - startTime,
});
```

```python
# Python logging
import logging
logger = logging.getLogger(__name__)
logger.info("Image processed", extra={
    "event": "ai.image.processed",
    "model": model_name,
    "confidence": confidence,
    "duration_ms": duration_ms,
})
```

### Logging Cleanup
After debugging is complete:
- [ ] Remove temporary debug logging.
- [ ] Keep permanent logging that provides ongoing value.
- [ ] Ensure log levels are appropriate (debug logging should not flood production).

---

## Reproduction Steps Requirement

### Mandatory Reproduction Information
Every bug report MUST include:

```
## Bug Report

### Description
[Clear description of the bug]

### Environment
- Browser/OS: [e.g., Chrome 120 on Windows 11]
- App Version: [e.g., v1.2.3]
- User Account: [test user or anonymized reference]

### Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots/Video
[Attach if applicable]

### Console Errors
[Copy any errors from browser console or server logs]

### Additional Context
[Any other relevant information]
```

### If Reproduction Is Not Possible
If the bug cannot be reproduced:
1. Document all attempts to reproduce.
2. Add additional logging to capture the issue.
3. Set up monitoring for the specific symptoms.
4. Mark the bug as "unconfirmed" and review periodically.

---

## Environment Isolation Rules

### Debugging Environments

| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| **Local** | Development and debugging | Synthetic/seed data | All developers |
| **Staging** | Pre-production testing | Anonymized production data | Team members |
| **Production** | Live application | Real user data | Restricted |

### Debugging in Each Environment

#### Local
- Full access to logs, database, and file system.
- Can modify code and restart services freely.
- Can use debugger tools (VS Code debugger, Chrome DevTools, pdb).
- Can add temporary logging without review.

#### Staging
- Access to logs and database (anonymized data).
- Can restart services with approval.
- Debugging tools limited to logging and monitoring.
- Cannot use interactive debuggers.
- Adding temporary logging requires a brief review.

#### Production
- Access to logs only (no direct database mutations).
- Access to monitoring dashboards.
- NO debugging tools that could impact performance.
- NO temporary logging without emergency approval.
- NO interactive debuggers.
- NO direct database queries without read-only access and approval.

### Environment Switching
When moving between environments:
1. Clear browser caches and cookies.
2. Verify environment-specific configuration.
3. Test against the correct API endpoint.
4. Verify data isolation (no cross-environment data leaks).

---

## Data Privacy During Debugging

### Rules
1. **Never log PII**: Personal Identifiable Information must never appear in logs.
2. **Mask sensitive data**: Credit card numbers, passwords, tokens must be masked.
3. **Use anonymized data**: Prefer synthetic or anonymized data for debugging.
4. **Production data access**: Only access production data with explicit approval.
5. **Data retention**: Delete any production data captured during debugging within 24 hours.

### What Is PII
- Full name
- Email address
- Phone number
- Physical address
- IP address
- Credit card numbers
- Government IDs (SSN, passport, driver's license)
- Biometric data
- Health information
- Authentication tokens

### Data Handling
```typescript
// ✅ Safe logging
logger.info('User profile updated', { userId: user.id, fields: ['name'] });

// ❌ Unsafe logging
logger.info('User profile updated', {
  userId: user.id,
  email: user.email,        // PII
  address: user.address,     // PII
  phone: user.phone,         // PII
});

// ✅ Masked credit card
logger.info('Payment processed', {
  cardLastFour: cardNumber.slice(-4),
  amount: payment.amount,
});

// ❌ Full credit card
logger.info('Payment processed', {
  cardNumber: cardNumber,    // Never!
  cvv: cvv,                  // Never!
});
```

---

## Debugging in Production Restrictions

### General Rule
Debugging in production is STRICTLY LIMITED. Most debugging should happen in local or staging environments.

### When Production Debugging Is Allowed
Production debugging is ONLY allowed for:
1. **Critical production outage**: System is down or severely degraded.
2. **Security incident**: Active security threat.
3. **Data loss**: Data corruption or deletion in progress.
4. **Customer-impacting bug**: Bug affecting a significant number of users with no reproduction in staging.

### Production Debugging Protocol
1. **Get approval**: At least two team members must approve (one senior).
2. **Document the plan**: What will be checked, what tools will be used, what is the rollback plan.
3. **Use read-only access**: No writes to the production database.
4. **Minimal impact**: Use the least invasive debugging methods.
5. **Time-box**: Set a maximum time limit (1 hour recommended).
6. **Monitor**: Watch for any negative side effects during debugging.
7. **Debrief**: After resolving, document what was learned and how staging can be improved to prevent future production debugging.

### Production Debugging Tools
#### ALLOWED
- Log analysis (Kibana, Logstash, or cloud log services)
- Performance monitoring (Datadog, New Relic, Sentry)
- Read-only database queries (with approval)
- Feature flags (toggle debugging features)

#### FORBIDDEN
- Interactive debuggers (breakpoints, step-through)
- Direct database writes
- Code changes without PR
- `console.log` injection into production code
- Chrome DevTools connected to production
- Remote shell access (SSH) without explicit approval

---

## Root Cause Analysis Requirements

### When RCA Is Required
Root Cause Analysis is REQUIRED for:
1. **Critical bugs**: P0/P1 severity (production outage, data loss, security).
2. **Recurring issues**: Same bug reported 3+ times.
3. **Regression**: A feature that was working and broke.
4. **Performance degradation**: 20%+ performance drop.
5. **Security incidents**: Any security-related issue.

### RCA Format
```markdown
## Root Cause Analysis

### Incident Overview
- **Date**: YYYY-MM-DD
- **Severity**: P0/P1/P2/P3
- **Impact**: [What users experienced]
- **Duration**: [How long the issue lasted]

### Timeline
- [Time] Issue detected
- [Time] Investigation started
- [Time] Root cause identified
- [Time] Fix deployed
- [Time] Verified resolved

### Root Cause
[Detailed explanation of the root cause]

### Why Analysis (5 Whys)
1. Why did the error occur? [Answer]
2. Why did that happen? [Answer]
3. Why did that happen? [Answer]
4. Why did that happen? [Answer]
5. Why did that happen? [Root cause]

### Contributing Factors
- Factor 1: [Description]
- Factor 2: [Description]

### Resolution
[How the issue was fixed]

### Preventive Measures
- Measure 1: [What will prevent this from recurring]
- Measure 2: [What will detect this earlier next time]

### Action Items
- [ ] Action item 1 (owner, due date)
- [ ] Action item 2 (owner, due date)
```

### 5 Whys Technique
Ask "Why?" five times to drill down from symptom to root cause:

```
Problem: Users cannot upload wardrobe images.

1. Why? → The upload API returns a 500 error.
2. Why? → The image processing service crashes.
3. Why? → The service runs out of memory.
4. Why? → The memory limit is set too low for large images.
5. Why? → The limit was never adjusted after adding high-resolution camera support.

Root cause: Memory limit was not updated when image resolution was increased.
```

---

## Fix Validation Requirements

### Before Deploying the Fix
- [ ] Fix is tested in local environment.
- [ ] Fix is tested in staging environment (if possible).
- [ ] Regression test is written and passes.
- [ ] All existing tests pass.
- [ ] No new warnings or errors introduced.
- [ ] Code review is completed.

### After Deploying the Fix
- [ ] Monitor error rates for 30 minutes post-deployment.
- [ ] Monitor response times for 30 minutes post-deployment.
- [ ] Manually verify the fix in production (if possible).
- [ ] Confirm with the reporter that the issue is resolved.

### Fix Rollback Criteria
Rollback the fix if:
1. Error rates increase after deployment.
2. Response times increase significantly.
3. New bugs are discovered related to the fix.
4. The fix does not actually resolve the issue.
5. The fix introduces a security vulnerability.

---

## Regression Test Requirements

### When to Add Regression Tests

A regression test MUST be added for:
1. **Every bug fix**: Ensure the bug does not reappear.
2. **Every security patch**: Ensure the vulnerability is not reintroduced.
3. **Every performance fix**: Ensure performance does not regress.
4. **Every database migration**: Ensure data integrity is maintained.

### Regression Test Characteristics
- **Focused**: Tests only the specific bug/behavior.
- **Deterministic**: Always produces the same result.
- **Fast**: Runs in < 100ms.
- **Independent**: Does not depend on other tests.

### Regression Test Examples

```typescript
// Frontend regression test
it('should not crash when wardrobe is empty (regression: #1234)', () => {
  render(<WardrobeList items={[]} />);
  expect(screen.getByText(/your wardrobe is empty/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
});
```

```typescript
// Backend regression test
it('should return 404 for non-existent item (regression: #1235)', async () => {
  const response = await request(app.getHttpServer())
    .get('/api/v1/wardrobe/items/non-existent-id')
    .set('Authorization', `Bearer ${authToken}`);
  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe('ITEM_NOT_FOUND');
});
```

```python
# AI regression test
def test_segmentation_handles_transparent_background(regression="fix-1236"):
    """Regression test: segmentation pipeline should handle transparent PNGs."""
    image = load_test_image("transparent_clothing.png")
    result = segmenter.process(image)
    assert result.mask is not None
    assert result.confidence > 0.3  # Lower threshold for transparent images
```

### Regression Test Naming
```
it('should [expected behavior] (regression: #issue-number)')
```

---

## Common Debugging Techniques

### Frontend Debugging
1. **React DevTools**: Inspect component tree, props, state.
2. **Chrome DevTools**: Network tab, Console, Sources, Performance.
3. **React Three Fiber Debugger**: `npm run devtools` for 3D scene inspection.
4. **TanStack Query DevTools**: Monitor queries, mutations, cache state.
5. **Zustand DevTools**: Monitor store state changes.

### Backend Debugging
1. **NestJS logger**: Structured logs with request tracing.
2. **VS Code debugger**: Attach to Node.js process.
3. **Postman/Insomnia**: Test API endpoints directly.
4. **Prisma Studio**: `npx prisma studio` for database inspection.
5. **Redis CLI**: `redis-cli` for cache inspection.

### AI Debugging
1. **Python debugger**: `import pdb; pdb.set_trace()`.
2. **Jupyter notebooks**: Explore data and model outputs.
3. **TensorBoard**: Visualize model training and metrics.
4. **OpenCV visualization**: `cv2.imshow()` for image processing debugging.
5. **Model output inspection**: Log intermediate pipeline outputs.

### Common Debugging Tools

| Tool | Purpose | Layer |
|------|---------|-------|
| Chrome DevTools | Network, console, performance | Frontend |
| React DevTools | Component inspection | Frontend |
| TanStack Query DevTools | Server state inspection | Frontend |
| Zustand DevTools | State management inspection | Frontend |
| VS Code Debugger | Step-through debugging | Frontend, Backend |
| NestJS Logger | Application logs | Backend |
| Prisma Studio | Database inspection | Backend |
| Postman | API testing | Backend |
| Redis CLI | Cache inspection | Backend |
| pdb/ipdb | Python debugging | AI |
| Jupyter | Exploratory analysis | AI |
| TensorBoard | Model training monitoring | AI |
| Sentry | Error tracking | All |
| Datadog/New Relic | Performance monitoring | All |
