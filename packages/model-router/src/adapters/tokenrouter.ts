import {
  ChatInput,
  ChatOutput,
  ChatChunk,
  ModelMetadata,
  ProviderId,
  ToolDefinition
} from '@noctara/shared';
import { ProviderAdapter } from '../types.js';

export class TokenRouterAdapter implements ProviderAdapter {
  public readonly id: ProviderId = 'tokenrouter';
  public readonly displayName = 'TokenRouter (Primary)';
  private apiKey: string | null;
  private baseUrl: string;
  private defaultModel: string;

  constructor(apiKey?: string, baseUrl = 'https://api.tokenrouter.com/v1', defaultModel = 'z-ai/glm-5.3-free') {
    this.apiKey = apiKey || process.env.TOKENROUTER_API_KEY || null;
    this.baseUrl = process.env.TOKENROUTER_BASE_URL || baseUrl;
    this.defaultModel = process.env.TOKENROUTER_DEFAULT_MODEL || defaultModel;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, error: 'TOKENROUTER_API_KEY is not configured' };
    }
    const start = Date.now();
    try {
      const url = `${this.baseUrl}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { healthy: true, latencyMs };
      }
      return { healthy: false, latencyMs, error: `TokenRouter API returned HTTP ${res.status}` };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  public getSupportedModels(): ModelMetadata[] {
    const isConf = this.isConfigured();
    return [
      {
        id: this.defaultModel,
        provider: 'tokenrouter',
        apiFormat: 'openai-chat',
        displayName: 'GLM 5.3 Free (TokenRouter)',
        capabilities: {
          supportsStreaming: true,
          supportsToolCalling: true,
          supportsStructuredOutput: true,
          supportsVision: false,
          supportsAudio: false,
          contextWindow: 131072
        },
        costTier: 'free',
        isConfigured: isConf,
        health: isConf ? 'online' : 'unconfigured'
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        provider: 'tokenrouter',
        apiFormat: 'openai-chat',
        displayName: 'Llama 3.3 70B (TokenRouter)',
        capabilities: {
          supportsStreaming: true,
          supportsToolCalling: true,
          supportsStructuredOutput: true,
          supportsVision: false,
          supportsAudio: false,
          contextWindow: 131072
        },
        costTier: 'low',
        isConfigured: isConf,
        health: isConf ? 'online' : 'unconfigured'
      }
    ];
  }

  private transformTools(tools?: ToolDefinition[]) {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((t) => ({
      type: 'function',
      function: {
        name: t.id,
        description: t.description,
        parameters: t.inputSchema
      }
    }));
  }

  public async chat(input: ChatInput): Promise<ChatOutput> {
    if (!this.isConfigured()) {
      throw new Error('TokenRouter provider is not configured with TOKENROUTER_API_KEY.');
    }

    const modelId = input.modelId || this.defaultModel;
    const url = `${this.baseUrl}/chat/completions`;

    const body: Record<string, unknown> = {
      model: modelId,
      messages: input.messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name
      })),
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 2048
    };

    const tools = this.transformTools(input.tools);
    if (tools) body.tools = tools;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`TokenRouter API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    const toolCalls = message?.tool_calls?.map((tc: any) => ({
      id: tc.id,
      toolId: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}')
    }));

    return {
      content: message?.content || '',
      toolCalls,
      modelId,
      providerId: 'tokenrouter',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0
          }
        : undefined,
      finishReason: choice?.finish_reason
    };
  }

  public async *stream(input: ChatInput): AsyncIterable<ChatChunk> {
    if (!this.isConfigured()) {
      throw new Error('TokenRouter provider is not configured with TOKENROUTER_API_KEY.');
    }

    const modelId = input.modelId || this.defaultModel;
    const url = `${this.baseUrl}/chat/completions`;

    const body: Record<string, unknown> = {
      model: modelId,
      messages: input.messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name
      })),
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 2048,
      stream: true
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`TokenRouter streaming error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error('TokenRouter streaming body is null.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') return;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield { delta };
          } catch {
            // next line
          }
        }
      }
    }
  }
}
