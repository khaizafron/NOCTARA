import { describe, it, expect } from 'vitest';
import { SelfImprovementEngine } from './self_improvement.js';
import { MemoryEngine } from '@noctara/memory';

describe('Self-Improvement Workflow', () => {
  it('audits codebase and identifies findings', async () => {
    const memory = new MemoryEngine();
    const engine = new SelfImprovementEngine(memory);

    const findings = await engine.auditCodebase();
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe('security');
  });

  it('creates an actionable improvement plan artifact', async () => {
    const memory = new MemoryEngine();
    const engine = new SelfImprovementEngine(memory);

    const findings = await engine.auditCodebase();
    const plan = await engine.createImprovementPlan(findings[0]);

    expect(plan.id).toBeDefined();
    expect(plan.branchName).toContain('improve/sec-001');
    expect(plan.verificationCommands).toContain('pnpm test');
    expect(plan.status).toBe('DRAFT');
  });
});
