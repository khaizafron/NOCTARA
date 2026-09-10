import { describe, it, expect } from 'vitest';
import { ModelRegistry } from './registry.js';
import { ModelRouter } from './router.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { TokenRouterAdapter } from './adapters/tokenrouter.js';
import { OpenRouterAdapter } from './adapters/openrouter.js';
import { MockDevAdapter } from './adapters/mock.js';

describe('Model Router & Provider Adapters', () => {
  it('Gemini adapter exposes capabilities and unconfigured health check when key missing', async () => {
    const gemini = new GeminiAdapter('');
    expect(gemini.isConfigured()).toBe(false);
    const health = await gemini.healthCheck();
    expect(health.healthy).toBe(false);
    expect(health.error).toContain('GEMINI_API_KEY');

    const models = gemini.getSupportedModels();
    expect(models.length).toBeGreaterThanOrEqual(2);
    expect(models[0].capabilities.supportsStreaming).toBe(true);
  });

  it('TokenRouter adapter exposes dynamic API format and metadata', async () => {
    const tokenRouter = new TokenRouterAdapter('', 'https://api.tokenrouter.com/v1', 'z-ai/glm-5.3-free');
    expect(tokenRouter.isConfigured()).toBe(false);
    const models = tokenRouter.getSupportedModels();
    expect(models[0].apiFormat).toBe('openai-chat');
    expect(models[0].id).toBe('z-ai/glm-5.3-free');
    expect(models[0].capabilities.supportsToolCalling).toBe(true);
  });

  it('OpenRouter adapter provides fallback models', async () => {
    const openrouter = new OpenRouterAdapter('');
    expect(openrouter.isConfigured()).toBe(false);
    const models = openrouter.getSupportedModels();
    expect(models.some((m) => m.id.includes('claude'))).toBe(true);
  });

  it('falls back to local Mock adapter when external keys are not provided', async () => {
    const registry = new ModelRegistry();
    registry.registerProvider(new GeminiAdapter(''));
    registry.registerProvider(new TokenRouterAdapter(''));
    registry.registerProvider(new OpenRouterAdapter(''));
    registry.registerProvider(new MockDevAdapter());

    const router = new ModelRouter(registry);
    const route = router.resolveRoute({ messages: [{ role: 'user', content: 'Hello' }] });
    expect(route.providerId).toBe('mock');

    const output = await router.chat({ messages: [{ role: 'user', content: 'Hello' }] });
    expect(output.content).toContain('Received message');
    expect(output.providerId).toBe('mock');
  });

  it('classifies task types for routing decisions', () => {
    const registry = new ModelRegistry();
    registry.registerProvider(new MockDevAdapter());
    const router = new ModelRouter(registry);

    const codeTask = router.classifyTask({ messages: [{ role: 'user', content: 'Debug this git commit and run tests' }] });
    expect(codeTask).toBe('coding');

    const reasoningTask = router.classifyTask({ messages: [{ role: 'user', content: 'Why did this architectural pattern fail?' }] });
    expect(reasoningTask).toBe('reasoning');
  });
});
