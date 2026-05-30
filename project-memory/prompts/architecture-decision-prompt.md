# Architecture Decision Prompt — Closet Inteligente Digital

> **Purpose:** Template and evaluation framework for creating Architecture Decision Records (ADRs). Use this prompt whenever an architectural decision needs to be made, documented, or reviewed.

---

## 1. When to Create an ADR

Create an ADR when any of the following occur:

| Trigger | Example |
|---|---|
| **Technology choice** | Selecting a library, framework, database, or tool |
| **Architecture pattern** | Deciding between microservices vs monolith, event-driven vs request-response |
| **Design approach** | REST vs GraphQL, optimistic vs pessimistic updates |
| **Significant refactor** | Restructuring a module, changing data flow |
| **External integration** | Adding a new third-party service or API |
| **Process change** | CI/CD strategy, branching model, deployment approach |
| **ADR override** | A new decision supersedes a previous ADR |
| **Performance strategy** | Caching strategy, indexing approach, CDN configuration |
| **Security approach** | Authentication flow, encryption strategy, secrets management |
| **Data model change** | Adding a major entity, changing relationships |

**Do NOT create an ADR for:**
- Bug fixes or minor implementation details
- Routine dependency updates (patch/minor versions)
- Configuration changes for existing patterns
- Code style or formatting decisions (use coding-standards.md instead)

---

## 2. ADR Creation Checklist

Before writing an ADR, verify:

- [ ] This decision is significant enough to warrant an ADR (see triggers above)
- [ ] You have read all existing ADRs and this does not contradict an accepted decision
- [ ] You have consulted the relevant component specs and architecture documents
- [ ] You have considered at least 2-3 alternatives
- [ ] You understand the consequences (positive and negative)
- [ ] The ADR is written BEFORE implementation (decision first, code second)
- [ ] The ADR number is the next sequential number (check the highest existing ADR)

---

## 3. ADR Template

```markdown
# ADR-<NNN>: <Title>

**Status:** PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED  
**Date:** YYYY-MM-DD  
**Author:** <agent-id or human name>  
**Deciders:** <list of people involved in the decision>  
**Technical Story:** <link to GitHub Issue or task>  

---

## Context

<Describe the problem that prompted this decision. Include:>
- What is the problem we are solving?
- What constraints are we operating under?
- What are the requirements or goals?
- What have we tried before (if applicable)?
- What is the timeline pressure (if any)?

<Keep this section focused on facts and requirements, not solutions.>

---

## Decision

<Describe the chosen approach in detail. Include:>
- What exactly are we doing?
- How does it work at a high level?
- What are the key components or interfaces?
- How does it integrate with existing systems?

<Be specific enough that someone unfamiliar with the project can understand what was decided.>

---

## Consequences

### Positive
- <benefit 1>
- <benefit 2>
- <benefit 3>

### Negative
- <drawback or trade-off 1>
- <drawback or trade-off 2>
- <drawback or trade-off 3>

### Neutral
- <side effect or change 1>
- <side effect or change 2>

### Migration / Adoption Impact
- <what needs to change in existing code>
- <database migrations required>
- <documentation updates needed>
- <team training or onboarding needed>

---

## Alternatives Considered

### Alternative 1: <Name>
- **Description:** <brief description>
- **Pros:** <list of advantages>
- **Cons:** <list of disadvantages>
- **Why rejected:** <specific reason this was not chosen>

### Alternative 2: <Name>
- **Description:** <brief description>
- **Pros:** <list of advantages>
- **Cons:** <list of disadvantages>
- **Why rejected:** <specific reason this was not chosen>

### Alternative 3: <Name> (optional)
- **Description:** <brief description>
- **Pros:** <list of advantages>
- **Cons:** <list of disadvantages>
- **Why rejected:** <specific reason this was not chosen>

---

## Decision Evaluation Framework

| Criteria | Weight | Score (1-5) | Weighted Score |
|---|---|---|---|
| Alignment with project goals | 20% | X | X.X |
| Development velocity | 15% | X | X.X |
| Performance / scalability | 15% | X | X.X |
| Maintenance cost | 10% | X | X.X |
| Team expertise | 10% | X | X.X |
| Ecosystem / community | 10% | X | X.X |
| Security | 10% | X | X.X |
| Cost (financial) | 5% | X | X.X |
| Flexibility / future-proofing | 5% | X | X.X |

**Chosen Option Score:** X.X / 5.0

<This table compares the chosen option against alternatives using the same criteria.>

---

## Validation

- [ ] Proof of concept completed (if applicable)
- [ ] Performance benchmarks meet targets
- [ ] Security review passed
- [ ] Cost impact assessed
- [ ] Team capacity confirmed for implementation

---

## References

- <link to GitHub Issue>
- <link to related ADR>
- <link to documentation>
- <link to external resource (library docs, article, etc.)>

---

## Status History

| Date | Status | Notes |
|---|---|---|
| YYYY-MM-DD | PROPOSED | Initial proposal |
| YYYY-MM-DD | ACCEPTED | Approved by <decider> |
| YYYY-MM-DD | SUPERSEDED | Superseded by ADR-<NNN> |
```

