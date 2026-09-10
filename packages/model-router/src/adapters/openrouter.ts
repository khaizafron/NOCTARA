import {
  ChatInput,
  ChatOutput,
  ChatChunk,
  ModelMetadata,
  ProviderId
} from '@noctara/shared';
import { ProviderAdapter } from '../types.js';

export class OpenRouterAdapter implements ProviderAdapter {
  public readonly id: ProviderId = 'openrouter';
  public readonly displayName = 'OpenRouter (Fallback)';
  private apiKey: string | null;
  private baseUrl: string;
  private defaultModel: string;

  constructor(apiKey?: string, baseUrl = 'https://openrouter.ai/api/v1', defaultModel = 'anthropic/claude-3.5-sonnet') {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || null;
    this.baseUrl = process.env.OPENROUTER_BASE_URL || baseUrl;
    this.defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || defaultModel;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, error: 'OPENROUTER_API_KEY is not configured' };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/auth/key`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { healthy: true, latencyMs };
      }
      return { healthy: false, latencyMs, error: `OpenRouter returned HTTP ${res.status}` };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  public getSupportedModels(): ModelMetadata[] {
    const isConf = this.isConfigured();
    return [
      {
        id: this.defaultModel,
        provider: 'openrouter',
        apiFormat: 'openai-chat',
        displayName: 'Claude 3.5 Sonnet (OpenRouter)',
        capabilities: {
          supportsStreaming: true,
          supportsToolCalling: true,
          supportsStructuredOutput: true,
          supportsVision: true,
          supportsAudio: false,
          contextWindow: 200000
        },
        costTier: 'high',
        isConfigured: isConf,
        health: isConf ? 'online' : 'unconfigured'
      },
      {
        id: 'deepseek/deepseek-r1',
        provider: 'openrouter',
        apiFormat: 'openai-chat',
        displayName: 'DeepSeek R1 (OpenRouter)',
        capabilities: {
          supportsStreaming: true,
          supportsToolCalling: true,
          supportsStructuredOutput: true,
          supportsVision: false,
          supportsAudio: false,
          contextWindow: 64000
        },
        costTier: 'low',
        isConfigured: isConf,
        health: isConf ? 'online' : 'unconfigured'
      }
    ];
  }

  public async chat(input: ChatInput): Promise<ChatOutput> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter provider is not configured with OPENROUTER_API_KEY.');
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

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://noctara.ai',
        'X-Title': 'NOCTARA Autonomous AI'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    return {
      content: message?.content || '',
      modelId,
      providerId: 'openrouter',
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
      throw new Error('OpenRouter provider is not configured with OPENROUTER_API_KEY.');
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
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://noctara.ai',
        'X-Title': 'NOCTARA Autonomous AI'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter streaming error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error('OpenRouter streaming body is null.');

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
