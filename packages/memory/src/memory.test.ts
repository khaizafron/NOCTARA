import { describe, it, expect } from 'vitest';
import { MemoryEngine } from './engine.js';
import { computeMemoryScore } from './scoring.js';

describe('7-Layer Memory Engine', () => {
  it('initializes baseline identity facts for ROOT, NOX, and ARIA', () => {
    const memory = new MemoryEngine();
    const all = memory.getAllMemories();
    expect(all.length).toBeGreaterThanOrEqual(3);
    const rootFact = all.find((m) => m.scope === 'root' && m.layer === 'identity');
    expect(rootFact).toBeDefined();
    expect(rootFact?.content).toContain('Khai');
    expect(rootFact?.type).toBe('FACT');
    expect(rootFact?.verificationStatus).toBe('VERIFIED');
  });

  it('creates memories with explicit layer, type, and confidence', async () => {
    const memory = new MemoryEngine();
    const record = await memory.createMemory({
      scope: 'root',
      layer: 'semantic',
      type: 'PREFERENCE',
      content: 'Prefers dark high-density spatial HUD over standard dashboards.',
      sourceType: 'owner_statement',
      confidence: 1.0,
      importance: 0.95
    });

    expect(record.id).toBeDefined();
    expect(record.type).toBe('PREFERENCE');
    expect(record.layer).toBe('semantic');
  });

  it('corrects memory by marking old record CORRECTED and linking supersedesId', async () => {
    const memory = new MemoryEngine();
    const original = await memory.createMemory({
      scope: 'root',
      layer: 'project',
      type: 'FACT',
      content: 'NOCTARA port is 3000.',
      sourceType: 'owner_statement'
    });

    const corrected = await memory.correctMemory(original.id, 'NOCTARA port is 4000.', 'Port changed by ROOT');
    expect(corrected.content).toBe('NOCTARA port is 4000.');
    expect(corrected.supersedesId).toBe(original.id);
    expect(corrected.verificationStatus).toBe('VERIFIED');

    const all = memory.getAllMemories();
    const oldFound = all.find((m) => m.id === original.id);
    expect(oldFound?.verificationStatus).toBe('CORRECTED');

    // Retrieval should exclude the corrected/outdated record
    const retrieved = await memory.retrieve({ query: 'NOCTARA port' });
    expect(retrieved.some((m) => m.id === original.id)).toBe(false);
    expect(retrieved.some((m) => m.id === corrected.id)).toBe(true);
  });

  it('calculates composite scores with verification and recency weights', () => {
    const record = {
      id: 'test_1',
      scope: 'root' as const,
      layer: 'semantic' as const,
      type: 'FACT' as const,
      content: 'Important architectural invariant',
      sourceType: 'owner_statement' as const,
      confidence: 1.0,
      importance: 1.0,
      verificationStatus: 'VERIFIED' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const score = computeMemoryScore(record, 1.0);
    expect(score).toBeGreaterThan(0.9);
  });
});
