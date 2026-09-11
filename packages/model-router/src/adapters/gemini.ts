import {
  ChatInput,
  ChatOutput,
  ChatChunk,
  ModelMetadata,
  ProviderId,
  ToolDefinition
} from '@noctara/shared';
import { ProviderAdapter } from '../types.js';

export class GeminiAdapter implements ProviderAdapter {
  public readonly id: ProviderId = 'gemini';
  public readonly displayName = 'Google Gemini (Secondary / Fallback)';
  private apiKey: string | null;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = 'gemini-2.5-flash') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || null;
    this.defaultModel = process.env.GEMINI_DEFAULT_MODEL || defaultModel;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, error: 'GEMINI_API_KEY is not configured' };
    }
    const start = Date.now();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}?key=${this.apiKey}`;
      const res = await fetch(url);
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { healthy: true, latencyMs };
      }
      return { healthy: false, latencyMs, error: `Gemini API returned HTTP ${res.status}` };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  public getSupportedModels(): ModelMetadata[] {
    const isConf = this.isConfigured();
    return [
      {
        id: process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash',
        provider: 'gemini',
        apiFormat: 'gemini-native',
        displayName: 'Gemini 2.5 Flash',
        capabilities: {
          supportsStreaming: true,
          supportsToolCalling: true,
          supportsStructuredOutput: true,
          supportsVision: true,
          supportsAudio: true,
          contextWindow: 1048576
        },
        costTier: 'low',
        isConfigured: isConf,
        health: isConf ? 'online' : 'unconfigured'
      },
      {
        id: process.env.GEMINI_REASONING_MODEL || 'gemini-2.5-pro',
        provider: 'gemini',
        apiFormat: 'gemini-native',
        displayName: 'Gemini 2.5 Pro',
        capabilities: {
          supportsStreaming: true,
          supportsToolCalling: true,
          supportsStructuredOutput: true,
          supportsVision: true,
          supportsAudio: true,
          contextWindow: 2097152
        },
        costTier: 'standard',
        isConfigured: isConf,
        health: isConf ? 'online' : 'unconfigured'
      }
    ];
  }

  private transformTools(tools?: ToolDefinition[]) {
    if (!tools || tools.length === 0) return undefined;
    return [
      {
        function_declarations: tools.map((t) => ({
          name: t.id,
          description: t.description,
          parameters: t.inputSchema
        }))
      }
    ];
  }

  public async chat(input: ChatInput): Promise<ChatOutput> {
    if (!this.isConfigured()) {
      throw new Error('Gemini provider is not configured with GEMINI_API_KEY.');
    }

    const modelId = input.modelId || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`;

    const contents = input.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const tools = this.transformTools(input.tools);

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: input.temperature ?? 0.7,
        maxOutputTokens: input.maxTokens ?? 2048
      }
    };
    if (tools) body.tools = tools;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.find((p: any) => p.text)?.text || '';
    const functionCallPart = candidate?.content?.parts?.find((p: any) => p.functionCall);

    const toolCalls = functionCallPart
      ? [
          {
            id: `call_${Date.now()}`,
            toolId: functionCallPart.functionCall.name,
            arguments: functionCallPart.functionCall.args || {}
          }
        ]
      : undefined;

    return {
      content: textPart,
      toolCalls,
      modelId,
      providerId: 'gemini',
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0
          }
        : undefined,
      finishReason: candidate?.finishReason
    };
  }

  public async *stream(input: ChatInput): AsyncIterable<ChatChunk> {
    if (!this.isConfigured()) {
      throw new Error('Gemini provider is not configured with GEMINI_API_KEY.');
    }
    const modelId = input.modelId || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const contents = input.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const tools = this.transformTools(input.tools);

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: input.temperature ?? 0.7,
        maxOutputTokens: input.maxTokens ?? 2048
      }
    };
    if (tools) body.tools = tools;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini streaming error (${res.status}): ${errText}`);
    }

    if (!res.body) {
      throw new Error('Gemini streaming response body is null.');
    }

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
            const cand = parsed.candidates?.[0];
            const textPart = cand?.content?.parts?.find((p: any) => p.text)?.text;
            if (textPart) {
              yield { delta: textPart };
            }
          } catch {
            // next line
          }
        }
      }
    }
  }
}
