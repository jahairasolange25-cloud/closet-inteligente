# Incident Response

## Overview
The incident response framework defines how Closet Inteligente Digital detects, responds to, and learns from service disruptions. It follows a blameless culture model with clearly defined severity levels, roles, and escalation paths.

---

## Incident Severity Classification

| Severity | Definition | Response Time | Impact | Examples |
|----------|-----------|--------------|--------|----------|
| **SEV1** | Complete platform outage or critical feature unavailable | 15 minutes | All users unable to use the platform; revenue impact | Database down, API gateway offline, authentication broken, data loss |
| **SEV2** | Major feature degradation affecting many users | 30 minutes | Significant subset of users cannot use key features | AI pipeline down, image uploads failing, recommendations not loading, payment failures |
| **SEV3** | Minor feature degradation or non-critical bugs | 2 hours | Small subset of users affected; workaround available | Slow page loads, minor UI bugs, delayed notifications, non-critical API errors |
| **SEV4** | Cosmetic issues, tech debt, internal tooling problems | 8 hours (next business day) | No user-facing impact; internal development friction | Stale documentation, minor code warnings, CI pipeline flakiness, deprecated dependencies |

### Severity Classification Matrix

| Factor | SEV1 | SEV2 | SEV3 | SEV4 |
|--------|------|------|------|------|
| Users affected | > 50% | 10-50% | 1-10% | < 1% |
| Core features broken | Multiple | One major | One minor | None |
| Revenue impact | > $10K/hour | $1K-$10K/hour | < $1K/hour | None |
| Data integrity risk | Yes | Possible | No | No |
| SLA breach | Yes | Likely | Unlikely | No |
| Regulatory impact | Yes | Possible | No | No |

---

## Incident Detection Methods

### 1. Automated Monitoring Alerts
- **Metric-based**: Threshold violations on latency, error rate, throughput, resource usage
- **Log-based**: Pattern matching on error logs (e.g., repeated database connection failures)
- **Health check**: Failed health probes triggering orchestrator events
- **Synthetic monitoring**: Automated browser tests (Playwright/Cypress) running every 5 minutes from multiple geographic regions
- **Anomaly detection**: ML-based detection of unusual patterns in traffic, error rates, or performance metrics

### 2. User Reports
- **In-app feedback**: Users submit bug reports through the "Report an Issue" feature (attaches logs, screenshots, and request ID)
- **Zendesk/Intercom**: Support tickets escalated to engineering
- **Social media**: Monitored via social listening tools for trending complaints
- **App store reviews**: Monitored for crash reports and feature issues

### 3. Internal Testing
- **CI/CD pipeline**: Tests must pass before deployment; alerts on regression
- **Canary analysis**: Automated comparison of canary vs stable metrics
- **Chaos engineering**: Scheduled experiments that inject failures to test resilience

### 4. Partner/Customer Notifications
- **Enterprise clients**: Dedicated support channel for escalation
- **API partners**: API usage monitoring; sudden drops indicate issues

---

## Incident Response Workflow

### Phase 1: Detection & Triage (0-5 minutes)

```
[Alert Triggered] or [User Report Received]
         |
         v
[On-Call Engineer Acknowledges]
         |
         +--- Is this a known issue with an existing runbook?
         |       YES -> Follow runbook
         |       NO  -> Continue to triage
         |
         v
[Determine Severity]
    - Assess user impact (how many, which features)
    - Assess revenue/data/regulatory impact
    - Assign severity level (SEV1-SEV4)
         |
         v
[Declare Incident]
    - Create incident channel in Slack (#incident-<timestamp>)
    - Open incident in PagerDuty/incident management tool
    - Tag with severity label
    - Notify stakeholders per severity
```

### Phase 2: Initial Response (5-15 minutes)

```
[Incident Commander Assigned]
    - First responder becomes IC (or hand off to senior engineer)
    - IC is the single point of command (does NOT debug)
    - IC manages communication, coordination, timeline

[Response Team Paged]
    - SEV1: Page all relevant engineering team members
    - SEV2: Page service owners
    - SEV3: Assign to team for same-day investigation
    - SEV4: Log as bug, prioritize in next sprint

[DISASTER RECOVERY]
    - If SEV1 and recovery steps are known:
      - Start DR procedure immediately
      - Parallel investigation and mitigation
```

