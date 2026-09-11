'use client';

import { AgentId } from '@noctara/shared';

export interface AudioEngineState {
  isMicActive: boolean;
  isAgentSpeaking: boolean;
  currentAgent: AgentId | null;
  rms: number; // 0.0 to 1.0
  spectrum: number[]; // 24 frequency bins (0.0 to 1.0)
}

export interface HandsFreeVoiceCallbacks {
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onTranscript: (text: string) => void;
  onError?: (err: any) => void;
}

export class NoctaraAudioEngine {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private speechAnalyser: AnalyserNode | null = null;
  private speechGain: GainNode | null = null;
  private speechOscillator: OscillatorNode | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private animId: number | null = null;

  // Hands-Free VAD & Continuous Comm-Link State
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isHandsFreeActive = false;
  private isUserSpeaking = false;
  private silenceTimer: any = null;
  private isDeafened = false;
  private handsFreeCallbacks: HandsFreeVoiceCallbacks | null = null;

  private isMicActive = false;
  private isAgentSpeaking = false;
  private currentAgent: AgentId | null = null;
  private smoothedRms = 0;
  private spectrumBins: number[] = new Array(24).fill(0);
  private listeners: Set<(state: AudioEngineState) => void> = new Set();

  private initAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public subscribe(cb: (state: AudioEngineState) => void): () => void {
    this.listeners.add(cb);
    if (this.listeners.size === 1) {
      this.startLoop();
    }
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) {
        this.stopLoop();
      }
    };
  }

  private notify(): void {
    const snapshot: AudioEngineState = {
      isMicActive: this.isMicActive,
      isAgentSpeaking: this.isAgentSpeaking,
      currentAgent: this.currentAgent,
      rms: this.smoothedRms,
      spectrum: [...this.spectrumBins]
    };
    this.listeners.forEach((cb) => cb(snapshot));
  }

  private startLoop(): void {
    if (this.animId) return;

    const tick = () => {
      this.sampleAudio();
      this.notify();
      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private sampleAudio(): void {
    let rawRms = 0;
    const bins: number[] = new Array(24).fill(0);

    if (this.isMicActive && this.micAnalyser) {
      const data = new Uint8Array(this.micAnalyser.frequencyBinCount);
      this.micAnalyser.getByteFrequencyData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
      }
      rawRms = Math.min(1.0, Math.sqrt(sum / data.length) / 110);

      // Distribute data across 24 bins
      const step = Math.floor(data.length / 24);
      for (let b = 0; b < 24; b++) {
        let binSum = 0;
        for (let s = 0; s < step; s++) {
          binSum += data[b * step + s] || 0;
        }
        bins[b] = Math.min(1.0, (binSum / step) / 180);
      }
    } else if (this.isAgentSpeaking && this.speechAnalyser) {
      const data = new Uint8Array(this.speechAnalyser.frequencyBinCount);
      this.speechAnalyser.getByteFrequencyData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
      }
      rawRms = Math.min(1.0, Math.sqrt(sum / data.length) / 90);

      const step = Math.max(1, Math.floor(data.length / 24));
      for (let b = 0; b < 24; b++) {
        let binSum = 0;
        for (let s = 0; s < step; s++) {
          binSum += data[b * step + s] || 0;
        }
        bins[b] = Math.min(1.0, (binSum / step) / 160);
      }
    }

    // Smooth damping (fast attack, smooth decay)
    if (rawRms > this.smoothedRms) {
      this.smoothedRms += (rawRms - this.smoothedRms) * 0.45;
    } else {
      this.smoothedRms += (rawRms - this.smoothedRms) * 0.15;
    }
    if (this.smoothedRms < 0.005) this.smoothedRms = 0;

    // Continuous Hands-Free VAD (Voice Activity Detection)
    if (this.isHandsFreeActive && !this.isDeafened && !this.isAgentSpeaking) {
      if (!this.isUserSpeaking) {
        if (this.smoothedRms > 0.038) {
          this.isUserSpeaking = true;
          this.handsFreeCallbacks?.onSpeechStart();
          this.startRecordingChunk();
        }
      } else {
        if (this.smoothedRms < 0.02) {
          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              this.finalizeSpeechChunk();
            }, 1250);
          }
        } else {
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
        }
      }
    }
  }

  private startRecordingChunk(): void {
    if (!this.micStream) return;
    try {
      this.recordedChunks = [];
      const options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options.mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options.mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options.mimeType = 'audio/mp4';
        }
        this.mediaRecorder = new MediaRecorder(this.micStream, options);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.recordedChunks.push(e.data);
          }
        };
        this.mediaRecorder.start(100);
      }
    } catch (err) {
      console.warn('[AUDIO ENGINE] MediaRecorder failed to start:', err);
    }
  }

  private async finalizeSpeechChunk(): Promise<void> {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (!this.isUserSpeaking) return;
    this.isUserSpeaking = false;
    this.handsFreeCallbacks?.onSpeechEnd();

    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return;
    }

    const rec = this.mediaRecorder;
    const chunks = this.recordedChunks;

    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      try {
        rec.stop();
      } catch {
        resolve();
      }
    });

    if (chunks.length === 0) return;

    const mimeType = rec.mimeType || 'audio/webm';
    const blob = new Blob(chunks, { type: mimeType });

    // Reject tiny accidental background clicks (< 3.5KB)
    if (blob.size < 3500) {
      return;
    }

    // Temporarily deafen mic so agent playback does not re-trigger recording
    this.isDeafened = true;

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'speech.webm');

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const text = (data.text || '').trim();
        if (text.length > 0) {
          this.handsFreeCallbacks?.onTranscript(text);
        } else {
          this.isDeafened = false;
        }
      } else {
        this.isDeafened = false;
      }
    } catch (err) {
      console.warn('[AUDIO ENGINE] Transcription fetch failed:', err);
      this.isDeafened = false;
    }
  }

  /**
   * Activates JARVIS Continuous Hands-Free Open-Mic
   */
  public async startHandsFree(callbacks: HandsFreeVoiceCallbacks): Promise<void> {
    this.bargeIn();
    this.isHandsFreeActive = true;
    this.handsFreeCallbacks = callbacks;
    this.isDeafened = false;
    await this.startMicrophone();
  }

  /**
   * Deactivates Hands-Free Open-Mic
   */
  public stopHandsFree(): void {
    this.isHandsFreeActive = false;
    this.isUserSpeaking = false;
    this.isDeafened = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stopMicrophone();
  }

  public setDeafened(deafened: boolean): void {
    this.isDeafened = deafened;
  }

  /**
   * Activates microphone analyser for ROOT's voice
   */
  public async startMicrophone(): Promise<void> {
    this.bargeIn(); // Stop any ongoing agent speech
    try {
      const ctx = this.initAudioContext();
      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }

      if (!this.micAnalyser) {
        this.micAnalyser = ctx.createAnalyser();
        this.micAnalyser.fftSize = 64;
        this.micAnalyser.smoothingTimeConstant = 0.6;
        const source = ctx.createMediaStreamSource(this.micStream);
        source.connect(this.micAnalyser);
      }

      this.isMicActive = true;
    } catch (err) {
      console.warn('[AUDIO ENGINE] Could not access microphone stream:', err);
      this.isMicActive = false;
    }
  }

  public stopMicrophone(): void {
    this.isMicActive = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
      this.micAnalyser = null;
    }
  }

  private currentAudioSource: AudioBufferSourceNode | null = null;

  public async unlockAudio(): Promise<void> {
    try {
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Micro-buffer kick to unconditionally release browser audio lock
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.01);
      } catch {}

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch {}
  }

  /**
   * Synthesizes agent speech: Priority 1: High-fidelity ElevenLabs via /api/voice
   * Priority 2: Browser SpeechSynthesis fallback
   */
  public async speak(
    agentId: AgentId,
    spokenText: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.bargeIn();
    this.isDeafened = true;
    await this.unlockAudio();

    const ctx = this.initAudioContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {}
    }

    if (!this.speechAnalyser) {
      this.speechAnalyser = ctx.createAnalyser();
      this.speechAnalyser.fftSize = 64;
      this.speechAnalyser.smoothingTimeConstant = 0.5;
    }

    // Try High-Fidelity ElevenLabs Voice Stream first
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText, agentId })
      });

      const contentType = (res.headers.get('Content-Type') || res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3') || contentType.includes('audio/'))) {
        const arrayBuf = await res.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuf);

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        // Connect audio source to analyser and speaker output
        source.connect(this.speechAnalyser);
        this.speechAnalyser.connect(ctx.destination);

        this.currentAudioSource = source;
        this.isAgentSpeaking = true;
        this.currentAgent = agentId;

        onStart?.();

        return new Promise<void>((resolve) => {
          source.onended = () => {
            this.isAgentSpeaking = false;
            this.currentAgent = null;
            this.currentAudioSource = null;
            setTimeout(() => {
              this.isDeafened = false;
            }, 350);
            onEnd?.();
            resolve();
          };
          source.start(0);
        });
      } else {
        const json = await res.json().catch(() => null);
        console.warn('[AUDIO ENGINE] /api/voice returned fallback:', json);
      }
    } catch (err) {
      console.warn('[AUDIO ENGINE] /api/voice fetch failed, falling back to local speech synthesis:', err);
    }

    // Secondary Fallback: Browser SpeechSynthesis
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onEnd?.();
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      // Formant carrier wave for Web Audio spectrum during browser speech
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = agentId === 'NOX' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(agentId === 'NOX' ? 120 : 210, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);

      osc.connect(gain);
      if (this.speechAnalyser) {
        gain.connect(this.speechAnalyser);
      }
      osc.start();

      this.speechOscillator = osc;
      this.speechGain = gain;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      const isMalay = /[\b](?:saya|anda|kamu|kita|arah|arahan|diterima|selamat|apa|khai|sudah)[\b]/i.test(spokenText);
      utterance.lang = isMalay ? 'ms-MY' : 'en-US';

      if (agentId === 'NOX') {
        utterance.pitch = 0.82;
        utterance.rate = 1.05;
      } else {
        utterance.pitch = 1.15;
        utterance.rate = 0.98;
      }

      // Try selecting an appropriate voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferred = voices.find((v) =>
          agentId === 'NOX'
            ? v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george')
            : v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('susan')
        );
        if (preferred) utterance.voice = preferred;
      }

      this.currentUtterance = utterance;
      this.isAgentSpeaking = true;
      this.currentAgent = agentId;

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onboundary = () => {
        if (this.speechGain && ctx.state === 'running') {
          const now = ctx.currentTime;
          this.speechGain.gain.cancelScheduledValues(now);
          this.speechGain.gain.setValueAtTime(0.65, now);
          this.speechGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        }
      };

      const cleanup = () => {
        this.isAgentSpeaking = false;
        this.currentAgent = null;
        this.currentUtterance = null;
        setTimeout(() => {
          this.isDeafened = false;
        }, 350);
        if (this.speechOscillator) {
          try {
            this.speechOscillator.stop();
            this.speechOscillator.disconnect();
          } catch {}
          this.speechOscillator = null;
        }
        onEnd?.();
        resolve();
      };

      utterance.onend = cleanup;
      utterance.onerror = cleanup;

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * ROOT Instant Barge-In: immediately cuts all speech and audio playback
   */
  public bargeIn(): void {
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      } catch {}
      this.currentAudioSource = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.speechOscillator) {
      try {
        this.speechOscillator.stop();
        this.speechOscillator.disconnect();
      } catch {}
      this.speechOscillator = null;
    }

    this.isAgentSpeaking = false;
    this.currentAgent = null;
    this.currentUtterance = null;
    this.smoothedRms = 0;
    this.spectrumBins.fill(0);
    this.notify();
  }


  public getRms(): number {
    return this.smoothedRms;
  }

  public getSpectrum(): number[] {
    return [...this.spectrumBins];
  }
}

// Global singleton instance for the client
export const globalAudioEngine = typeof window !== 'undefined'
  ? new NoctaraAudioEngine()
  : (null as unknown as NoctaraAudioEngine);
