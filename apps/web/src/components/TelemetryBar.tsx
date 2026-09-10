'use client';

import React from 'react';
import { Database, Cpu, Activity, ShieldCheck, Layers, Terminal } from 'lucide-react';

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
    <header className="border-b border-zinc-900 bg-black/70 backdrop-blur-md px-6 py-2.5 flex items-center justify-between text-xs font-mono">
      {/* Brand & Auth State */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-widest text-zinc-100 text-sm">NOCTARA</span>
        </div>
        <span className="text-zinc-600">|</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ROOT: KHAI (AUTHORIZED)</span>
        </div>
      </div>

      {/* Model Providers */}
      <div className="hidden md:flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-zinc-500" />
          <span className="text-zinc-500">GEMINI:</span>
          <span className={providerStatus.gemini === 'online' ? 'text-emerald-400' : 'text-zinc-600'}>
            {providerStatus.gemini.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">TOKENROUTER:</span>
          <span className={providerStatus.tokenrouter === 'online' ? 'text-emerald-400' : 'text-zinc-600'}>
            {providerStatus.tokenrouter.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">OPENROUTER:</span>
          <span className={providerStatus.openrouter === 'online' ? 'text-emerald-400' : 'text-zinc-600'}>
            {providerStatus.openrouter.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Action Drawers */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMemory}
          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center gap-1.5"
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>MEMORY ({memoryCount})</span>
        </button>
        <button
          onClick={onOpenAutonomy}
          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center gap-1.5"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>AUTONOMY</span>
        </button>
      </div>
    </header>
  );
};
