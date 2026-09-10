import {
  ChatInput,
  ChatOutput,
  ChatChunk,
  ProviderId
} from '@noctara/shared';
import { ModelRegistry } from './registry.js';
import { RoutingDecision, TaskType, ProviderAdapter } from './types.js';

export class ModelRouter {
  private registry: ModelRegistry;
  private priorityChain: ProviderId[] = ['gemini', 'tokenrouter', 'openrouter', 'mock'];

  constructor(registry: ModelRegistry) {
    this.registry = registry;
  }

  public classifyTask(input: ChatInput): TaskType {
    const text = input.messages.map((m) => m.content).join(' ').toLowerCase();
    if (text.includes('code') || text.includes('function') || text.includes('debug') || text.includes('git') || text.includes('test')) {
      return 'coding';
    }
    if (text.includes('why') || text.includes('analyze') || text.includes('architect') || text.includes('compare') || text.includes('strategy')) {
      return 'reasoning';
    }
    return 'conversation';
  }

  public resolveRoute(input: ChatInput, taskType?: TaskType): RoutingDecision {
    const task = taskType || this.classifyTask(input);
    const configuredProviders = this.priorityChain
      .map((id) => this.registry.getProvider(id))
      .filter((p): p is ProviderAdapter => Boolean(p && p.isConfigured()));

    if (configuredProviders.length === 0) {
      // Fallback to mock adapter
      const mock = this.registry.getProvider('mock')!;
      return {
        providerId: 'mock',
        modelId: 'mock-local-agent',
        reason: 'No external providers configured. Operating in local dev mode.',
        fallbackChain: []
      };
    }

    const primary = configuredProviders[0];
    const models = primary.getSupportedModels();
    let selectedModel = models[0]?.id || 'default';

    if (task === 'reasoning') {
      const reasoningModel = models.find((m) => m.id.includes('pro') || m.id.includes('r1') || m.id.includes('sonnet'));
      if (reasoningModel) selectedModel = reasoningModel.id;
    }

    const fallbackChain = configuredProviders.slice(1).map((p) => ({
      providerId: p.id,
      modelId: p.getSupportedModels()[0]?.id || 'default'
    }));

    return {
      providerId: primary.id,
      modelId: input.modelId || selectedModel,
      reason: `Primary provider '${primary.displayName}' selected for '${task}' task.`,
      fallbackChain
    };
  }

  public async chat(input: ChatInput, taskType?: TaskType): Promise<ChatOutput> {
    const route = this.resolveRoute(input, taskType);
    const providersToTry = [
      { providerId: route.providerId, modelId: route.modelId },
      ...route.fallbackChain
    ];

    let lastError: any = null;

    for (const target of providersToTry) {
      const provider = this.registry.getProvider(target.providerId);
      if (!provider) continue;

      try {
        const output = await provider.chat({
          ...input,
          modelId: target.modelId
        });
        return output;
      } catch (err: any) {
        lastError = err;
        console.warn(`[MODEL ROUTER WARNING] Provider '${target.providerId}' failed (${err.message}). Attempting fallback...`);
      }
    }

    throw new Error(`All configured model providers failed. Last error: ${lastError?.message || 'Unknown'}`);
  }

  public async *stream(input: ChatInput, taskType?: TaskType): AsyncIterable<ChatChunk> {
    const route = this.resolveRoute(input, taskType);
    const provider = this.registry.getProvider(route.providerId);

    if (!provider) {
      throw new Error(`Resolved provider '${route.providerId}' is not registered.`);
    }

    try {
      yield* provider.stream({ ...input, modelId: route.modelId });
    } catch (err: any) {
      console.warn(`[MODEL ROUTER] Streaming failed on '${route.providerId}'. Falling back to non-streaming output.`);
      const output = await this.chat(input, taskType);
      yield { delta: output.content };
    }
  }
}