### Phase 3: Mitigation (15 minutes - 2 hours)

```
[Investigate]
    - Check dashboards (Grafana, Vercel, Railway/Render)
    - Search logs (Kibana query by service, request_id, error pattern)
    - Check recent deployments (git log, CI/CD pipeline)
    - Check dependency status (database, Redis, Cloudinary, Supabase)
    - Reproduce issue in staging if possible

[Identify Root Cause or Workaround]
    - Find the source of the failure
    - Determine if full fix or temporary mitigation is faster

[Apply Mitigation]
    Options (choose fastest path to recovery):
    - Rollback: Revert to last known-good deployment
    - Restart: Restart service or clear cache
    - Scale: Increase replicas or resources
    - Redirect: Route traffic to healthy instances
    - Feature flag: Disable problematic feature
    - Circuit break: Isolate failing dependency
    - Database: Failover to replica, restore from backup

[Verify Mitigation]
    - Confirm error rate returns to baseline
    - Confirm latency normalizes
    - Confirm health checks pass
    - Run smoke tests on critical user flows
```

### Phase 4: Resolution & Communication (Recovery onward)

```
[Resolve Incident]
    - Confirm platform is fully operational
    - Update incident status to "Resolved"
    - Close incident channel (archive, do not delete)
    - Send resolution notification to stakeholders

[Communication]
    - Internal: Summary to engineering team
    - External (if user-facing):
      - Status page update (e.g., status.closetinteligente.com)
      - Social media update if widespread outage
      - Email to affected users (only if SEV1)
```

### Phase 5: Postmortem (Within 48 hours for SEV1/SEV2; within 1 week for SEV3)

```
[Schedule Postmortem]
    - SEV1/SEV2: Within 48 hours of resolution
    - SEV3: Within 1 week
    - SEV4: No formal postmortem; log in bug tracker

[Conduct Postmortem Meeting]
    - All involved engineers and stakeholders attend
    - Walk through timeline of events
    - Identify root cause
    - Discuss what went well and what went wrong
    - Generate action items

[Write Postmortem Document]
    - Use postmortem template (see below)
    - Submit for review
    - Publish to team knowledge base

[Action Items]
    - Assign owners and due dates
    - Track in project management system
    - Follow up at next sprint review
```

---

## Escalation Matrix

### Primary Escalation Path

| Level | Role | Responsibility | Contact Method |
|-------|------|----------------|----------------|
| L1 | On-Call Engineer | First responder, triage, initial mitigation | PagerDuty (phone + push) |
| L2 | Senior Backend/Infrastructure Engineer | Complex debugging, system-level issues | Phone, Slack @mention |
| L3 | Engineering Manager | Cross-team coordination, stakeholder communication | Phone, Slack @mention |
| L4 | CTO / VP Engineering | Crisis management, external communication, major decisions | Phone |

### Escalation Rules

| Condition | Escalate To | Timeframe |
|-----------|-------------|-----------|
| No acknowledgment from L1 | L2 (Secondary on-call) | 5 minutes |
| SEV1 not mitigated | L3 | 30 minutes |
| SEV2 not mitigated | L3 | 60 minutes |
| SEV1 > 1 hour duration | L4 | 60 minutes |
| Data loss suspected | L3 + Security Lead | Immediately |
| Security breach | L4 + Security Lead | Immediately |
| Regulatory compliance issue | L4 + Legal | Immediately |
| Customer escalation from support | L3 | Upon support request |

### On-Call Rotation

| Role | Schedule | Coverage |
|------|----------|----------|
| Primary On-Call | Weekly rotation (Mon 09:00 UTC) | 24/7 |
| Secondary On-Call | Weekly rotation (offset) | 24/7 (backup) |
| AI Pipeline Specialist | Weekly rotation | Business hours + escalations |
| Database Specialist | Monthly rotation | 24/7 for DB alerts |
| Security On-Call | 24/7 (dedicated team) | All security incidents |