---

## 4. Decision Evaluation Framework

### 4.1 Criteria Definitions

| Criterion | 1 (Poor) | 2 (Fair) | 3 (Good) | 4 (Very Good) | 5 (Excellent) |
|---|---|---|---|---|---|
| **Alignment with project goals** | Conflicts with core goals | Neutral | Supports one goal | Supports multiple goals | Essential to mission |
| **Development velocity** | >2 weeks to implement | 1-2 weeks | 3-7 days | 1-3 days | <1 day |
| **Performance / scalability** | Cannot meet baseline | Meets baseline with tuning | Meets all targets | Exceeds targets | Future-proof |
| **Maintenance cost** | High ongoing effort | Moderate effort | Low effort | Minimal effort | Self-maintaining |
| **Team expertise** | No one knows it | One person knows it | 2-3 people know it | Most of team knows it | Everyone knows it |
| **Ecosystem / community** | Unmaintained, <1k users | Small community | Active, well-documented | Major project, >100k users | Industry standard |
| **Security** | Known vulnerabilities | Untrusted | Community-vetted | Audited | Security-first design |
| **Cost (financial)** | >$500/month | $100-500/month | $20-100/month | <$20/month | Free |
| **Flexibility / future-proofing** | Lock-in, hard to change | Some lock-in | Replaceable with effort | Abstracted, swappable | Fully decoupled |

### 4.2 Scoring Guidelines
- **Total > 4.0:** Strongly recommended
- **Total 3.0 - 4.0:** Acceptable with justification
- **Total < 3.0:** Consider alternatives
- **Any single criterion < 2:** Flag for discussion

### 4.3 Comparison Matrix
For significant decisions, compare ALL alternatives using the same criteria:

| Criteria | Weight | Option A | Option B | Option C |
|---|---|---|---|---|
| Alignment | 20% | 4 (0.80) | 3 (0.60) | 2 (0.40) |
| Velocity | 15% | 3 (0.45) | 4 (0.60) | 3 (0.45) |
| Performance | 15% | 5 (0.75) | 3 (0.45) | 4 (0.60) |
| Maintenance | 10% | 4 (0.40) | 3 (0.30) | 2 (0.20) |
| Expertise | 10% | 3 (0.30) | 3 (0.30) | 4 (0.40) |
| Ecosystem | 10% | 5 (0.50) | 3 (0.30) | 4 (0.40) |
| Security | 10% | 4 (0.40) | 4 (0.40) | 3 (0.30) |
| Cost | 5% | 3 (0.15) | 4 (0.20) | 5 (0.25) |
| Flexibility | 5% | 3 (0.15) | 4 (0.20) | 3 (0.15) |
| **Total** | **100%** | **3.90** | **3.35** | **3.15** |

---

## 5. Alternatives Analysis Format

### 5.1 Structured Comparison
For each alternative, document:

```
### Alternative N: <Name>

**Overview:**
<1-2 paragraph description of the alternative>

**Technical Details:**
- <specific implementation detail>
- <specific implementation detail>

**Pros:**
1. <advantage>
2. <advantage>
3. <advantage>

**Cons:**
1. <disadvantage>
2. <disadvantage>
3. <disadvantage>

**Risks:**
- <risk description> (Probability: Low/Med/High, Impact: Low/Med/High)

**Validation:**
- [ ] POC completed
- [ ] Benchmarks meet targets
- [ ] Security reviewed
- [ ] Cost estimated

**Why Rejected:**
<clear explanation of why this was not chosen, referencing specific cons or risks that were dealbreakers>
```

