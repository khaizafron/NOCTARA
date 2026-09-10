# NOCTARA — Product Requirements Document

**Status:** Draft v0.1
**Owner:** Khai (Root)
**Product:** NOCTARA
**Entities:** ARIA, NOX
**Access model:** Single-user, private by default
**Primary platform:** Web application

---

## 1. Product thesis

NOCTARA is a personal AI world rather than a conventional assistant or SaaS dashboard.

The Owner enters a persistent digital environment where two distinct AI entities — ARIA and NOX — can talk with the Owner by voice or text, remember meaningful history, use external tools, collaborate and disagree, perform multi-step tasks autonomously, and propose or implement improvements to their own software through a controlled engineering loop.

The experience should feel like entering an intelligent command chamber from a futuristic science-fiction system: alive, spatial, responsive, cinematic, and personal.

The product should not feel like:

- a CRM
- a corporate dashboard
- a generic chatbot
- a productivity SaaS product
- a static 3D avatar demo

---

## 2. Product goals

### 2.1 Primary goals

1. Give the Owner a persistent place to talk to two AI entities in real time.
2. Make both entities meaningfully different in personality and role.
3. Give both entities durable, queryable long-term memory of the Owner and the shared world.
4. Enable Level-4 task autonomy within explicit permissions and trust boundaries.
5. Make external tools and model providers pluggable so the system can use many APIs and free/low-cost providers.
6. Give the entities a controlled ability to inspect, improve, test, and propose changes to their own codebase.
7. Make the UI feel like a living futuristic world rather than an enterprise application.
8. Keep the system private and single-owner-first.

### 2.2 Secondary goals

- Support multimodal interaction.
- Allow the Owner to create custom memories, rules, identities, projects, and tools.
- Provide transparent visibility into what agents are doing, why they are doing it, and what tools are active.
- Minimize recurring infrastructure costs during early development.

---

## 3. Non-goals for v0.1

- Multi-tenant SaaS.
- Public community or social network.
- Marketplace for agents.
- Selling access to ARIA or NOX.
- Fully unrestricted self-modification.
- Silent production deployment by agents.
- Autonomous financial transactions.
- Autonomous deletion of Owner data.
- Replacing all existing productivity software.

---

## 4. User model

There is one privileged human identity:

### Owner / Root

The Owner is the only intended user of the system.

The Owner can:

- talk to either or both agents
- modify agent personalities
- edit or delete memories
- grant/revoke tool permissions
- connect providers and API keys
- create tasks
- inspect active plans and execution
- approve or reject code changes
- promote agent versions
- reset or archive agent state

The system must assume that authentication is security-critical.

---

## 5. Core experience

### 5.1 Entering NOCTARA

The home screen opens as a dark spatial environment with a central system core and two agent presences.

The Owner is recognized and the system displays a minimal status state such as:

- Owner recognized
- ARIA online
- NOX online
- memory integrity/state
- active tools
- current autonomy state

The interface should avoid conventional dashboards wherever possible.

### 5.2 Three-way conversation

The fundamental interaction is:

**Owner + ARIA + NOX**

The Owner may address one agent directly or ask the room a question.

The orchestration layer decides whether:

- ARIA responds
- NOX responds
- both respond sequentially
- one agent challenges the other
- the agents debate
- the system asks the Owner for clarification

### 5.3 Voice-first interaction

The primary mode should feel conversational and hands-free.

Requirements:

- microphone input
- streaming or low-latency speech interaction
- distinct voices for ARIA and NOX
- interruption handling
- speech activity indicators
- transcript fallback
- mute / push-to-talk fallback
- graceful degradation when a voice provider is unavailable

### 5.4 Memory-aware conversation

Agents should use long-term memory when relevant, but should not dump memory into prompts indiscriminately.

Example behavior:

> Owner: “What did we decide about that product last month?”

Agent retrieves relevant decisions and events and answers with dates or provenance when available.

### 5.5 Autonomous task execution

The Owner may give an outcome rather than a step-by-step instruction.

Example:

> “Research this market, compare the strongest options, save the evidence, and tell me what you think.”

The agent should:

1. interpret the outcome
2. create a plan
3. choose tools
4. execute steps
5. inspect outputs
6. recover from recoverable failures
7. record useful memory
8. return a concise result and evidence

### 5.6 Agent disagreement

Disagreement is a feature, not a bug.

ARIA and NOX should be able to:

- challenge assumptions
- identify uncertainty
- offer competing approaches
- request a second opinion from the other agent
- revise conclusions after evidence

Neither agent should be a blind yes-machine.

---

## 6. Agent product definition

### ARIA

Role: companion, context keeper, strategist, reflective intelligence.

Primary behaviors:

- deeply contextualize the Owner
- remember important history
- summarize and connect ideas
- surface continuity across projects
- help the Owner think
- maintain emotional/interactional warmth without pretending to be human

ARIA should be proactive when context strongly suggests usefulness, but must avoid intrusive behavior.

### NOX

Role: executor, challenger, systems intelligence, technical operator.

Primary behaviors:

- turn goals into executable plans
- challenge weak assumptions
- operate tools
- run technical workflows
- inspect repositories
- test implementations
- propose improvements
- execute approved engineering workflows

NOX should be direct, evidence-oriented, and action-focused.

