export * from './types.js';
export * from './registry.js';
export * from './router.js';
export * from './adapters/gemini.js';
export * from './adapters/tokenrouter.js';
export * from './adapters/openrouter.js';
export * from './adapters/mock.js';

import { ModelRegistry } from './registry.js';
import { ModelRouter } from './router.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { TokenRouterAdapter } from './adapters/tokenrouter.js';
import { OpenRouterAdapter } from './adapters/openrouter.js';
import { MockDevAdapter } from './adapters/mock.js';

export function createDefaultModelRouter(): { router: ModelRouter; registry: ModelRegistry } {
  const registry = new ModelRegistry();
  registry.registerProvider(new GeminiAdapter());
  registry.registerProvider(new TokenRouterAdapter());
  registry.registerProvider(new OpenRouterAdapter());
  registry.registerProvider(new MockDevAdapter());

  const router = new ModelRouter(registry);
  return { router, registry };
}
