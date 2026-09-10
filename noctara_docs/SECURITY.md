# NOCTARA — Security & Trust Model

## 1. Security goal

NOCTARA is powerful because its agents can act. Therefore security is a core product property, not a later enhancement.

## 2. Trust hierarchy

```text
OWNER / ROOT
    ↓
NOCTARA POLICY ENGINE
    ↓
AGENTS
    ↓
TOOL GATEWAY
    ↓
EXTERNAL SYSTEMS
```

## 3. High-risk boundaries

Protect:

- authentication
- owner identity
- secret storage
- production credentials
- deployment
- destructive actions
- billing/financial actions
- security policy
- self-modification of authority rules

## 4. Sandboxing

Any agent-generated code should run in an isolated environment with:

- restricted filesystem
- limited network access
- CPU/memory/time limits
- no production secrets
- disposable workspace where possible

## 5. Prompt injection

Treat retrieved webpages, files, emails, and other external content as untrusted data.

Do not allow content retrieved from external sources to silently redefine system policy or tool permissions.

## 6. Audit log

Log at minimum:

- who/what initiated an action
- agent
- goal/job id
- tool
- arguments (redacted where sensitive)
- result status
- timestamp
- approval state

## 7. Owner controls

The Owner must be able to:

- revoke a tool
- revoke an API/provider
- stop all agents
- terminate a job
- invalidate sessions
- reset agent state
- inspect recent actions

## 8. Data minimization

Do not store raw sensitive data forever by default.

Use retention policies for:

- tool outputs
- audio recordings
- temporary artifacts
- execution logs

Durable memories should store useful summaries/references rather than unnecessary raw payloads.

## 9. Protected files

The application should maintain a protected-file policy for the codebase. Examples:

- owner authority policy
- security policy
- auth implementation
- secret handling
- deployment credentials
- audit logger

A self-improving agent cannot silently bypass these protections.

## 10. Recovery

Backups and rollback are mandatory before allowing autonomous production modifications.