### Shared identity

Both agents belong to NOCTARA and share the same Owner authority hierarchy, but maintain distinct internal state and role memory.

---

## 7. Memory requirements

Memory is a first-class product capability.

The system must store and retrieve at least:

- identity facts
- stable preferences
- behavioral patterns
- project context
- important decisions
- significant events
- learned facts from uploaded sources
- tool history and outcomes
- agent observations
- corrections from the Owner
- unresolved questions

Every durable memory should track:

- memory type
- source
- timestamp
- confidence
- provenance
- last verification
- created_by
- scope
- sensitivity classification

Agents must be able to correct, supersede, archive, or forget memories.

---

## 8. Tool system requirements

NOCTARA uses an adapter-based tool registry.

Tools may include:

- web search and browsing
- browser automation
- file storage
- document parsing
- image generation / analysis
- code execution
- GitHub
- email
- calendar
- maps
- weather
- finance/data APIs
- model providers
- voice providers
- custom external APIs

Every tool must declare:

- name
- description
- input schema
- output schema
- required permission
- risk level
- authentication method
- rate limits
- timeout
- audit behavior

---

## 9. Model provider requirements

NOCTARA must not be coupled to a single LLM vendor.

Provider adapters should support a mix of:

- Google/Gemini models
- OpenRouter models
- other OpenAI-compatible providers
- future local/self-hosted models where useful

A model router should select providers based on task type, capability, availability, latency, and cost.

API keys must be stored as secrets and never injected into arbitrary model-visible text.

---

## 10. Autonomy requirements

NOCTARA supports Level-4 autonomy:

**Goal → Plan → Execute → Verify → Recover → Learn → Report**

Agents can perform multi-step tasks without asking at each intermediate step when permissions allow it.

However:

- system authority cannot be rewritten by the agent
- agent permissions are explicit
- critical changes require a protected approval path
- secrets cannot be exfiltrated through normal tool calls
- high-risk actions require explicit Owner approval

---

## 11. Self-improvement requirements

Agents should be able to improve their software through a controlled engineering loop.

Required loop:

1. detect limitation/problem
2. form hypothesis
3. inspect relevant code
4. create isolated branch/worktree
5. modify code
6. run tests
7. run security checks
8. run application-level validation
9. summarize change
10. open pull request or equivalent review artifact
11. wait for Owner approval for protected changes
12. merge/deploy according to policy
13. record outcome in memory

Self-improvement must be auditable.

---

## 12. UI/UX principles

### Visual language

- dark, cinematic, high-tech
- spatial rather than dashboard-like
- restrained neon/glow
- holographic panels
- animated system core
- agent presence and motion
- reactive lighting/particles
- subtle scan lines / telemetry only where useful
- minimal chrome
- typography that feels like a futuristic computer interface

### Interaction principles

- voice is first-class
- text is always available
- system state should be visible at a glance
- actions should feel like operating a system, not filling a form
- advanced controls can appear as contextual overlays
- avoid enterprise terminology such as “workspace”, “pipeline”, “seat”, “subscription”

---

## 13. Privacy and security requirements

- single-user authentication
- private-by-default data
- encrypted transport
- server-side secret storage
- least-privilege tool access
- agent action audit trail
- sandboxed code execution
- isolated Git branches/worktrees
- protected main/production branches
- explicit deletion and memory controls
- no agent access to raw secrets unless a tool explicitly brokers access

---

## 14. Observability

The Owner should be able to inspect:

- current agent state
- current plan
- current step
- tools invoked
- tool outcomes
- errors and retries
- active model/provider
- latency
- token usage where available
- memory writes
- code changes
- approval status

This can be shown as a hidden/expandable “system view” rather than a corporate dashboard.

---

## 15. Success criteria for v0.1

The MVP is considered successful when the Owner can:

1. enter NOCTARA securely
2. talk to ARIA and NOX by voice
3. have a natural three-way text/voice conversation
4. maintain durable long-term memory across sessions
5. upload reference material and let agents retrieve it later
6. grant tools and external APIs
7. give a multi-step goal and see autonomous completion
8. see what agents are doing
9. stop or pause execution
10. let NOX inspect and modify the private repo on a branch
11. run tests automatically
12. review a proposed change
13. preserve agent state across redeployments

---

## 16. Key risks

### Risk: hallucinated memory
Mitigation: provenance, confidence, verification state, explicit memory types.

### Risk: runaway autonomous actions
Mitigation: scoped permissions, action policies, kill switch, execution budgets, protected actions.

### Risk: unsafe self-modification
Mitigation: branch isolation, tests, sandboxing, protected files, PR/review gate.

### Risk: provider outages/quota exhaustion
Mitigation: provider abstraction, routing, fallback models, graceful voice degradation.

### Risk: UI becomes a gimmick
Mitigation: spatial UI must expose real operational state and improve interaction rather than merely decorate it.

---

## 17. Product north star

NOCTARA should eventually feel like this:

> The Owner walks into a private digital command chamber. ARIA and NOX are already there. They remember what happened before. They understand what the Owner is trying to achieve. They can think independently, challenge each other, operate the tools available to them, and execute useful work. When they discover limitations, they can improve the system through a controlled evolution loop. The Owner remains the root authority.

That is the product.
