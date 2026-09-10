import { exec } from 'node:child_process';
import { ToolResult } from '@noctara/shared';
import { ToolAdapter, ToolExecutionContext } from '../types.js';

export class ShellCommandTool implements ToolAdapter {
  public readonly definition = {
    id: 'shell_command',
    name: 'Shell Command Execution',
    description: 'Executes a sandboxed shell command inside the current worktree/workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute (e.g. pnpm test, git status)' }
      },
      required: ['command']
    },
    riskClass: 'A2' as const,
    requiredPermission: 'execute',
    timeoutMs: 30000
  };

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<ToolResult> {
    const command = String(args.command || '');
    const start = Date.now();

    return new Promise((resolve) => {
      exec(
        command,
        {
          cwd: context.workspaceDir,
          timeout: 25000,
          maxBuffer: 1024 * 1024 * 2
        },
        (error, stdout, stderr) => {
          const durationMs = Date.now() - start;
          if (error) {
            resolve({
              toolCallId: `call_${Date.now()}`,
              toolId: 'shell_command',
              success: false,
              error: error.message,
              output: { stdout: stdout?.toString(), stderr: stderr?.toString(), exitCode: error.code },
              durationMs
            });
          } else {
            resolve({
              toolCallId: `call_${Date.now()}`,
              toolId: 'shell_command',
              success: true,
              output: { stdout: stdout?.toString(), stderr: stderr?.toString(), exitCode: 0 },
              durationMs
            });
          }
        }
      );
    });
  }
}
