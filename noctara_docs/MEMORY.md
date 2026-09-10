# NOCTARA — Memory Architecture

## 1. Objective

Build a long-term memory system that helps ARIA and NOX understand the Owner over months/years without treating raw conversation history as truth.

## 2. Memory layers

### Layer A — Working memory

Current conversation, current task, active tool outputs.

### Layer B — Episodic memory

Significant events and interactions.

### Layer C — Semantic memory

Stable facts and knowledge extracted from conversations/files.

### Layer D — Identity memory

Who the Owner is, preferences, goals, constraints, communication style.

### Layer E — Behavioral pattern memory

Higher-level observations about how the Owner tends to make decisions or work. These must be labeled as inferences, not facts.

### Layer F — Project memory

State and history per project.

### Layer G — Tool/agent learning memory

What an agent learned about a tool, workflow, or prior failure.

## 3. Memory record

Suggested schema:

```ts
interface Memory {
  id: string;
  scope: 'owner' | 'shared' | 'aria' | 'nox' | 'project';
  type: 'fact' | 'preference' | 'goal' | 'event' | 'decision' | 'pattern' | 'knowledge' | 'lesson';
  content: string;
  sourceType: 'conversation' | 'file' | 'tool' | 'owner' | 'agent_inference';
  sourceRef?: string;
  confidence: number;
  importance: number;
  sensitivity: 'normal' | 'private' | 'high';
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt?: string;
  supersedesId?: string;
  status: 'active' | 'superseded' | 'archived' | 'deleted';
  embedding?: number[];
}
```

## 4. Memory write policy

Not every message becomes a memory.

A memory candidate should be written when it has meaningful future value, for example:

- a durable preference
- a decision
- a long-term goal
- a recurring constraint
- an important event
- a project milestone
- a verified learned fact
- a correction to a prior memory

## 5. Consolidation

Periodically summarize recent activity into candidate memories.

The consolidation process should:

1. collect recent events
2. identify durable candidates
3. deduplicate
4. compare with existing memories
5. merge or supersede where appropriate
6. assign confidence
7. preserve source references
8. write only high-value durable memories

## 6. Retrieval scoring

Candidate retrieval score can combine:

```text
score = semantic_similarity
      + recency_weight
      + importance_weight
      + project_match
      + confidence_weight
      + owner_verification_weight
```

Exact weighting should be tunable.

## 7. Memory truth model

Every memory must be categorized clearly.

### Fact
Directly supported.

### Preference
Owner expressed preference.

### Decision
Owner made/accepted a decision.

### Inference
Agent-derived pattern; must not be presented as fact without qualification.

### Unknown
No reliable memory exists.

## 8. Correction and forgetting

Owner must be able to say:

- “Forget that.”
- “That is wrong.”
- “Update this.”
- “Never remember this.”

Corrections should create an auditable update rather than simply disappearing without trace unless deletion is explicitly required.

## 9. Database recommendation

Initial source of truth:

**Supabase Postgres + pgvector.**

Store structured memory and embeddings together. Add a dedicated vector service only when scale or query requirements justify it.
