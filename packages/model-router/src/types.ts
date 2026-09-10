import {
  ChatInput,
  ChatOutput,
  ChatChunk,
  ProviderId,
  ModelMetadata
} from '@noctara/shared';

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly displayName: string;
  isConfigured(): boolean;
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }>;
  chat(input: ChatInput): Promise<ChatOutput>;
  stream(input: ChatInput): AsyncIterable<ChatChunk>;
  getSupportedModels(): ModelMetadata[];
}

export type TaskType = 'conversation' | 'reasoning' | 'coding' | 'multimodal' | 'summarization';

export interface RoutingDecision {
  providerId: ProviderId;
  modelId: string;
  reason: string;
  fallbackChain: { providerId: ProviderId; modelId: string }[];
}
