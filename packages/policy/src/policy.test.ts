import { describe, it, expect } from 'vitest';
import { PolicyEngine } from './index.js';

describe('PolicyEngine Verification', () => {
  it('enforces A0 for internal memory and conversation actions', () => {
    const policy = new PolicyEngine();
    const result = policy.evaluateAction({ actionType: 'read_memory' });
    expect(result.allowed).toBe(true);
    expect(result.autonomyClass).toBe('A0');
    expect(result.requiresRootApproval).toBe(false);
  });

  it('enforces A1 for read-only search and fetch operations', () => {
    const policy = new PolicyEngine();
    const result = policy.evaluateAction({ actionType: 'search' });
    expect(result.allowed).toBe(true);
    expect(result.autonomyClass).toBe('A1');
    expect(result.requiresRootApproval).toBe(false);
  });

  it('enforces A2 for reversible worktree tests and drafts', () => {
    const policy = new PolicyEngine();
    const result = policy.evaluateAction({ actionType: 'create_worktree' });
    expect(result.allowed).toBe(true);
    expect(result.autonomyClass).toBe('A2');
    expect(result.requiresRootApproval).toBe(false);
  });

  it('enforces A3 for external API calls and PR creation', () => {
    const policy = new PolicyEngine();
    const result = policy.evaluateAction({ actionType: 'create_pr' });
    expect(result.allowed).toBe(true);
    expect(result.autonomyClass).toBe('A3');
    expect(result.requiresRootApproval).toBe(false);
  });

  it('enforces A4 requiring explicit ROOT approval for protected actions', () => {
    const policy = new PolicyEngine();
    const result = policy.evaluateAction({ actionType: 'deploy' });
    expect(result.allowed).toBe(false);
    expect(result.autonomyClass).toBe('A4');
    expect(result.requiresRootApproval).toBe(true);
  });

  it('blocks modification to protected paths (policy, secrets, .env)', () => {
    const policy = new PolicyEngine();
    const result = policy.evaluateAction({
      actionType: 'file_write',
      targetPath: 'packages/policy/src/index.ts'
    });
    expect(result.allowed).toBe(false);
    expect(result.requiresRootApproval).toBe(true);
    expect(result.reason).toContain('protected');
  });

  it('blocks all operations when Emergency Kill-Switch is active', () => {
    const policy = new PolicyEngine();
    policy.activateEmergencyStop();
    expect(policy.getEmergencyStatus()).toBe(true);

    const result = policy.evaluateAction({ actionType: 'search' });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Emergency Kill-Switch');

    policy.deactivateEmergencyStop();
    expect(policy.getEmergencyStatus()).toBe(false);
  });
});
