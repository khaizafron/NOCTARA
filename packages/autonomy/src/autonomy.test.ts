import { describe, it, expect } from 'vitest';
import { TaskPlanner } from './planner.js';
import { AutonomousExecutor } from './executor.js';
import { createDefaultModelRouter } from '@noctara/model-router';
import { PolicyEngine } from '@noctara/policy';
import { ToolRegistry, ToolGateway } from '@noctara/tools';
import { MemoryEngine } from '@noctara/memory';

describe('Level-4 Autonomy & Task Execution Loop', () => {
  const { router } = createDefaultModelRouter();
  const policy = new PolicyEngine();
  const tools = new ToolRegistry();
  const gateway = new ToolGateway(tools, policy);
  const memory = new MemoryEngine();

  it('deconstructs goal into plan with autonomy classes', async () => {
    const planner = new TaskPlanner(router);
    const plan = await planner.createPlan('Test system status and update memory', 'NOX');
    expect(plan.steps.length).toBeGreaterThanOrEqual(2);
    expect(plan.assignedAgent).toBe('NOX');
    expect(plan.status).toBe('PLANNING');
  });

  it('executes autonomous plan and records Layer G learning', async () => {
    const planner = new TaskPlanner(router);
    const executor = new AutonomousExecutor(policy, gateway, memory);

    const plan = await planner.createPlan('General computation task', 'NOX');
    const completedPlan = await executor.executePlan(plan);

    expect(completedPlan.status).toBe('COMPLETED');
    expect(completedPlan.completedAt).toBeDefined();

    const learnings = await memory.retrieve({
      query: 'Completed goal',
      layers: ['tool_learning']
    });
    expect(learnings.length).toBeGreaterThan(0);
  });

  it('supports emergency cancellation during execution', async () => {
    const planner = new TaskPlanner(router);
    const executor = new AutonomousExecutor(policy, gateway, memory);

    const plan = await planner.createPlan('Long operation to cancel', 'NOX');
    executor.registerPlan(plan);
    const cancelSuccess = executor.cancelPlan(plan.id, 'ROOT test cancellation');
    expect(cancelSuccess).toBe(true);

    const cancelledPlan = executor.getPlan(plan.id);
    expect(cancelledPlan?.status).toBe('CANCELLED');
  });
});
