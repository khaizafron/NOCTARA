# NOCTARA — Autonomy & Self-Improvement Specification

## 1. Autonomy definition

Level 4 means an agent can independently perform a multi-step task from a desired outcome, within its authorized capability boundary.

It does NOT mean unrestricted authority.

## 2. Execution loop

```text
GOAL
 ↓
INTERPRET
 ↓
PLAN
 ↓
AUTHORIZE
 ↓
EXECUTE
 ↓
OBSERVE
 ↓
VERIFY
 ↓
RECOVER / REPLAN
 ↓
LEARN
 ↓
REPORT
```

## 3. Plan representation

Each job should persist:

- goal
- constraints
- selected agent
- plan version
- current step
- completed steps
- failed steps
- retry count
- tool budget
- execution deadline
- risk level
- artifacts
- final outcome

## 4. Autonomy classes

### A0 — conversation
No external side effects.

### A1 — research
Read/search operations.

### A2 — reversible actions
Create drafts, files, branches, temporary artifacts.

### A3 — meaningful external actions
Send messages, modify external data, publish content, etc. Requires explicit policy allowance.

### A4 — protected actions
Production deployment, destructive deletion, financial transactions, permission changes, security changes. Explicit Owner approval required by default.

## 5. Kill switch

A visible emergency stop must stop active agent execution.

The kill switch should:

- stop new tool calls
- cancel queued work where possible
- terminate active worker processes when possible
- preserve logs for post-mortem

## 6. Execution budgets

Every autonomous job should have configurable limits:

- max duration
- max tool calls
- max retries
- max provider spend estimate
- allowed tools
- allowed domains/systems
- writable directories

## 7. Self-improvement loop

The agents may identify opportunities to improve NOCTARA itself.

```text
OBSERVE LIMITATION
 ↓
FORM HYPOTHESIS
 ↓
INSPECT CODE
 ↓
CREATE BRANCH/WORKTREE
 ↓
CHANGE CODE
 ↓
TEST
 ↓
SECURITY VALIDATION
 ↓
BUILD / PREVIEW
 ↓
EVALUATE
 ↓
CREATE REVIEW ARTIFACT
 ↓
OWNER APPROVAL (protected changes)
 ↓
MERGE / DEPLOY
 ↓
MEASURE
 ↓
LEARN
```

## 8. Self-modification boundaries

Agents must not silently modify:

- authentication bypasses
- Owner identity/authority rules
- audit logging
- secret handling
- security policies
- production access controls
- protected deployment configuration

Any attempt to modify these should enter a protected review state.

## 9. Repository access

Use a GitHub App with least privilege.

Preferred flow:

1. inspect repository
2. create isolated branch/worktree
3. make changes
4. run tests
5. produce diff summary
6. open PR
7. wait for required approval
8. merge according to policy

## 10. Learning after tasks

At the end of important autonomous tasks, agents should record:

- what worked
- what failed
- root cause
- useful tool knowledge
- reusable workflow
- unresolved uncertainty

Do not store secrets or large raw tool outputs as memory.
