import { ToolResult } from '@noctara/shared';
import { ToolAdapter, ToolExecutionContext } from '../types.js';

export class WebFetchTool implements ToolAdapter {
  public readonly definition = {
    id: 'web_fetch',
    name: 'Web Fetch',
    description: 'Fetches content from a URL via HTTP GET request.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'HTTP/HTTPS URL to fetch' }
      },
      required: ['url']
    },
    riskClass: 'A1' as const,
    requiredPermission: 'read',
    timeoutMs: 10000
  };

  public async execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<ToolResult> {
    const url = String(args.url || '');
    const start = Date.now();

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'web_fetch',
        success: false,
        error: 'Invalid URL scheme. Must be http:// or https://',
        durationMs: 0
      };
    }

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      const cleanSnippet = text.slice(0, 4000);

      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'web_fetch',
        success: true,
        output: {
          url,
          status: res.status,
          content: cleanSnippet
        },
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        toolCallId: `call_${Date.now()}`,
        toolId: 'web_fetch',
        success: false,
        error: `Failed to fetch URL: ${err.message}`,
        durationMs: Date.now() - start
      };
    }
  }
}