---

## Communication Templates

### Incident Declaration (Slack)

```
:warning: INCIDENT DECLARED :warning:

Title: [Brief descriptive title]
Severity: SEV[1-4]
Service(s) Affected: [services]
Start Time: [UTC timestamp]
Detected By: [Monitoring / User Report / Internal]
Current Status: [Investigating / Mitigating / Resolved]
Incident Channel: #incident-[date]-[topic]
Incident Commander: @name

Description:
[Brief description of the issue]

Impact:
- Affected users: [number or %]
- Affected features: [list]
- Revenue impact: [if applicable]

Current Actions:
- [Action being taken]
- [Action being taken]

Links:
- [Grafana dashboard]
- [Kibana log query]
- [Runbook link]
- [Deployment link]
```

### Status Update (Slack - every 30 minutes or at key milestones)

```
:arrows_counterclockwise: INCIDENT UPDATE :arrows_counterclockwise:

Incident: [Title]
Severity: SEV[1-4]
Elapsed Time: [X minutes]
Current Status: [Investigating / Mitigating / Resolved]

What We Know:
- [Key finding]
- [Key finding]

Current Actions:
- [Action in progress]
- [Action in progress]

Next Update: [time or "No further updates expected"]
```

### Incident Resolution (Slack)

```
:white_check_mark: INCIDENT RESOLVED :white_check_mark:

Incident: [Title]
Severity: SEV[1-4]
Start Time: [UTC timestamp]
End Time: [UTC timestamp]
Duration: [X minutes]
Root Cause: [Brief root cause]
Resolution: [How it was fixed / mitigated]

Actions Taken:
- [Action]
- [Action]

Postmortem: [Scheduled date/time]

The incident channel #incident-[date]-[topic] will be archived in 24 hours.
```

### Customer-Facing Status Update (Status Page)

```
[INCIDENT] [Title]

We are currently investigating an issue affecting [feature(s)]. 
Users may experience [symptoms].

Started at: [UTC timestamp]
Estimated recovery: [ETA or "Investigating"]

Updates will be posted here every 30 minutes.

Status: [Investigating / Identified / Monitoring / Resolved]
```

### User Notification Email (SEV1 only)

```
Subject: Service Disruption on Closet Inteligente Digital

Dear [User Name],

We experienced a service disruption on [date] from [start time] to [end time] UTC 
that affected access to [affected features].

The issue was caused by [brief root cause, non-technical] and has been resolved. 
Your data is safe and unaffected.

We apologize for the inconvenience. If you continue to experience issues, 
please contact support@closetinteligente.com.

Thank you for your patience,
The Closet Inteligente Team
```

---

## Postmortem Template

```markdown
# Postmortem: [Incident Title]

## Metadata
- **Date**: YYYY-MM-DD
- **Duration**: [Start Time] UTC - [End Time] UTC ([X] minutes)
- **Severity**: SEV[1-4]
- **Incident Commander**: [Name]
- **Responders**: [Names]
- **Services Affected**: [List of services]

## Executive Summary
[2-3 sentence summary of what happened, the impact, and what was done to fix it]

## Timeline
All times in UTC.

| Time | Event |
|------|-------|
| 14:00 | [Alert triggered / User report received] |
| 14:02 | [On-call acknowledged] |
| 14:05 | [Incident declared, IC assigned] |
| 14:10 | [Initial investigation began] |
| 14:25 | [Root cause identified] |
| 14:30 | [Mitigation action started] |
| 14:45 | [Mitigation applied] |
| 14:50 | [Verification complete] |
| 15:00 | [Incident resolved] |

## Impact
- **Users affected**: [Number or percentage]
- **Features affected**: [List of features]
- **Duration of impact**: [X] minutes
- **Revenue impact**: [$ amount, if applicable]
- **Data loss**: [Yes/No; describe if yes]

## Root Cause
[Detailed explanation of the root cause, including:
- What went wrong
- Why it went wrong
- How it was allowed to reach production]

## Detection
- **How was this detected?**: [Monitoring alert / User report / Internal]
- **Why wasn't it detected sooner?**: [If applicable]
- **Time from introduction to detection**: [X] hours

## Resolution
[Detailed explanation of what was done to resolve the incident]

## What Went Well
- [Thing that went well]
- [Thing that went well]

## What Went Wrong
- [Thing that went wrong]
- [Thing that went wrong]

## Action Items

| # | Action Item | Type | Owner | Due Date | Status |
|---|-------------|------|-------|----------|--------|
| 1 | [Action] | prevent/detect/mitigate/process | @owner | YYYY-MM-DD | Open |
| 2 | [Action] | prevent/detect/mitigate/process | @owner | YYYY-MM-DD | Open |

### Action Item Types
- **Prevent**: Changes to prevent recurrence
- **Detect**: Improvements to detection (monitoring, alerting)
- **Mitigate**: Changes to reduce impact if it happens again
- **Process**: Improvements to incident response process

## Lessons Learned
[Key takeaways for the team]

## Supporting Documentation
- [Link to Grafana dashboard snapshots]
- [Link to Kibana log queries]
- [Link to related PRs/commits]
- [Link to incident Slack channel archive]
```

