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
}

export const CommandDock: React.FC<CommandDockProps> = ({
  onSendMessage,
  onBargeIn,
  onEmergencyStop,
  isListening,
  onToggleListening,
  isEmergencyActive
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 select-none z-30">
      <div className="bg-[#05070d]/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.8)] rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2.5 transition-all">
        {/* Top Rail: Quick directives & Kill-Switch */}
        <div className="flex items-center justify-between text-xs font-mono px-1">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
            <button
              onClick={() => onSendMessage('Audit codebase security and package boundaries')}
              className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-cyan-400 border border-white/[0.06] hover:border-cyan-500/40 transition-all flex items-center gap-1.5 text-[11px] active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Audit Codebase</span>
            </button>

            <button
              onClick={() =>
                onSendMessage('Debate: Should we prioritize local fine-tuned models over cloud API providers?')
              }
              className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-amber-400 border border-white/[0.06] hover:border-amber-500/40 transition-all flex items-center gap-1.5 text-[11px] active:scale-95"
            >
              <Cpu className="w-3 h-3 text-amber-400" />
              <span>Debate Architecture</span>
            </button>

            <button
              onClick={() => onSendMessage('Inspect current system telemetry and memory status')}
              className="hidden sm:flex px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] hover:border-zinc-500/40 transition-all items-center gap-1.5 text-[11px] active:scale-95"
            >
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span>System Health</span>
            </button>
          </div>

          {/* Tactical Kill Switch */}
          <button
            onClick={onEmergencyStop}
            className={`px-3 py-1 rounded-md font-mono text-[10px] font-bold border transition-all flex items-center gap-1.5 active:scale-95 ${
              isEmergencyActive
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse'
                : 'bg-red-950/30 text-red-400/90 border-red-900/40 hover:bg-red-900/40 hover:border-red-600/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isEmergencyActive ? 'KILL-SWITCH ENGAGED' : 'EMERGENCY STOP'}
            </span>
            <span className="sm:hidden">{isEmergencyActive ? 'KILL' : 'STOP'}</span>
          </button>
        </div>

        {/* Dynamic Waveform Spectrum Strip (Visible when Listening or Active) */}
        {isListening && (
          <div className="flex items-center justify-center gap-1 h-3.5 px-3 py-0.5 bg-cyan-950/20 border border-cyan-500/20 rounded-lg">
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider mr-2">
              LISTENING_VAD
            </span>
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="w-1 bg-cyan-400 rounded-full animate-pulse"
                style={{
                  height: `${Math.max(20, Math.sin(i * 0.4) * 100)}%`,
                  animationDuration: `${400 + (i % 5) * 100}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom Rail: Speech Toggle + Command Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleListening}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center active:scale-95 ${
              isListening
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_18px_rgba(0,229,255,0.6)]'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Toggle Speech Recognition (VAD)"
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Instruct NOX & ARIA or speak... (Press ESC to barge in)"
            className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 font-sans transition-all"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-white/[0.06] text-zinc-300 hover:text-white hover:bg-white/[0.12] border border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Send Directive"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
