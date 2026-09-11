import { describe, it, expect } from 'vitest';
import { VoiceResponseFormatter } from './formatter.js';

describe('VoiceResponseFormatter', () => {
  it('preserves full text exactly as provided', () => {
    const fullText = `# System Diagnostic
Here is the full analysis of our architecture:
\`\`\`typescript
const a = 1;
\`\`\`
We should proceed with caution.`;

    const result = VoiceResponseFormatter.formatSpokenResponse(fullText, 'NOX');
    expect(result.fullText).toBe(fullText);
  });

  it('strips markdown formatting, code blocks, tables, and raw URLs', () => {
    const raw = `[NOX]: **CRITICAL**: The deployment failed due to an error in \`packages/tools\`.
\`\`\`bash
npm run build --filter web
\`\`\`
| Service | Status |
|---|---|
| API | Down |
Visit https://noctara.luxera.world/status for details.`;

    const sanitized = VoiceResponseFormatter.sanitizeForSpeech(raw);
    expect(sanitized).not.toContain('```');
    expect(sanitized).not.toContain('|');
    expect(sanitized).not.toContain('https://');
    expect(sanitized).not.toContain('[NOX]');
    expect(sanitized).not.toContain('**CRITICAL**');
    expect(sanitized).toContain('The deployment failed due to an error in packages/tools.');
  });

  it('generates concise 1-2 sentence spoken summary bounded in length', () => {
    const longAnalysis = `Technical parameters validated. I have identified three performance bottlenecks in the event loop.
First, the database pool is exhausting available socket connections during peak ingestion.
Second, memory retention in the episodic layer is not being pruned efficiently.
Third, WebGL buffer allocations are re-instantiating on every tick instead of using persistent buffers.
I recommend patching the WebGL render loop immediately.`;

    const result = VoiceResponseFormatter.formatSpokenResponse(longAnalysis, 'NOX', 30);

    expect(result.spokenText).toBeTruthy();
    expect(result.wordCount).toBeLessThanOrEqual(32);
    expect(result.isTruncatedForSpeech).toBe(true);
    // Spoken output should contain the initial punchy sentence
    expect(result.spokenText).toContain('Technical parameters validated.');
    // Spoken output should NOT contain the detailed long list
    expect(result.spokenText).not.toContain('Third, WebGL buffer allocations');
    // Full text remains intact
    expect(result.fullText).toBe(longAnalysis);
  });

  it('provides safe fallback when input text consists only of code or non-verbal symbols', () => {
    const codeOnly = '```json\n{"status": 200}\n```';
    const resultNox = VoiceResponseFormatter.formatSpokenResponse(codeOnly, 'NOX');
    expect(resultNox.spokenText).toBe('Understood. Operational status acknowledged.');

    const resultAria = VoiceResponseFormatter.formatSpokenResponse(codeOnly, 'ARIA');
    expect(resultAria.spokenText).toBe('Understood, Khai. System standing by.');
  });
});
