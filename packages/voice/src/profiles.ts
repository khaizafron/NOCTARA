import { VoiceProfile } from '@noctara/shared';

export const NOX_VOICE_PROFILE: VoiceProfile = {
  agentId: 'NOX',
  gender: 'male',
  style: 'resolute, deep, calm, technical',
  pitch: 0.85,
  rate: 1.05,
  providerVoiceId: process.env.ELEVENLABS_NOX_VOICE_ID || 'pNInz6obpgDQGcFmaJgB' // Adam / deep male
};

export const ARIA_VOICE_PROFILE: VoiceProfile = {
  agentId: 'ARIA',
  gender: 'female',
  style: 'warm, clear, articulate, reflective',
  pitch: 1.05,
  rate: 0.98,
  providerVoiceId: process.env.ELEVENLABS_ARIA_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL' // Bella / warm female
};
