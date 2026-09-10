'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, ShieldAlert, Sparkles } from 'lucide-react';

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
    <div className="border-t border-zinc-900 bg-black/60 backdrop-blur-xl px-6 py-3 flex flex-col gap-2 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSendMessage('Audit codebase security and package boundaries')}
            className="px-2 py-1 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 border border-zinc-800 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            Audit Codebase
          </button>
          <button
            onClick={() => onSendMessage('Debate: Should we prioritize local fine-tuned models over cloud API providers?')}
            className="px-2 py-1 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition"
          >
            Debate Architecture
          </button>
          <button
            onClick={() => onSendMessage('Inspect current system telemetry and memory status')}
            className="px-2 py-1 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
          >
            System Health
          </button>
        </div>

        <button
          onClick={onEmergencyStop}
          className={`px-3 py-1 rounded font-mono text-[11px] font-bold border transition flex items-center gap-1.5 ${
            isEmergencyActive
              ? 'bg-red-600 text-white border-red-500 animate-pulse'
              : 'bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-900/60'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          {isEmergencyActive ? 'KILL-SWITCH ACTIVE' : 'EMERGENCY STOP'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleListening}
          className={`p-2.5 rounded-full border transition-all ${
            isListening
              ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.5)]'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
          title="Toggle Speech Recognition (VAD)"
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak or instruct NOX & ARIA... (Press ESC to interrupt)"
          className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/60 font-sans transition"
        />

        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
