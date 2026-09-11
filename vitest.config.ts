import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@noctara/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@noctara/model-router': path.resolve(__dirname, 'packages/model-router/src'),
      '@noctara/memory': path.resolve(__dirname, 'packages/memory/src'),
      '@noctara/tools': path.resolve(__dirname, 'packages/tools/src'),
      '@noctara/policy': path.resolve(__dirname, 'packages/policy/src'),
      '@noctara/agent-core': path.resolve(__dirname, 'packages/agent-core/src'),
      '@noctara/voice': path.resolve(__dirname, 'packages/voice/src'),
      '@noctara/autonomy': path.resolve(__dirname, 'packages/autonomy/src'),
      '@noctara/realtime': path.resolve(__dirname, 'packages/realtime/src'),
      '@noctara/github': path.resolve(__dirname, 'packages/github/src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'worker/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});

