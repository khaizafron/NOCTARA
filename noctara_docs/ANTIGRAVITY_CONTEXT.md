# NOCTARA — Antigravity Build Context

## Read first

Before changing code, read these files in order:

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `AGENTS.md`
4. `MEMORY.md`
5. `AUTONOMY.md`
6. `TOOLS.md`
7. `SECURITY.md`
8. `UI_UX.md`
9. `ROADMAP.md`

## Non-negotiable product constraints

- NOCTARA is single-user and private.
- Owner = Khai / Root.
- Two agents: ARIA and NOX.
- Both have voice.
- Three-way conversation is a core feature.
- Long-term memory is a core feature.
- Level-4 autonomy is a core feature.
- Tool/API provider abstraction is mandatory.
- Self-improvement is a core product direction.
- Self-improvement must be isolated, testable, auditable, and protected.
- UI must feel like a futuristic personal AI world, not a corporate SaaS dashboard.
- Never expose raw API secrets to the model.
- Never claim a task was completed without evidence.
- Prefer real operational state over decorative animation.

## Engineering preference

Start with a thin vertical slice that proves the core loop:

Owner enters room → speaks → orchestrator selects agent → agent responds by voice → memory is retrieved/written → tool call can be executed → result is shown → autonomous job can continue → result is recorded.

Only after this loop is reliable should the project expand the visual world.

## Coding conventions

- TypeScript everywhere feasible.
- Strong schemas at system boundaries.
- Explicit error handling.
- Small modules with clear ownership.
- No provider-specific logic inside agent business logic.
- No secrets in frontend code.
- Tests for policy, memory, orchestration, and tool permissions.
- Prefer boring reliable infrastructure under the futuristic UI.
