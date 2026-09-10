import { describe, it, expect } from 'vitest';
import { VoiceEngine } from './engine.js';
import { NOX_VOICE_PROFILE, ARIA_VOICE_PROFILE } from './profiles.js';

describe('Voice Engine & Barge-In', () => {
  it('defines distinct voice profiles for NOX and ARIA', () => {
    expect(NOX_VOICE_PROFILE.gender).toBe('male');
    expect(ARIA_VOICE_PROFILE.gender).toBe('female');
    expect(NOX_VOICE_PROFILE.pitch).toBeLessThan(ARIA_VOICE_PROFILE.pitch);
  });

  it('handles barge-in by interrupting speech and returning interrupted agent', async () => {
    const engine = new VoiceEngine();
    // Start speak simulation
    const promise = engine.speakText('NOX', 'Starting long operational report...');
    expect(engine.getIsSpeaking()).toBe(true);
    expect(engine.getCurrentAgent()).toBe('NOX');

    // ROOT interrupts
    const interruptResult = engine.triggerBargeIn();
    expect(interruptResult.interruptedAgent).toBe('NOX');
    expect(engine.getIsSpeaking()).toBe(false);
    expect(engine.getCurrentAgent()).toBeUndefined();
  });
});
