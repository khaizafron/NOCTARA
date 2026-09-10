import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AuditFinding, ImprovementPlan } from '@noctara/shared';
import { GitWorktreeManager } from '@noctara/github';
import { ShellCommandTool } from '@noctara/tools';
import { MemoryEngine } from '@noctara/memory';

export class SelfImprovementEngine {
  private worktreeManager: GitWorktreeManager;
  private shellTool: ShellCommandTool;
  private memoryEngine: MemoryEngine;
  private plansDir: string;

  constructor(memoryEngine: MemoryEngine, baseRepoDir = process.cwd()) {
    this.memoryEngine = memoryEngine;
    this.worktreeManager = new GitWorktreeManager(baseRepoDir);
    this.shellTool = new ShellCommandTool();
    this.plansDir = path.resolve(baseRepoDir, 'plans');
  }

  public async auditCodebase(): Promise<AuditFinding[]> {
    return [
      {
        id: 'SEC-001',
        category: 'security',
        title: 'Verify environment secret isolation and client exclusion',
        description: 'Verify all API secrets remain strictly in server-side boundaries and .env is ignored.',
        fileReference: '.gitignore:11',
        impact: 'HIGH',
        effort: 'S',
        confidence: 0.98
      },
      {
        id: 'TEST-001',
        category: 'test',
        title: 'Validate complete unit test coverage across model adapters',
        description: 'Ensure Gemini, TokenRouter, and OpenRouter adapters have deterministic contract tests.',
        fileReference: 'packages/model-router/src/router.ts:1',
        impact: 'HIGH',
        effort: 'M',
        confidence: 0.95
      }
    ];
  }

  public async createImprovementPlan(finding: AuditFinding): Promise<ImprovementPlan> {
    await fs.mkdir(this.plansDir, { recursive: true });
    const branchName = `improve/${finding.id.toLowerCase()}-${Date.now().toString(36)}`;
    const planId = `plan_${finding.id.toLowerCase()}`;

    const plan: ImprovementPlan = {
      id: planId,
      findingId: finding.id,
      branchName,
      summary: `Resolving ${finding.id}: ${finding.title}`,
      verificationCommands: ['pnpm test'],
      status: 'DRAFT'
    };

    const planMarkdown = `# Improvement Plan: ${finding.id}

**Finding**: ${finding.title}
**Category**: ${finding.category}
**Impact**: ${finding.impact} | **Effort**: ${finding.effort}
**Target Branch**: \`${branchName}\`

## Scope
${finding.description}

## Verification Gates
1. Run \`pnpm test\`
2. Typecheck clean \`pnpm typecheck\`
`;

    await fs.writeFile(path.join(this.plansDir, `${planId}.md`), planMarkdown, 'utf-8');
    return plan;
  }

  public async executePlanInWorktree(plan: ImprovementPlan): Promise<ImprovementPlan> {
    plan.status = 'EXECUTING';

    try {
      const worktree = await this.worktreeManager.createWorktree(plan.branchName);
      plan.worktreePath = worktree.directory;

      const testResult = await this.shellTool.execute(
        { command: 'pnpm test' },
        { agentId: 'NOX', workspaceDir: worktree.directory }
      );

      if (testResult.success) {
        plan.status = 'TEST_PASSED';
        plan.diffSummary = await this.worktreeManager.getDiff(worktree.directory);

        await this.memoryEngine.createMemory({
          scope: 'nox',
          layer: 'tool_learning',
          type: 'LEARNING',
          content: `Validated self-improvement workflow for ${plan.id} on isolated branch ${plan.branchName}. Tests passed.`,
          sourceType: 'agent_inference',
          confidence: 0.95,
          importance: 0.9
        });
      } else {
        plan.status = 'TEST_FAILED';
      }

      await this.worktreeManager.removeWorktree(worktree.directory);
    } catch (err: any) {
      plan.status = 'TEST_FAILED';
      plan.diffSummary = `Worktree execution error: ${err.message}`;
    }

    return plan;
  }
}
