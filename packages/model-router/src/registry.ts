import { ModelMetadata, ProviderId } from '@noctara/shared';
import { ProviderAdapter } from './types.js';

export class ModelRegistry {
  private providers: Map<ProviderId, ProviderAdapter> = new Map();

  public registerProvider(adapter: ProviderAdapter): void {
    this.providers.set(adapter.id, adapter);
  }

  public getProvider(id: ProviderId): ProviderAdapter | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): ProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  public getAllModels(): ModelMetadata[] {
    const models: ModelMetadata[] = [];
    for (const adapter of this.providers.values()) {
      models.push(...adapter.getSupportedModels());
    }
    return models;
  }

  public getModel(modelId: string): ModelMetadata | undefined {
    return this.getAllModels().find((m) => m.id === modelId);
  }

  public findModelsByCapability(predicate: (m: ModelMetadata) => boolean): ModelMetadata[] {
    return this.getAllModels().filter(predicate);
  }
}