---

## Blameless Culture Guidelines

### Core Principles
1. **Assume good intent**: Everyone was acting with the information they had at the time
2. **Focus on systems, not people**: Most incidents are caused by system complexity, not individual mistakes
3. **Share learnings**: Every incident is an opportunity to improve
4. **Psychological safety**: People should feel safe reporting mistakes and near-misses
5. **No blame in postmortems**: Postmortems never attribute fault to individuals
6. **Celebrate transparency**: Acknowledging mistakes is encouraged and valued

### What Blameless IS
- Asking "How did our processes allow this to happen?"
- Focusing on systemic improvements
- Encouraging reporting of all incidents and near-misses
- Treating incidents as learning opportunities
- Recognizing that humans make mistakes and designing systems to catch them

### What Blameless IS NOT
- Ignoring accountability or responsibility
- Avoiding hard conversations about performance
- Ignoring repeated patterns of carelessness
- Preventing appropriate disciplinary action for malice or gross negligence
- Saying "it's okay" when someone ignores established safety procedures

### Blameless Language Guide

| Instead of This | Say This |
|----------------|----------|
| "John deployed bad code" | "The deployment pipeline didn't catch the regression" |
| "Sarah forgot to check X" | "The checklist didn't include X as a step" |
| "The team was careless" | "The testing process didn't cover this edge case" |
| "Why didn't you test this?" | "How can we improve our test coverage?" |
| "This was a stupid mistake" | "What in our process allowed this to happen?" |

---

## Incident Commander Role

### Responsibilities
The Incident Commander (IC) is the single point of command during an incident. The IC does NOT debug or fix issues.

**During incident:**
- Declare the incident and set severity
- Assemble the response team
- Track timeline and maintain the incident log
- Coordinate communication (internal and external)
- Make prioritization decisions (e.g., which fix to pursue)
- Escalate when needed
- Declare resolution
- Schedule postmortem

**After incident:**
- Ensure incident channel is archived
- Review postmortem draft
- Follow up on action items

### IC Checklist

```
INCIDENT COMMANDER CHECKLIST

[ ] Declare incident with severity
[ ] Open incident channel: #incident-<date>-<topic>
[ ] Pin the incident declaration message
[ ] Assign roles:
    [ ] Scribe (takes notes, maintains timeline)
    [ ] Lead investigator (drives technical investigation)
    [ ] Communications lead (handles stakeholder updates)
[ ] Set up bridge call if needed (Zoom / Google Meet)
[ ] Start incident timer
[ ] First update to stakeholders within 15 minutes
[ ] Regular updates every 30 minutes
[ ] Track all mitigation attempts
[ ] Escalate if not making progress (30 min for SEV1, 60 min for SEV2)
[ ] Verify resolution thoroughly
[ ] Declare resolution
[ ] Post final summary in #incidents channel
[ ] Schedule postmortem within 48 hours
[ ] Archive incident channel after 24 hours
```

