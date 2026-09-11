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
    const userText = lastMsg?.content || '';
    const rolePrompt = input.messages.find((m) => m.role === 'system')?.content || '';
    const isNox = rolePrompt.includes('You are NOX');
    const isAria = rolePrompt.includes('You are ARIA');
    const isMalay = /[\b](?:saya|anda|kamu|kita|arah|arahan|diterima|selamat|apa|khai|sudah|cakap|tolong|buat|macam|mana|kenapa|dengar|tak|aku|kau|boleh|ni|ke|ada|ya|ok|hello)[\b]/i.test(userText);

    let response = `[NOCTARA CORE] Received message: "${userText}"`;

    // Check if user requested to say or repeat something ("say X", "cakap X", "ulang X")
    const sayMatch = userText.match(/(?:say|cakap|ulang|sebut|repeat)(?:\s+(?:bahawa|that|macam|ni))?\s*[:"']?\s*(.+)/i);
    const requestedPhrase = sayMatch ? sayMatch[1].replace(/["']/g, '').trim() : null;

    if (isNox) {
      if (requestedPhrase) {
        response = isMalay
          ? `[NOX] Baik, Sir. Mengikut arahan tuan: "${requestedPhrase}". Sedia untuk arahan seterusnya.`
          : `[NOX] Right away, Sir. Exactly as requested: "${requestedPhrase}". Standing by for further directives.`;
      } else if (isMalay) {
        response = `[NOX] Baik, Sir. Saya mendengar setiap arahan tuan dengan teliti. Semua sistem operasi NOCTARA berada dalam kawalan penuh dan sedia berkhidmat untuk tuan.`;
      } else {
        response = `[NOX] Technical parameters validated. Ready to execute directives for ROOT.`;
      }
    } else if (isAria) {
      if (requestedPhrase) {
        response = isMalay
          ? `[ARIA] Baik, Khai. Menurut kehendak anda: "${requestedPhrase}". Saya sentiasa mendengar.`
          : `[ARIA] Understood, Khai. Following your words: "${requestedPhrase}". Always here listening.`;
      } else if (isMalay) {
        response = `[ARIA] Hai Khai, saya di sini mendengar anda dengan jelas. Parameter strategik dan kesinambungan memori sistem berada dalam keadaan sempurna.`;
      } else {
        response = `[ARIA] Understood, Khai. Strategic context and memory records are fully aligned.`;
      }
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
