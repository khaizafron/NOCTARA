import { AgentId, TaskPlan, PlanStep } from '@noctara/shared';
import { ModelRouter } from '@noctara/model-router';

export class TaskPlanner {
  private modelRouter: ModelRouter;

  constructor(modelRouter: ModelRouter) {
    this.modelRouter = modelRouter;
  }

  public async createPlan(goal: string, assignedAgent: AgentId = 'NOX'): Promise<TaskPlan> {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const steps: PlanStep[] = [];

    if (goal.toLowerCase().includes('research') || goal.toLowerCase().includes('search')) {
      steps.push({
        id: 'step_1',
        order: 1,
        description: 'Search documentation and external sources for reference data',
        actionType: 'search',
        toolId: 'web_search',
        arguments: { query: goal },
        status: 'PENDING',
        autonomyClass: 'A1',
        requiresRootApproval: false
      });
      steps.push({
        id: 'step_2',
        order: 2,
        description: 'Synthesize findings and compile summary artifact',
        actionType: 'synthesize',
        status: 'PENDING',
        autonomyClass: 'A0',
        requiresRootApproval: false
      });
    } else if (goal.toLowerCase().includes('test') || goal.toLowerCase().includes('code')) {
      steps.push({
        id: 'step_1',
        order: 1,
        description: 'Inspect current workspace state and recent commits',
        actionType: 'read_file',
        toolId: 'file_read',
        arguments: { filePath: 'package.json' },
        status: 'PENDING',
        autonomyClass: 'A1',
        requiresRootApproval: false
      });
      steps.push({
        id: 'step_2',
        order: 2,
        description: 'Execute test suite verification gate',
        actionType: 'run_test',
        toolId: 'shell_command',
        arguments: { command: 'pnpm test' },
        status: 'PENDING',
        autonomyClass: 'A2',
        requiresRootApproval: false
      });
      steps.push({
        id: 'step_3',
        order: 3,
        description: 'Record test outcomes and update memory',
        actionType: 'save_memory',
        status: 'PENDING',
        autonomyClass: 'A0',
        requiresRootApproval: false
      });
    } else {
      steps.push({
        id: 'step_1',
        order: 1,
        description: `Analyze operational parameters for: ${goal}`,
        actionType: 'internal_inspect',
        status: 'PENDING',
        autonomyClass: 'A0',
        requiresRootApproval: false
      });
      steps.push({
        id: 'step_2',
        order: 2,
        description: `Execute core operation for: ${goal}`,
        actionType: 'execute_core',
        status: 'PENDING',
        autonomyClass: 'A2',
        requiresRootApproval: false
      });
    }

    return {
      id: planId,
      goal,
      assignedAgent,
      steps,
      currentStepIndex: 0,
      status: 'PLANNING',
      maxToolBudget: 15,
      executedToolCount: 0,
      startedAt: now
    };
  }
}