### Handoff Protocol
When IC needs to hand off (e.g., shift change):
1. Brief incoming IC on current status, actions taken, and next steps
2. Transfer all incident documentation
3. Update incident record with new IC name
4. Both ICs remain in channel for 15-minute overlap

---

## Response Time SLAs

| Severity | Time to Acknowledge | Time to First Response | Time to Mitigation | Postmortem |
|----------|---------------------|----------------------|-------------------|------------|
| SEV1 | 5 minutes | 15 minutes | 60 minutes (target) | Within 48 hours |
| SEV2 | 10 minutes | 30 minutes | 4 hours (target) | Within 48 hours |
| SEV3 | 30 minutes | 2 hours | Next business day | Within 1 week |
| SEV4 | 2 hours | 8 hours | Next sprint | Optional |

### SLA Compliance Tracking

```
SLA Dashboard (Grafana)

| Severity | This Month | Target | Status |
|----------|------------|--------|--------|
| SEV1 Ack | 100% | 100% | :green_circle: |
| SEV1 Mitigation | 95% | 90% | :green_circle: |
| SEV2 Ack | 98% | 100% | :yellow_circle: |
| SEV2 Mitigation | 92% | 95% | :yellow_circle: |
| Postmortem (on time) | 100% | 100% | :green_circle: |
```

---

## Recovery Procedure Templates

### Template A: Service Restart

```
SERVICE RESTART RECOVERY

1. Verify health of dependencies (database, Redis, API)
   - curl http://service/health/ready

2. Identify instances to restart
   - List unhealthy instances: [command]
   - Check if rolling restart is appropriate

3. Perform restart
   - Graceful shutdown: kill -TERM <pid> or docker stop
   - Wait for process to exit (max 30 seconds)
   - Start new instance: [service start command]

4. Verify recovery
   - Check health endpoint returns 200
   - Confirm metrics returning to baseline
   - Run smoke tests on critical flows

5. Monitor
   - Watch error rates and latency for 10 minutes
   - Ensure no cascading failures

6. Document
   - Log restart reason and outcome
```

### Template B: Deployment Rollback

```
DEPLOYMENT ROLLBACK

1. Identify problematic deployment
   - Check deployment history: [CI/CD dashboard]
   - Note the version/hash to roll back to

2. Verify rollback target is healthy
   - Check that target version has passing health checks
   - Confirm target version's deployment date

3. Execute rollback
   - Option A (Vercel): Vercel CLI rollback
   - Option B (Docker): Deploy previous image tag
   - Option C (Git): git revert + redeploy

4. Verify rollback
   - Confirm correct version deployed
   - Run smoke tests
   - Check error rates

5. Investigate original deployment
   - Determine what caused the failure
   - Fix the issue
   - Redeploy with fix

6. Document
   - Root cause of failed deployment
   - Rollback timestamp and duration
```

### Template C: Database Failover

```
DATABASE FAILOVER

PREREQUISITES:
- Read replica is running and replication is active
- Replication lag is acceptable (< 10 seconds)

FAILOVER STEPS:

1. Verify replica is healthy
   - Check pg_isready on replica
   - Verify WAL replay is progressing
   - Confirm replication lag

2. Stop writes to primary
   - Set primary to read-only: ALTER SYSTEM SET default_transaction_read_only = on;
   - Wait for in-flight transactions to complete
   - Kill remaining connections: SELECT pg_terminate_backend(pid)

3. Promote replica to primary
   - On replica: pg_ctl promote or SELECT pg_promote()
   - Wait for promotion to complete

4. Update application configuration
   - Update DATABASE_URL to point to new primary
   - Restart affected services
   - Verify connections established

5. Verify new primary
   - Check that writes work
   - Confirm data consistency
   - Run application smoke tests

6. Set up old primary as new replica (if needed)
   - Configure replication from new primary
   - Start replication

ROLLBACK:
- If failover fails, revert to original primary
- Steps: 1. Stop replica promotion, 2. Re-enable writes on original primary
```

### Template D: Cache Clear

