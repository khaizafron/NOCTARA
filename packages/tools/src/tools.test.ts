import { describe, it, expect } from 'vitest';
import { ToolRegistry } from './registry.js';
import { ToolGateway } from './gateway.js';
import { PolicyEngine } from '@noctara/policy';

describe('Tool Registry & Gateway', () => {
  it('registers all standard built-in tools', () => {
    const registry = new ToolRegistry();
    const defs = registry.getAllDefinitions();
    expect(defs.some((t) => t.id === 'web_search')).toBe(true);
    expect(defs.some((t) => t.id === 'web_fetch')).toBe(true);
    expect(defs.some((t) => t.id === 'file_read')).toBe(true);
    expect(defs.some((t) => t.id === 'file_write')).toBe(true);
    expect(defs.some((t) => t.id === 'shell_command')).toBe(true);
    expect(defs.some((t) => t.id === 'system_status')).toBe(true);
  });

  it('blocks path traversal outside workspace', async () => {
    const registry = new ToolRegistry();
    const policy = new PolicyEngine();
    const gateway = new ToolGateway(registry, policy);

    const result = await gateway.executeToolCall(
      'file_read',
      { filePath: '../../../../windows/system32/cmd.exe' },
      { agentId: 'NOX', workspaceDir: process.cwd() }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('traversal');
  });

  it('executes system_status tool safely', async () => {
    const registry = new ToolRegistry();
    const policy = new PolicyEngine();
    const gateway = new ToolGateway(registry, policy);

    const result = await gateway.executeToolCall(
      'system_status',
      {},
      { agentId: 'NOX', workspaceDir: process.cwd() }
    );

    if (!result.success) {
      console.error('System status error:', result.error);
    }
    expect(result.success).toBe(true);
    expect((result.output as any).nodeVersion).toBeDefined();
  });
});
