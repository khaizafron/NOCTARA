import {
  AgentId,
  AgentState,
  ChatMessage,
  ChatOutput,
  ToolCall,
  ToolResult
} from '@noctara/shared';
import { ModelRouter } from '@noctara/model-router';
import { MemoryEngine } from '@noctara/memory';
import { ToolGateway } from '@noctara/tools';
import { NOX_SYSTEM_PROMPT, ARIA_SYSTEM_PROMPT } from './prompts.js';

export interface AgentRuntimeOptions {
  agentId: AgentId;
  modelRouter: ModelRouter;
  memoryEngine: MemoryEngine;
  toolGateway: ToolGateway;
  workspaceDir?: string;
}

export class AgentRuntime {
  public readonly agentId: AgentId;
  private modelRouter: ModelRouter;
  private memoryEngine: MemoryEngine;
  private toolGateway: ToolGateway;
  private workspaceDir: string;
  private state: AgentState = 'IDLE';
  private conversationHistory: ChatMessage[] = [];

  constructor(options: AgentRuntimeOptions) {
    this.agentId = options.agentId;
    this.modelRouter = options.modelRouter;
    this.memoryEngine = options.memoryEngine;
    this.toolGateway = options.toolGateway;
    this.workspaceDir = options.workspaceDir || process.cwd();
  }

  public getState(): AgentState {
    return this.state;
  }

  public setState(newState: AgentState): void {
    this.state = newState;
  }

  public getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  public async processMessage(
    userMessage: string,
    onChunk?: (delta: string) => void
  ): Promise<{ response: string; toolResults: ToolResult[] }> {
    this.setState('THINKING');

    // 1. Retrieve relevant memories for this agent and context
    const recalledMemories = await this.memoryEngine.retrieve({
      query: userMessage,
      scope: ['root', 'shared', this.agentId === 'NOX' ? 'nox' : 'aria'],
      limit: 3
    });

    const memoryContextBlock =
      recalledMemories.length > 0
        ? '\n[RECALLED ACTIVE MEMORIES]:\n' +
          recalledMemories.map((m) => `- [${m.type}] (${m.verificationStatus}): ${m.content}`).join('\n')
        : '';

    const basePrompt = this.agentId === 'NOX' ? NOX_SYSTEM_PROMPT : ARIA_SYSTEM_PROMPT;
    const fullSystemPrompt = `${basePrompt}\n${memoryContextBlock}`;

    // 2. Prepare conversation messages
    this.conversationHistory.push({ role: 'user', content: userMessage });

    const messagesToSend: ChatMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...this.conversationHistory.slice(-10)
    ];

    // 3. Query Model Router
    const toolResults: ToolResult[] = [];
    let initialOutput: ChatOutput;

    try {
      initialOutput = await this.modelRouter.chat({
        messages: messagesToSend
      });
    } catch (err: any) {
      this.setState('ERROR_RECOVERY');
      return {
        response: `[${this.agentId} SYSTEM ALERT]: Communication loop failed: ${err.message}`,
        toolResults: []
      };
    }

    let finalContent = initialOutput.content;

    // 4. Handle tool execution if requested by model
    if (initialOutput.toolCalls && initialOutput.toolCalls.length > 0) {
      this.setState('EXECUTING');
      for (const call of initialOutput.toolCalls) {
        const result = await this.toolGateway.executeToolCall(
          call.toolId,
          call.arguments,
          {
            agentId: this.agentId,
            workspaceDir: this.workspaceDir
          }
        );
        toolResults.push(result);

        messagesToSend.push({
          role: 'assistant',
          content: initialOutput.content,
          toolCalls: [call]
        });
        messagesToSend.push({
          role: 'tool',
          content: JSON.stringify(result.output || { error: result.error }),
          toolCallId: call.id
        });
      }

      const synthesisOutput = await this.modelRouter.chat({
        messages: messagesToSend
      });
      finalContent = synthesisOutput.content;
    }

    this.conversationHistory.push({ role: 'assistant', content: finalContent });
    this.setState('SPEAKING');

    if (onChunk) {
      onChunk(finalContent);
    }

    this.setState('IDLE');
    return { response: finalContent, toolResults };
  }
}
