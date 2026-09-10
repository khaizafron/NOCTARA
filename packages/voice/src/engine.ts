import { AgentId } from '@noctara/shared';
import { TTSProvider } from './types.js';
import { ElevenLabsTTSAdapter } from './adapters/elevenlabs.js';
import { NOX_VOICE_PROFILE, ARIA_VOICE_PROFILE } from './profiles.js';

export class VoiceEngine {
  private ttsProvider: TTSProvider;
  private isSpeaking = false;
  private currentAgent?: AgentId;
  private abortController?: AbortController;

  constructor(ttsProvider?: TTSProvider) {
    this.ttsProvider = ttsProvider || new ElevenLabsTTSAdapter();
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getCurrentAgent(): AgentId | undefined {
    return this.currentAgent;
  }

  public triggerBargeIn(): { interruptedAgent?: AgentId; timestamp: string } {
    const interruptedAgent = this.currentAgent;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    this.isSpeaking = false;
    this.currentAgent = undefined;

    return {
      interruptedAgent,
      timestamp: new Date().toISOString()
    };
  }

  public async speakText(
    agentId: AgentId,
    text: string
  ): Promise<{ audioBuffer?: ArrayBuffer; isFallback: boolean }> {
    this.triggerBargeIn();
    this.isSpeaking = true;
    this.currentAgent = agentId;
    this.abortController = new AbortController();

    const profile = agentId === 'NOX' ? NOX_VOICE_PROFILE : ARIA_VOICE_PROFILE;

    if (this.ttsProvider.isConfigured()) {
      try {
        const result = await this.ttsProvider.synthesize({
          text,
          agentId,
          voiceProfile: profile
        });
        return { audioBuffer: result.audioBuffer, isFallback: false };
      } catch (err) {
        console.warn(`[VOICE WARNING] TTS provider synthesis failed, falling back to local speech.`);
      }
    }

    return { isFallback: true };
  }
}
