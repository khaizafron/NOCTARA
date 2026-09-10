import { AutonomyClass, PolicyCheckResult } from '@noctara/shared';

export interface PolicyEvaluationContext {
  toolId?: string;
  actionType: string;
  targetPath?: string;
  command?: string;
  parameters?: Record<string, unknown>;
  agentId?: 'NOX' | 'ARIA';
  isSelfImprovement?: boolean;
}

export class PolicyEngine {
  private isEmergencyStopped = false;
  private readonly protectedPaths = [
    'packages/policy',
    'packages/policy/',
    '.env',
    '.env.local',
    '.env.production',
    '.git',
    '.git/',
    'supabase/migrations/00000000000000_init_security.sql',
    'apps/web/src/lib/auth.ts'
  ];

  public activateEmergencyStop(reason = 'ROOT Emergency Kill-Switch Triggered'): void {
    this.isEmergencyStopped = true;
    console.warn(`[POLICY CRITICAL] Kill-switch activated: ${reason}`);
  }

  public deactivateEmergencyStop(): void {
    this.isEmergencyStopped = false;
    console.info('[POLICY] Emergency stop deactivated by ROOT.');
  }

  public getEmergencyStatus(): boolean {
    return this.isEmergencyStopped;
  }

  public isProtectedPath(path: string): boolean {
    const normalized = path.replace(/\\/g, '/').toLowerCase();
    return this.protectedPaths.some((p) => {
      const target = p.toLowerCase();
      return normalized === target || normalized.startsWith(target) || normalized.includes(`/${target}`);
    });
  }

  public evaluateAction(context: PolicyEvaluationContext): PolicyCheckResult {
    // 1. Emergency Kill Switch check
    if (this.isEmergencyStopped) {
      return {
        allowed: false,
        autonomyClass: 'A4',
        requiresRootApproval: true,
        reason: 'Execution blocked: Global Emergency Kill-Switch is ACTIVE.'
      };
    }

    // 2. Protected Files and Paths check
    if (context.targetPath && this.isProtectedPath(context.targetPath)) {
      return {
        allowed: false,
        autonomyClass: 'A4',
        requiresRootApproval: true,
        reason: `Target path '${context.targetPath}' is protected from autonomous alteration.`
      };
    }

    // 3. Dangerous / Protected shell commands
    if (context.command) {
      const lowerCmd = context.command.toLowerCase();
      const forbiddenPatterns = [
        'rm -rf /',
        'format c:',
        'del /f /s /q c:',
        'git push --force origin main',
        'drop table',
        'shutdown'
      ];
      if (forbiddenPatterns.some((pattern) => lowerCmd.includes(pattern))) {
        return {
          allowed: false,
          autonomyClass: 'A4',
          requiresRootApproval: true,
          reason: 'Command contains potentially catastrophic operations and is strictly barred.'
        };
      }
    }

    // 4. Check toolId directly if provided
    if (context.toolId === 'system_status' || context.toolId === 'calculator' || context.toolId === 'time') {
      return { allowed: true, autonomyClass: 'A0', requiresRootApproval: false };
    }
    if (context.toolId === 'web_search' || context.toolId === 'web_fetch' || context.toolId === 'file_read') {
      return { allowed: true, autonomyClass: 'A1', requiresRootApproval: false };
    }
    if (context.toolId === 'file_write' || context.toolId === 'shell_command') {
      return { allowed: true, autonomyClass: 'A2', requiresRootApproval: false };
    }

    // 5. Map Action Types to Autonomy Classes
    const action = context.actionType.toLowerCase();

    // A0: Conversation & Internal Reads
    if (
      action.includes('read_memory') ||
      action.includes('conversation') ||
      action.includes('internal_inspect') ||
      action === 'a0' ||
      action.includes('status')
    ) {
      return { allowed: true, autonomyClass: 'A0', requiresRootApproval: false };
    }

    // A1: Research, Web Read, File Read, Search
    if (
      action.includes('search') ||
      action.includes('fetch') ||
      action.includes('read_file') ||
      action.includes('git_status') ||
      action.includes('git_log') ||
      action === 'a1'
    ) {
      return { allowed: true, autonomyClass: 'A1', requiresRootApproval: false };
    }

    // A2: Reversible local actions
    if (
      action.includes('create_worktree') ||
      action.includes('write_test') ||
      action.includes('run_test') ||
      action.includes('create_branch') ||
      action.includes('write_scratch') ||
      action === 'a2'
    ) {
      return { allowed: true, autonomyClass: 'A2', requiresRootApproval: false };
    }

    // A3: Meaningful external actions
    if (
      action.includes('create_pr') ||
      action.includes('external_api_call') ||
      action.includes('save_memory') ||
      action === 'a3'
    ) {
      return { allowed: true, autonomyClass: 'A3', requiresRootApproval: false };
    }

    // A4: Protected actions
    if (
      action.includes('merge_main') ||
      action.includes('deploy') ||
      action.includes('delete_data') ||
      action.includes('modify_secret') ||
      action.includes('policy_update') ||
      action === 'a4'
    ) {
      return {
        allowed: false,
        autonomyClass: 'A4',
        requiresRootApproval: true,
        reason: 'Protected action requires explicit ROOT approval before execution.'
      };
    }

    return {
      allowed: true,
      autonomyClass: 'A2',
      requiresRootApproval: false,
      reason: 'Standard authorized operational action.'
    };
  }
}

export const globalPolicyEngine = new PolicyEngine();
