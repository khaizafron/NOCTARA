'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, ShieldAlert, Sparkles, Terminal, Cpu } from 'lucide-react';

interface CommandDockProps {
  onSendMessage: (message: string) => void;
  onBargeIn: () => void;
  onEmergencyStop: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  isEmergencyActive: boolean;
  spectrum?: number[]; // 24 real frequency bins from AudioEngine
  isSpeaking?: boolean;
  activeAgent?: 'NOX' | 'ARIA' | null;
  queuedCount?: number;
}

export const CommandDock: React.FC<CommandDockProps> = ({
  onSendMessage,
  onBargeIn,
  onEmergencyStop,
  isListening,
  onToggleListening,
  isEmergencyActive,
  spectrum = [],
  isSpeaking = false,
  activeAgent = null,
  queuedCount = 0
}) => {
  const [input, setInput] = useState('');

  // Barge-in keyboard shortcut (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBargeIn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBargeIn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const isAudioActive = isListening || isSpeaking;
  const waveformColor = isListening
    ? '#00e5ff'
    : activeAgent === 'ARIA'
    ? '#f59e0b'
    : '#00e5ff';

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 select-none z-30">
      <div className="bg-[#05070d]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.85)] rounded-2xl p-2 sm:p-3 flex flex-col gap-2 transition-all">
        {/* Top Rail: Quick directives & Kill-Switch */}
        <div className="flex items-center justify-between text-xs font-mono px-0.5 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 no-scrollbar touch-pan-x">
            <button
              onClick={() => onSendMessage('Audit codebase security and package boundaries')}
              className="px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-cyan-400 border border-white/[0.06] hover:border-cyan-500/40 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] active:scale-95 shrink-0 touch-manipulation min-h-[32px]"
            >
              <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Audit<span className="hidden sm:inline"> Codebase</span></span>
            </button>

            <button
              onClick={() =>
                onSendMessage('Debate: Should we prioritize local fine-tuned models over cloud API providers?')
              }
              className="px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-amber-400 border border-white/[0.06] hover:border-amber-500/40 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] active:scale-95 shrink-0 touch-manipulation min-h-[32px]"
            >
              <Cpu className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Debate<span className="hidden sm:inline"> Architecture</span></span>
            </button>

            <button
              onClick={() => onSendMessage('Inspect current system telemetry and memory status')}
              className="hidden sm:flex px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] hover:border-zinc-500/40 transition-all items-center gap-1.5 text-[11px] active:scale-95 shrink-0 touch-manipulation min-h-[32px]"
            >
              <Terminal className="w-3 h-3 text-zinc-400 shrink-0" />
              <span>System Health</span>
            </button>
          </div>

          {/* Tactical Kill Switch */}
          <button
            onClick={onEmergencyStop}
            className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md font-mono text-[10px] font-bold border transition-all flex items-center gap-1.5 active:scale-95 shrink-0 touch-manipulation ${
              isEmergencyActive
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse'
                : 'bg-red-950/30 text-red-400/90 border-red-900/40 hover:bg-red-900/40 hover:border-red-600/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {isEmergencyActive ? 'KILL-SWITCH ENGAGED' : 'EMERGENCY STOP'}
            </span>
            <span className="sm:hidden">{isEmergencyActive ? 'KILL' : 'STOP'}</span>
          </button>
        </div>

        {/* Dynamic Real Audio Frequency Spectrum Strip */}
        {isAudioActive && (
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 h-4 px-2 sm:px-3 py-0.5 bg-black/50 border border-white/[0.06] rounded-lg transition-all overflow-hidden">
            <span
              className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider mr-1 sm:mr-2 shrink-0 truncate max-w-[110px] sm:max-w-none"
              style={{ color: waveformColor }}
            >
              {isListening ? 'MIC_VAD' : `${activeAgent || 'AGENT'}_AUDIO`}
            </span>
            {Array.from({ length: 24 }).map((_, i) => {
              const binValue = spectrum[i] ?? 0;
              const heightPct = Math.max(8, Math.min(100, binValue * 100));
              return (
                <span
                  key={i}
                  className="w-0.5 sm:w-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: waveformColor,
                    opacity: binValue > 0.05 ? 0.9 : 0.25
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Bottom Rail: Speech Toggle + Command Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleListening}
            className={`w-11 h-11 sm:w-10 sm:h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center active:scale-95 touch-manipulation ${
              isListening
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_22px_rgba(0,229,255,0.7)] animate-pulse'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
            }`}
            title={isListening ? 'JARVIS Comm-Link Active (Click to Turn OFF)' : 'Activate JARVIS Continuous Hands-Free Comm-Link'}
            aria-label={isListening ? 'Disable microphone' : 'Enable microphone'}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Comm-Link Active: Speak freely (auto-sleeps)...'
                  : queuedCount > 0
                  ? `Message in queue (${queuedCount})... Type to add more...`
                  : 'Instruct NOX & ARIA or speak...'
              }
              className={`w-full bg-black/50 border rounded-xl px-3 sm:px-4 py-2 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans transition-all min-h-[44px] touch-manipulation ${
                isListening
                  ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(0,229,255,0.15)] ring-1 ring-cyan-500/40'
                  : 'border-white/[0.08] focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30'
              }`}
            />
            {queuedCount > 0 && (
              <span className="absolute right-2.5 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1 pointer-events-none animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {queuedCount} QUEUED
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-11 h-11 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-white/[0.06] text-zinc-300 hover:text-white hover:bg-white/[0.12] border border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center touch-manipulation"
            title="Send Directive"
            aria-label="Send Directive"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
