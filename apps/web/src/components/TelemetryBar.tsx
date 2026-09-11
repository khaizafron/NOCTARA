'use client';

import React from 'react';
import { Database, Terminal, ShieldCheck } from 'lucide-react';

interface TelemetryBarProps {
  onOpenMemory: () => void;
  onOpenAutonomy: () => void;
  onToggleDiagnostic?: () => void;
  isDiagnosticOpen?: boolean;
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
  onToggleDiagnostic,
  isDiagnosticOpen = false,
  providerStatus,
  memoryCount
}) => {
  const renderProviderBadge = (name: string, rawStatus: string) => {
    const status = rawStatus?.toLowerCase() || 'unconfigured';
    let dotClass = 'bg-zinc-700';
    let label = 'UNCONFIGURED';
    let textClass = 'text-zinc-500';

    if (status === 'online') {
      dotClass = 'bg-emerald-400 shadow-[0_0_6px_#34d399]';
      label = 'ONLINE';
      textClass = 'text-emerald-400';
    } else if (status === 'degraded') {
      dotClass = 'bg-amber-400 shadow-[0_0_6px_#f59e0b]';
      label = 'DEGRADED';
      textClass = 'text-amber-400';
    } else if (status === 'offline') {
      dotClass = 'bg-red-500 shadow-[0_0_6px_#ef4444]';
      label = 'OFFLINE';
      textClass = 'text-red-400';
    }

    return (
      <div className="flex items-center gap-1.5" title={`${name}: ${label}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span className="text-zinc-400">{name}</span>
        <span className={`text-[8px] font-mono ${textClass}`}>[{label}]</span>
      </div>
    );
  };

  return (
    <header className="h-11 sm:h-10 border-b border-white/[0.04] bg-[#030508]/75 backdrop-blur-md px-2.5 sm:px-6 flex items-center justify-between text-[11px] font-mono select-none z-20 pt-[env(safe-area-inset-top,0px)]">
      {/* Brand & Understated Root Recognition */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="font-bold tracking-widest text-zinc-100 text-[11px] sm:text-xs">NOCTARA</span>
        </div>

        <span className="text-zinc-700 hidden xs:inline">|</span>

        <div className="flex items-center gap-1 text-zinc-400 tracking-wider text-[9px] sm:text-[10px]">
          <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="text-zinc-500 hidden md:inline">SYSTEM RECOGNIZED OWNER:</span>
          <span className="text-zinc-200 font-semibold truncate max-w-[65px] xs:max-w-none">KHAI [ROOT]</span>
        </div>
      </div>

      {/* Model Router Telemetry (Aircraft/Instrument Diagnostic) */}
      <div className="hidden lg:flex items-center gap-4 text-[10px] tracking-wider">
        <span className="text-zinc-600 font-semibold">// ROUTER TELEMETRY:</span>
        {renderProviderBadge('TOKENROUTER (PRI)', providerStatus.tokenrouter)}
        {renderProviderBadge('GEMINI', providerStatus.gemini)}
        {renderProviderBadge('OPENROUTER', providerStatus.openrouter)}
      </div>

      {/* Diagnostic Instrument Triggers */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onToggleDiagnostic && (
          <button
            onClick={onToggleDiagnostic}
            className={`min-h-[34px] sm:min-h-[28px] px-2 sm:px-2.5 rounded border transition-all flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] active:scale-95 touch-manipulation ${
              isDiagnosticOpen
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 border-white/[0.06]'
            }`}
            title="Toggle Live Diagnostic HUD"
          >
            <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">DIAGNOSTIC</span>
            <span className="sm:hidden font-semibold">HUD</span>
          </button>
        )}

        <button
          onClick={onOpenMemory}
          className="min-h-[34px] sm:min-h-[28px] px-2 sm:px-2.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] hover:border-amber-500/40 transition-all flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] active:scale-95 touch-manipulation"
          title="Open 7-Layer Durable Memory Bank"
        >
          <Database className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">MEMORY ({memoryCount})</span>
          <span className="sm:hidden font-semibold">MEM({memoryCount})</span>
        </button>

        <button
          onClick={onOpenAutonomy}
          className="min-h-[34px] sm:min-h-[28px] px-2 sm:px-2.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] hover:border-cyan-500/40 transition-all flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] active:scale-95 touch-manipulation"
          title="Open Level-4 Autonomous Operations"
        >
          <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="hidden sm:inline">AUTONOMY L4</span>
          <span className="sm:hidden font-semibold">L4</span>
        </button>
      </div>
    </header>
  );
};

