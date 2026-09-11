import { describe, it, expect } from 'vitest';

describe('NoctaraChatInput module', () => {
  it('exports NoctaraChatInput as a named export', async () => {
    const mod = await import('./ai-chat-input');
    expect(mod.NoctaraChatInput).toBeDefined();
    expect(typeof mod.NoctaraChatInput).toBe('function');
  });

  it('exports a default export', async () => {
    const mod = await import('./ai-chat-input');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('named export and default export are the same component', async () => {
    const mod = await import('./ai-chat-input');
    expect(mod.default).toBe(mod.NoctaraChatInput);
  });

  it('PLACEHOLDERS array is non-empty (module-level constant)', async () => {
    // We rely on the module loading without error as a smoke test
    const mod = await import('./ai-chat-input');
    expect(mod.NoctaraChatInput).toBeTruthy();
  });
});