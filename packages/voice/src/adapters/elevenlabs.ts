import { TTSProvider, TTSRequest } from '../types.js';

export class ElevenLabsTTSAdapter implements TTSProvider {
  public readonly id = 'elevenlabs';
  public readonly displayName = 'ElevenLabs (High Fidelity)';
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || null;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async synthesize(request: TTSRequest): Promise<{ audioBuffer?: ArrayBuffer }> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs is not configured with ELEVENLABS_API_KEY.');
    }

    const voiceId = request.voiceProfile.providerVoiceId || 'pNInz6obpgDQGcFmaJgB';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey!
      },
      body: JSON.stringify({
        text: request.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ElevenLabs TTS failed (${res.status}): ${errText}`);
    }

    const audioBuffer = await res.arrayBuffer();
    return { audioBuffer };
  }
}
