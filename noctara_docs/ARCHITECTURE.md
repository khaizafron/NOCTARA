# NOCTARA — Technical Architecture

## 1. Architecture principles

1. Single-owner first.
2. Provider-agnostic.
3. Stateless web edge + durable agent state.
4. Long-running execution handled by workers, not request/response web functions.
5. Memory is structured + semantic, not just chat history.
6. Tools are explicit capabilities with permissions.
7. Agent execution is resumable and observable.
8. Self-modification is isolated and auditable.
9. UI is a spatial presentation over a real event/state system.

## 2. Recommended stack

### Frontend

- Next.js
- React
- TypeScript
- Web Audio / Media APIs
- WebSocket or WebTransport where appropriate
- Vercel for initial deployment

### Edge / realtime

- Cloudflare Workers
- Cloudflare Durable Objects for per-room/per-session coordination and realtime state
- Cloudflare Queues for asynchronous jobs where appropriate

### Primary database

- Supabase Postgres
- pgvector for embeddings

### Cache / ephemeral state

- Upstash Redis, optional

### Object storage

- Supabase Storage initially; abstraction layer should allow later migration

### Autonomous execution

- isolated Linux worker/VM
- Docker/container sandbox
- persistent job store in Postgres
- Git worktrees/branches for repository tasks

### Repository integration

- GitHub App with minimal permissions

## 3. Logical system

```text
[Browser]
   |
   | HTTPS / WebSocket
   v
[Vercel / Next.js]
   |
   v
[Cloudflare Edge]
   |
   +---- [Durable Object: NOCTARA ROOM]
   |
   +---- [Queue / Job Dispatch]
   |
   v
[Agent Orchestrator]
   |
   +---- ARIA Runtime
   +---- NOX Runtime
   |
   +---- Planner
   +---- Model Router
   +---- Memory Engine
   +---- Tool Registry
   +---- Policy Engine
   |
   +--------------------+
   |                    |
   v                    v
[Supabase]          [Execution Worker]
 Postgres            Browser / Code / Git
 pgvector
 Storage
```

## 4. Agent runtime state

Each agent runtime maintains:

- identity
- current conversation context
- current plan
- active task
- active tool calls
- short-term working memory
- long-term memory retrieval context
- autonomy budget
- provider/model state
- failure/recovery state

Durable state must survive process restart.

## 5. Event model

Use events as the backbone for observability and agent coordination.

Example events:

- `owner.message.created`
- `owner.voice.started`
- `owner.voice.stopped`
- `agent.response.started`
- `agent.response.completed`
- `agent.interruption.detected`
- `agent.plan.created`
- `agent.step.started`
- `agent.step.completed`
- `tool.call.started`
- `tool.call.completed`
- `tool.call.failed`
- `memory.retrieved`
- `memory.written`
- `memory.corrected`
- `repo.branch.created`
- `repo.change.tested`
- `repo.pr.created`
- `owner.approval.required`
- `owner.approval.granted`
- `system.kill_switch`

## 6. Conversation orchestration

The conversation orchestrator receives each Owner turn and produces a response plan.

Signals may include:

- direct address
- topic relevance
- confidence
- disagreement likelihood
- current task owner
- urgency
- context continuity
- whether the other agent has materially useful counter-evidence

The orchestrator should avoid having both agents speak every turn.

## 7. Model routing

Define a common provider interface:

```ts
interface ModelProvider {
  chat(input: ChatInput): Promise<ChatOutput>;
  stream?(input: ChatInput): AsyncIterable<ChatChunk>;
  embed?(input: string[]): Promise<number[][]>;
  transcribe?(audio: Uint8Array): Promise<Transcript>;
  synthesize?(input: TTSInput): Promise<AudioOutput>;
}
```

The router can choose a provider/model by:

- task class
- required capabilities
- current availability
- estimated cost
- latency budget
- context size
- fallback priority

## 8. Voice architecture

```text
Microphone
  ↓
Capture / VAD
  ↓
Realtime voice provider OR STT
  ↓
Conversation Orchestrator
  ↓
Agent Runtime
  ↓
TTS / realtime audio model
  ↓
Browser Audio
```

Voice must support interruption. When the Owner begins talking while an agent speaks, the playback should stop or duck and the new turn should take priority.

## 9. Memory architecture

Use Postgres as source of truth.

Memory retrieval combines:

- structured filters
- semantic similarity
- recency
- importance
- project scope
- confidence
- owner verification

Do not use a vector database as the only memory store.

## 10. Tool architecture

Tool calls should be brokered through a tool gateway.

```text
Agent
  ↓
Policy Engine
  ↓
Tool Gateway
  ↓
Tool Adapter
  ↓
External System
```

The model never receives an unrestricted secret environment.

## 11. Autonomous jobs

Long-running tasks become durable jobs.

```text
Goal
 ↓
Job created
 ↓
Plan persisted
 ↓
Step persisted
 ↓
Worker executes
 ↓
Result persisted
 ↓
Next step selected
```

If a worker dies, another worker can resume from persisted state.

## 12. Code-agent architecture

Repository work runs in an isolated workspace:

```text
NOX
 ↓
Repo manager
 ↓
Clone/worktree
 ↓
Sandbox
 ↓
Edit
 ↓
Test
 ↓
Static/security checks
 ↓
Preview
 ↓
PR
```

Production credentials must not be available in ordinary development sandboxes.

## 13. Recommended repository layout

```text
noctara/
├─ apps/
│  └─ web/
├─ packages/
│  ├─ agent-core/
│  ├─ agent-prompts/
│  ├─ memory/
│  ├─ model-router/
│  ├─ voice/
│  ├─ tools/
│  ├─ policy/
│  ├─ events/
│  └─ shared/
├─ workers/
│  ├─ agent-worker/
│  └─ code-worker/
├─ supabase/
│  ├─ migrations/
│  └─ seed/
├─ docs/
├─ scripts/
├─ tests/
├─ .env.example
├─ package.json
└─ README.md
```
