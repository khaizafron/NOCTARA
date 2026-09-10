import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ToolResult } from '@noctara/shared';
import { ToolAdapter, ToolExecutionContext } from '../types.js';

export class FileReadTool implements ToolAdapter {
  public readonly definition = {
    id: 'file_read',
    name: 'File Read',
    description: 'Reads contents of a file within the permitted workspace directory.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Relative path to file' }
      },
      required: ['filePath']
    },
    riskClass: 'A1' as const,
    requiredPermission: 'read',
    timeoutMs: 5000
  };

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<ToolResult> {
    const rawPath = String(args.filePath || '');
    const start = Date.now();
    const resolvedPath = path.resolve(context.workspaceDir, rawPath);

    if (!resolvedPath.startsWith(path.resolve(context.workspaceDir))) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'file_read',
        success: false,
        error: 'Access denied: Attempted directory traversal outside workspace boundary.',
        durationMs: 0
      };
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'file_read',
        success: true,
        output: { filePath: rawPath, content },
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'file_read',
        success: false,
        error: `Failed to read file '${rawPath}': ${err.message}`,
        durationMs: Date.now() - start
      };
    }
  }
}

export class FileWriteTool implements ToolAdapter {
  public readonly definition = {
    id: 'file_write',
    name: 'File Write',
    description: 'Writes code or text content to a file inside the permitted workspace or worktree.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Relative path to target file' },
        content: { type: 'string', description: 'File content to write' }
      },
      required: ['filePath', 'content']
    },
    riskClass: 'A2' as const,
    requiredPermission: 'write',
    timeoutMs: 5000
  };

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<ToolResult> {
    const rawPath = String(args.filePath || '');
    const content = String(args.content || '');
    const start = Date.now();
    const resolvedPath = path.resolve(context.workspaceDir, rawPath);

    if (!resolvedPath.startsWith(path.resolve(context.workspaceDir))) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'file_write',
        success: false,
        error: 'Access denied: Cannot write outside workspace directory.',
        durationMs: 0
      };
    }

    try {
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
      await fs.writeFile(resolvedPath, content, 'utf-8');
      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'file_write',
        success: true,
        output: { filePath: rawPath, bytesWritten: Buffer.byteLength(content) },
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'file_write',
        success: false,
        error: `Failed to write file '${rawPath}': ${err.message}`,
        durationMs: Date.now() - start
      };
    }
  }
}