```
CACHE CLEAR

DETERMINE SCOPE:
- Option A: Clear entire Redis (all users affected due to cache miss storm)
- Option B: Clear specific namespace (e.g., garment:*)
- Option C: Clear specific keys

REDIS COMMANDS:
- Flush all: redis-cli FLUSHALL (use with extreme caution)
- Flush DB: redis-cli FLUSHDB (current database only)
- Namespace clear: redis-cli --scan --pattern 'garment:*' | xargs redis-cli DEL
- Single key: redis-cli DEL garment:123

PROCEDURE:
1. Announce cache clear in Slack (#ops-alerts)
2. Clear cache using appropriate command
3. Monitor cache hit rate and database load
4. Expect temporary increase in database queries
5. Cache will repopulate naturally within minutes
6. Verify hit rate returns to normal within 15 minutes

WARNING:
- Clearing cache causes a "cache storm" - all requests hit the database
- Best done during low traffic periods
- Consider gradual expiration (TTL stagger) rather than bulk clear
```

---

## Root Cause Analysis Requirements

### RCA Depth by Severity

| Severity | Analysis Depth | Techniques Required | Approval |
|----------|---------------|-------------------|----------|
| SEV1 | Full | 5 Whys, Fishbone, Time Travel Debugging | CTO approval |
| SEV2 | Standard | 5 Whys, Timeline Analysis | Engineering Manager |
| SEV3 | Light | Root cause identified, fix implemented | Tech Lead |
| SEV4 | Minimal | Bug description + fix | Engineer |

### Required RCA Elements

For SEV1 and SEV2 incidents, the postmortem must include:

1. **Timeline Reconstruction**: Exact sequence of events with timestamps
2. **5 Whys Analysis**: At least 5 layers of "why" to find systemic root cause
3. **Contributing Factors**: All factors that contributed (technology, process, people)
4. **Impact Analysis**: Quantified user, revenue, and data impact
5. **Detection Gaps**: Why the issue wasn't caught earlier
6. **Prevention Controls**: What should prevent recurrence
7. **Detection Controls**: Monitoring and alerting improvements
8. **Mitigation Controls**: Graceful degradation to reduce future impact
9. **Action Items**: Specific, measurable, assigned, with deadlines
10. **Verification**: How we'll verify the fix works

### 5 Whys Example

```
Problem: AI garment detection is failing for 20% of uploads

Why? -> The detection model is timing out on large image files

Why? -> No image size validation before sending to AI pipeline

Why? -> The preprocessing step was removed in a recent refactor

Why? -> The refactor PR didn't include tests for the preprocessing step

Why? -> Our code review checklist doesn't require validation of data transformation steps

Systemic Root Cause: Code review process lacks data flow verification checklist
```

### RCA Verification

Before closing a postmortem:
1. All action items must have owners and due dates
2. At least one preventive action item must be identified
3. The detection gap must be addressed (monitoring/alerting improvement)
4. Action items must be tracked in the project management system
5. Postmortem must be shared with the full engineering team

---

## Incident Documentation

### Incident Record (Permanent)

Each incident generates a permanent record containing:
- Incident ID (e.g., `INC-2026-05-25-001`)
- Title, severity, timeline
- All Slack messages from the incident channel
- Grafana dashboard snapshots
- Log excerpts
- Postmortem document
- Action items and their status

### Incident Log Storage
- **Location**: `project-memory/incidents/INC-YYYY-MM-DD-NNN.md`
- **Format**: Markdown with YAML frontmatter
- **Retention**: Permanent
- **Access**: Engineering team (private), Executive team (summary)

---

## Continuous Improvement

### Monthly Review
- Review all incidents from the month
- Identify patterns (repeat incidents, common root causes)
- Update runbooks based on lessons learned
- Report incident metrics to engineering all-hands

### Quarterly Game Day
- Tabletop exercise simulating a major incident
- Test on-call response and escalation
- Validate disaster recovery procedures
- Practice incident command structure

### Annual Review
- Comprehensive review of incident response program
- Update severity definitions and SLAs
- Review and update all runbooks
- Conduct full-scale DR simulation
