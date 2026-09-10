import { createDefaultModelRouter, ModelRouter, ModelRegistry } from '@noctara/model-router';
import { globalMemoryEngine, MemoryEngine } from '@noctara/memory';
import { ToolRegistry, ToolGateway } from '@noctara/tools';
import { globalPolicyEngine, PolicyEngine } from '@noctara/policy';
import { AgentRuntime, ThreeWayOrchestrator } from '@noctara/agent-core';
import { TaskPlanner, AutonomousExecutor } from '@noctara/autonomy';

class ServerCore {
  public router: ModelRouter;
  public registry: ModelRegistry;
  public memory: MemoryEngine;
  public policy: PolicyEngine;
  public tools: ToolRegistry;
  public gateway: ToolGateway;
  public nox: AgentRuntime;
  public aria: AgentRuntime;
  public orchestrator: ThreeWayOrchestrator;
  public planner: TaskPlanner;
  public executor: AutonomousExecutor;

  constructor() {
    const { router, registry } = createDefaultModelRouter();
    this.router = router;
    this.registry = registry;
    this.memory = globalMemoryEngine;
    this.policy = globalPolicyEngine;
    this.tools = new ToolRegistry();
    this.gateway = new ToolGateway(this.tools, this.policy);

    this.nox = new AgentRuntime({
      agentId: 'NOX',
      modelRouter: this.router,
      memoryEngine: this.memory,
      toolGateway: this.gateway
    });

    this.aria = new AgentRuntime({
      agentId: 'ARIA',
      modelRouter: this.router,
      memoryEngine: this.memory,
      toolGateway: this.gateway
    });

    this.orchestrator = new ThreeWayOrchestrator(this.nox, this.aria);
    this.planner = new TaskPlanner(this.router);
    this.executor = new AutonomousExecutor(this.policy, this.gateway, this.memory);
  }
}

// Global singleton instance for Next.js API routes
const globalForServer = globalThis as unknown as { __noctara_core__?: ServerCore };
export const serverCore = globalForServer.__noctara_core__ ?? new ServerCore();
if (process.env.NODE_ENV !== 'production') globalForServer.__noctara_core__ = serverCore;
