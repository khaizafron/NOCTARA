'use client';

import React from 'react';
import { Database, Terminal, ShieldCheck } from 'lucide-react';

interface TelemetryBarProps {
  onOpenMemory: () => void;
  onOpenAutonomy: () => void;
  providerStatus: {
    gemini: string;
    tokenrouter: string;
    openrouter: string;
  };
  memoryCount: number;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  onOpenMemory,
  onOpenAutonomy,
  providerStatus,
  memoryCount
}) => {
  return (
    <header className="h-10 border-b border-white/[0.04] bg-[#030508]/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono select-none z-20">
      {/* Brand & Understated Root Recognition */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="font-bold tracking-widest text-zinc-100 text-xs">NOCTARA</span>
        </div>

        <span className="text-zinc-700">|</span>

        <div className="flex items-center gap-1.5 text-zinc-400 tracking-wider text-[10px]">
          <ShieldCheck className="w-3 h-3 text-cyan-400" />
          <span className="text-zinc-500">SYSTEM RECOGNIZED OWNER:</span>
          <span className="text-zinc-200 font-semibold">KHAI [ROOT]</span>
        </div>
      </div>

      {/* Model Router Telemetry (Aircraft/Instrument Diagnostic) */}
      <div className="hidden md:flex items-center gap-5 text-[10px] tracking-wider">
        <span className="text-zinc-600 font-semibold">// ROUTER TELEMETRY:</span>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              providerStatus.gemini === 'online'
                ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                : 'bg-zinc-700'
            }`}
          />
          <span className="text-zinc-500">GEMINI</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              providerStatus.tokenrouter === 'online'
                ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                : 'bg-zinc-700'
            }`}
          />
          <span className="text-zinc-500">TOKENROUTER</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              providerStatus.openrouter === 'online'
                ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                : 'bg-zinc-700'
            }`}
          />
          <span className="text-zinc-500">OPENROUTER</span>
        </div>
      </div>

      {/* Diagnostic Instrument Triggers */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMemory}
          className="px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] hover:border-amber-500/40 transition-all flex items-center gap-1.5 text-[10px] active:scale-95"
          title="Open 7-Layer Durable Memory Bank"
        >
          <Database className="w-3 h-3 text-amber-400" />
          <span>MEMORY ({memoryCount})</span>
        </button>

        <button
          onClick={onOpenAutonomy}
          className="px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] hover:border-cyan-500/40 transition-all flex items-center gap-1.5 text-[10px] active:scale-95"
          title="Open Level-4 Autonomous Operations"
        >
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>AUTONOMY L4</span>
        </button>
      </div>
    </header>
  );
};
