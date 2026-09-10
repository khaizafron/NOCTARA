import {
  ChatInput,
  ChatOutput,
  ChatChunk,
  ModelMetadata,
  ProviderId
} from '@noctara/shared';
import { ProviderAdapter } from '../types.js';

export class MockDevAdapter implements ProviderAdapter {
  public readonly id: ProviderId = 'mock';
  public readonly displayName = 'Local Deterministic Dev Mock';

  public isConfigured(): boolean {
    return true;
  }

  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    return { healthy: true, latencyMs: 5 };
  }

  public getSupportedModels(): ModelMetadata[] {
    return [
      {
        id: 'mock-local-agent',
        provider: 'mock',
        apiFormat: 'mock',
        displayName: 'Mock Dev Engine (Local)',
        capabilities: {
          supportsStreaming: true,
          supportsToolCalling: true,
          supportsStructuredOutput: true,
          supportsVision: true,
          supportsAudio: true,
          contextWindow: 128000
        },
        costTier: 'free',
        isConfigured: true,
        health: 'online'
      }
    ];
  }

  public async chat(input: ChatInput): Promise<ChatOutput> {
    const lastMsg = input.messages[input.messages.length - 1];
    const rolePrompt = input.messages.find((m) => m.role === 'system')?.content || '';
    const isNox = rolePrompt.includes('NOX');
    const isAria = rolePrompt.includes('ARIA');

    let response = `[NOCTARA CORE] Received message: "${lastMsg?.content}"`;

    if (isNox) {
      response = `[NOX] Technical parameters validated. Goal analyzed. Systems standing by for operational directive.`;
    } else if (isAria) {
      response = `[ARIA] Understood, Khai. I have contextualized your intent and aligned our long-term memory records.`;
    }

    if (input.tools && input.tools.length > 0 && lastMsg?.content.toLowerCase().includes('search')) {
      return {
        content: response,
        toolCalls: [
          {
            id: `mock_call_${Date.now()}`,
            toolId: 'web_search',
            arguments: { query: 'NOCTARA Autonomous Systems Architecture' }
          }
        ],
        modelId: 'mock-local-agent',
        providerId: 'mock',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
      };
    }

    return {
      content: response,
      modelId: 'mock-local-agent',
      providerId: 'mock',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    };
  }

  public async *stream(input: ChatInput): AsyncIterable<ChatChunk> {
    const result = await this.chat(input);
    const words = result.content.split(' ');
    for (const word of words) {
      await new Promise((r) => setTimeout(r, 20));
      yield { delta: `${word} ` };
    }
  }
}
