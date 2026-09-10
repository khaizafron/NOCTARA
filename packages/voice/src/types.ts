import { AgentId, VoiceProfile } from '@noctara/shared';

export interface TTSRequest {
  text: string;
  agentId: AgentId;
  voiceProfile: VoiceProfile;
  stream?: boolean;
}

export interface TTSProvider {
  readonly id: string;
  readonly displayName: string;
  isConfigured(): boolean;
  synthesize(request: TTSRequest): Promise<{ audioBuffer?: ArrayBuffer; audioUrl?: string }>;
}

export interface STTProvider {
  readonly id: string;
  readonly displayName: string;
  isConfigured(): boolean;
  transcribe(audioBlob: Blob): Promise<string>;
}