### 5.2 Common Rejection Reasons
- "Does not meet ADR-003 (Supabase auth) requirements"
- "Introduces vendor lock-in that violates project's open ecosystem value"
- "Team lacks expertise and learning curve is too steep for current timeline"
- "License incompatible with project (GPL runtime)"
- "Performance does not meet sub-500ms P95 requirement"
- "Cost exceeds $X/month budget for infrastructure"

---

## 6. Consequences Documentation

### 6.1 Consequence Categories
Document consequences across these dimensions:

| Category | Examples |
|---|---|
| **Architecture** | New module needed, existing module changes, interface modifications |
| **Data** | Schema changes, migration required, data migration strategy |
| **Performance** | Latency impact, throughput changes, caching implications |
| **Security** | New attack surface, authentication changes, compliance impact |
| **Operations** | Deployment changes, monitoring needs, backup strategy impact |
| **Team** | Learning required, documentation needed, onboarding impact |
| **Timeline** | Implementation effort, phase changes, dependency delays |
| **Cost** | Infrastructure cost, third-party service fees, licensing |
| **Scalability** | Horizontal scaling implications, database sharding needs |
| **User Experience** | UI/UX changes, loading time impact, feature availability |

### 6.2 Risk Assessment for Each Consequence
```
**Consequence:** <description>

**Type:** Architecture | Data | Performance | Security | Operations | Team | Timeline | Cost | Scalability | UX

**Impact Level:** Low | Medium | High | Critical

**Likelihood:** Low | Medium | High

**Mitigation:**
<how to address this consequence>

**Trigger for Re-evaluation:**
<what specific event or metric would cause us to revisit this decision>
```

---

## 7. ADR Lifecycle

### 7.1 Status Flow
```
PROPOSED ──► ACCEPTED ──► DEPRECATED
    │                        │
    └──► SUPERSEDED ◄────────┘
```

- **PROPOSED:** Initial draft, under discussion. Can be modified freely.
- **ACCEPTED:** Formally approved. Must be followed. Changes require a new ADR.
- **DEPRECATED:** No longer recommended but still valid for existing implementations.
- **SUPERSEDED:** Replaced by a newer ADR. Existing implementations should migrate.

### 7.2 Transition Rules
| From | To | Requires |
|---|---|---|
| PROPOSED | ACCEPTED | Team review + at least 2 approvals + Tech Lead sign-off |
| PROPOSED | SUPERSEDED | New ADR proposed that directly addresses the same problem |
| ACCEPTED | SUPERSEDED | New ADR with clear rationale for change + team approval |
| ACCEPTED | DEPRECATED | Team consensus that this is no longer the right approach |

### 7.3 Review Cadence
- New ADRs should be reviewed within 1 week of proposal
- Accepted ADRs should be reviewed quarterly for continued relevance
- Superseded ADRs should be linked to the new ADR for traceability

---

## 8. Versioning and File Naming

```markdown
File: decisions/adr-<NNN>-<kebab-case-title>.md

Naming rules:
- Sequential number: 001, 002, 003, etc.
- kebab-case title: short, descriptive
- Max 80 characters total for filename

Examples:
- decisions/adr-001-use-nestjs-backend.md
- decisions/adr-002-use-zustand-state-management.md
- decisions/adr-003-use-supabase-auth.md

Each ADR file must be listed in PROJECT_STATUS.md Decision Log Pointer table.
```

---

## 9. ADR Review Checklist

Before finalizing an ADR:

- [ ] Problem is clearly defined and scoped
- [ ] At least 2-3 alternatives were considered
- [ ] Chosen option has a clear rationale
- [ ] Consequences are documented (positive, negative, and neutral)
- [ ] Scoring criteria are defined and applied consistently
- [ ] Risks are identified with mitigations
- [ ] References to existing ADRs, issues, and external resources
- [ ] No contradictions with existing accepted ADRs
- [ ] Implementation plan is outlined (even at high level)
- [ ] Status is set correctly (PROPOSED for new)
- [ ] Author and date are recorded
- [ ] File named correctly and placed in decisions/ directory
- [ ] PROJECT_STATUS.md updated with new ADR entry
