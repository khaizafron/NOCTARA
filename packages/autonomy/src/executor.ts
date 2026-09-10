import { TaskPlan, PlanStep, TaskStatus } from '@noctara/shared';
import { PolicyEngine } from '@noctara/policy';
import { ToolGateway } from '@noctara/tools';
import { MemoryEngine } from '@noctara/memory';

export interface ExecutionObserver {
  onStepStart?: (step: PlanStep) => void;
  onStepComplete?: (step: PlanStep) => void;
  onStepFailed?: (step: PlanStep, error: string) => void;
  onPlanComplete?: (plan: TaskPlan) => void;
}

export class AutonomousExecutor {
  private policyEngine: PolicyEngine;
  private toolGateway: ToolGateway;
  private memoryEngine: MemoryEngine;
  private workspaceDir: string;
  private activePlans: Map<string, TaskPlan> = new Map();

  constructor(
    policyEngine: PolicyEngine,
    toolGateway: ToolGateway,
    memoryEngine: MemoryEngine,
    workspaceDir = process.cwd()
  ) {
    this.policyEngine = policyEngine;
    this.toolGateway = toolGateway;
    this.memoryEngine = memoryEngine;
    this.workspaceDir = workspaceDir;
  }

  public registerPlan(plan: TaskPlan): void {
    this.activePlans.set(plan.id, plan);
  }

  public cancelPlan(planId: string, reason = 'ROOT requested cancellation'): boolean {
    const plan = this.activePlans.get(planId);
    if (!plan) return false;
    plan.status = 'CANCELLED';
    plan.error = reason;
    plan.completedAt = new Date().toISOString();
    return true;
  }

  public getPlan(planId: string): TaskPlan | undefined {
    return this.activePlans.get(planId);
  }

  public async executePlan(
    plan: TaskPlan,
    observer?: ExecutionObserver
  ): Promise<TaskPlan> {
    this.registerPlan(plan);
    plan.status = 'EXECUTING';

    for (let i = plan.currentStepIndex; i < plan.steps.length; i++) {
      if (this.policyEngine.getEmergencyStatus()) {
        plan.status = 'CANCELLED';
        plan.error = 'Execution aborted: Emergency Kill-Switch active.';
        break;
      }

      const currentStatus = this.activePlans.get(plan.id)?.status;
      if (currentStatus === 'CANCELLED') break;

      if (plan.executedToolCount >= plan.maxToolBudget) {
        plan.status = 'FAILED';
        plan.error = `Tool budget exceeded (${plan.maxToolBudget} calls max).`;
        break;
      }

      const step = plan.steps[i];
      plan.currentStepIndex = i;
      step.status = 'RUNNING';
      observer?.onStepStart?.(step);

      if (step.autonomyClass === 'A4' && !step.requiresRootApproval) {
        plan.status = 'AWAITING_APPROVAL';
        return plan;
      }

      let attempts = 0;
      let stepSuccess = false;
      let lastError = '';

      while (attempts < 3 && !stepSuccess) {
        attempts++;
        try {
          if (step.toolId) {
            plan.executedToolCount++;
            const result = await this.toolGateway.executeToolCall(
              step.toolId,
              step.arguments || {},
              {
                agentId: plan.assignedAgent,
                workspaceDir: this.workspaceDir,
                isApprovalGranted: !step.requiresRootApproval
              }
            );

            if (result.success) {
              step.output = result.output;
              stepSuccess = true;
            } else {
              lastError = result.error || 'Tool execution error';
            }
          } else {
            step.output = { processed: true, description: step.description };
            stepSuccess = true;
          }
        } catch (err: any) {
          lastError = err.message;
        }

        if (!stepSuccess && attempts < 3) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      if (stepSuccess) {
        step.status = 'COMPLETED';
        observer?.onStepComplete?.(step);
      } else {
        step.status = 'FAILED';
        step.error = lastError;
        plan.status = 'FAILED';
        plan.error = `Step ${step.order} failed after 3 attempts: ${lastError}`;
        observer?.onStepFailed?.(step, lastError);
        break;
      }
    }

    if (plan.steps.every((s) => s.status === 'COMPLETED')) {
      plan.status = 'COMPLETED';
      plan.completedAt = new Date().toISOString();

      await this.memoryEngine.createMemory({
        scope: plan.assignedAgent === 'NOX' ? 'nox' : 'aria',
        layer: 'tool_learning',
        type: 'LEARNING',
        content: `Completed goal "${plan.goal}" across ${plan.steps.length} steps with ${plan.executedToolCount} tool calls.`,
        sourceType: 'tool',
        confidence: 0.95,
        importance: 0.85
      });

      observer?.onPlanComplete?.(plan);
    }

    return plan;
  }
}
