import { ToolResult } from '@noctara/shared';
import { ToolAdapter, ToolExecutionContext } from '../types.js';

export class SystemStatusTool implements ToolAdapter {
  public readonly definition = {
    id: 'system_status',
    name: 'NOCTARA System Status',
    description: 'Retrieves current host memory, node version, uptime, and active state.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    riskClass: 'A0' as const,
    requiredPermission: 'read',
    timeoutMs: 3000
  };

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    return {
      toolCallId: `call_${Date.now()}`,
      toolId: 'system_status',
      success: true,
      output: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        agent: context.agentId
      },
      durationMs: Date.now() - start
    };
  }
}
