# NOCTARA — Build Roadmap

## Phase 0 — Foundation

- monorepo
- authentication for Owner
- environment/config system
- Supabase database
- event model
- basic model provider abstraction

Acceptance:
Owner can sign in and load the NOCTARA room.

## Phase 1 — The Room

- spatial UI
- ARIA presence
- NOX presence
- text conversation
- distinct agent prompts/personality
- three-way orchestration

Acceptance:
Owner can have a coherent text conversation with both agents.

## Phase 2 — Voice

- microphone capture
- speech recognition/realtime audio
- distinct TTS voices
- interruption handling
- transcript fallback
- voice session state

Acceptance:
Owner can speak naturally to the room and hear the appropriate agent respond.

## Phase 3 — Memory

- memory tables
- embeddings
- semantic retrieval
- memory extraction
- consolidation
- correction/forget flows
- project memory

Acceptance:
Agents can recall meaningful information across sessions with provenance.

## Phase 4 — Tools

- tool registry
- policy engine
- web/search
- file tools
- browser automation
- code execution
- initial external APIs

Acceptance:
Owner can grant a tool and agents can use it safely within permission scope.

## Phase 5 — Level-4 Autonomy

- durable jobs
- planner
- executor
- retries
- recovery
- job budgets
- kill switch
- progress UI

Acceptance:
Owner can give a multi-step outcome and the system can complete it without per-step supervision within allowed scope.

## Phase 6 — Digital Body

- browser control
- filesystem access through sandbox
- richer tool surfaces
- agent movement between spatial work areas
- live execution visualization

Acceptance:
Agent behavior visibly corresponds to real tool execution.

## Phase 7 — Self-Improvement

- GitHub App
- branch/worktree manager
- code sandbox
- automated test runner
- security checks
- PR generation
- protected merge flow
- learning from changes

Acceptance:
NOX can identify a safe code improvement, implement it on an isolated branch, test it, and create a review artifact.

## Phase 8 — Persistent World

- richer 3D environment
- persistent objects
- agent workspace areas
- project rooms
- ambient memory visualization
- world-level events

Acceptance:
NOCTARA feels like a persistent place, not just a chat page.

## Phase 9 — Advanced Evolution

- model routing optimization
- tool discovery/health management
- autonomous maintenance jobs
- evaluation harness
- regression detection
- capability benchmarking

Acceptance:
NOCTARA can continuously improve reliability within protected boundaries.

## Important build rule

Do not start by polishing the 3D world for weeks.

Build the real agent loop first, then make the world reveal what the agents are actually doing.
