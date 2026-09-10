import { ToolResult } from '@noctara/shared';
import { PolicyEngine } from '@noctara/policy';
import { ToolRegistry } from './registry.js';
import { ToolExecutionContext } from './types.js';

export class ToolGateway {
  private registry: ToolRegistry;
  private policyEngine: PolicyEngine;

  constructor(registry: ToolRegistry, policyEngine: PolicyEngine) {
    this.registry = registry;
    this.policyEngine = policyEngine;
  }

  public async executeToolCall(
    toolId: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const tool = this.registry.getTool(toolId);
    if (!tool) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId,
        success: false,
        error: `Tool '${toolId}' is not registered in ToolRegistry.`,
        durationMs: 0
      };
    }

    const policyDecision = this.policyEngine.evaluateAction({
      toolId,
      actionType: tool.definition.riskClass,
      command: typeof args.command === 'string' ? args.command : undefined,
      targetPath: typeof args.filePath === 'string' ? args.filePath : undefined,
      agentId: context.agentId
    });

    if (!policyDecision.allowed) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId,
        success: false,
        error: `Policy Denied: ${policyDecision.reason}`,
        durationMs: 0
      };
    }

    if (policyDecision.requiresRootApproval && !context.isApprovalGranted) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId,
        success: false,
        error: `Awaiting Root Approval: Action class ${policyDecision.autonomyClass} requires explicit approval.`,
        durationMs: 0
      };
    }

    try {
      const result = await tool.execute(args, context);
      return result;
    } catch (err: any) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId,
        success: false,
        error: `Tool execution failed: ${err.message}`,
        durationMs: 0
      };
    }
  }
}
