import { ToolDefinition, ToolResult } from '@noctara/shared';

export interface ToolExecutionContext {
  agentId: 'NOX' | 'ARIA';
  workspaceDir: string;
  isApprovalGranted?: boolean;
}

export interface ToolAdapter {
  readonly definition: ToolDefinition;
  execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<ToolResult>;
}
