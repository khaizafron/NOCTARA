import { describe, it, expect } from 'vitest';
import { createDefaultModelRouter } from '@noctara/model-router';
import { MemoryEngine } from '@noctara/memory';
import { ToolRegistry, ToolGateway } from '@noctara/tools';
import { PolicyEngine } from '@noctara/policy';
import { AgentRuntime } from './runtime.js';
import { ThreeWayOrchestrator } from './orchestrator.js';

describe('Agent Core & Three-Way Orchestrator', () => {
  const { router } = createDefaultModelRouter();
  const memory = new MemoryEngine();
  const policy = new PolicyEngine();
  const tools = new ToolRegistry();
  const gateway = new ToolGateway(tools, policy);

  const nox = new AgentRuntime({
    agentId: 'NOX',
    modelRouter: router,
    memoryEngine: memory,
    toolGateway: gateway
  });

  const aria = new AgentRuntime({
    agentId: 'ARIA',
    modelRouter: router,
    memoryEngine: memory,
    toolGateway: gateway
  });

  const orchestrator = new ThreeWayOrchestrator(nox, aria);

  it('routes directly to NOX when directly addressed', () => {
    const decision = orchestrator.decideTurn('NOX, verify the database schema.');
    expect(decision).toBe('NOX');
  });

  it('routes directly to ARIA when directly addressed', () => {
    const decision = orchestrator.decideTurn('ARIA, what was our strategy from yesterday?');
    expect(decision).toBe('ARIA');
  });

  it('routes to BOTH when input asks for combined perspective', () => {
    const decision = orchestrator.decideTurn('What do you both think about this architecture?');
    expect(decision).toBe('BOTH');
  });

  it('routes to DEBATE when disagreement or debate is explicitly prompted', () => {
    const decision = orchestrator.decideTurn('Debate the merits of local vs cloud LLMs.');
    expect(decision).toBe('DEBATE');
  });

  it('executes three-way conversation turn and produces dialogue items', async () => {
    const turns = await orchestrator.executeConversation('NOX, check system status.');
    expect(turns.length).toBe(1);
    expect(turns[0].speaker).toBe('NOX');
    expect(turns[0].content).toContain('[NOX]');
  });

  it('executes bounded debate without infinite loops', async () => {
    const turns = await orchestrator.executeConversation('Debate: Monorepo vs multirepo.');
    expect(turns.length).toBe(3); // Round 1 NOX, Round 1 ARIA, Round 2 NOX
    expect(turns[0].speaker).toBe('NOX');
    expect(turns[1].speaker).toBe('ARIA');
    expect(turns[2].speaker).toBe('NOX');
  });

  it('regression: guarantees distinct responses, unique IDs, and spokenText when BOTH agents speak', async () => {
    const turns = await orchestrator.executeConversation('What do you both think about system performance?');
    expect(turns.length).toBe(2);

    const [first, second] = turns;
    // Distinct speakers
    expect(first.speaker).not.toBe(second.speaker);

    // Unique turn IDs
    expect(first.id).toBeTruthy();
    expect(second.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);

    // Shared group turnId
    expect(first.turnId).toBe(second.turnId);

    // Distinct contents (regression: never duplicate response under two agents)
    expect(first.content.trim()).not.toBe(second.content.trim());

    // Both have spoken summaries generated
    expect(first.spokenText).toBeTruthy();
    expect(second.spokenText).toBeTruthy();
    expect(first.spokenText.length).toBeLessThanOrEqual(first.content.length + 50);
  });

  it('alternates between NOX and ARIA for unaddressed general conversational messages', async () => {
    // Force NOX first
    await orchestrator.executeConversation('NOX, status check.');

    // Next general message should route to ARIA
    const t1 = await orchestrator.executeConversation('Hello, apa khabar harini?');
    expect(t1.length).toBeGreaterThanOrEqual(1);
    expect(t1[0].speaker).toBe('ARIA');

    // Subsequent general message should route to NOX
    const t2 = await orchestrator.executeConversation('Bagus, apa perancangan kita?');
    expect(t2.length).toBeGreaterThanOrEqual(1);
    expect(t2[0].speaker).toBe('NOX');
  });
});

