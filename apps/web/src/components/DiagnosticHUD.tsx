'use client';

import React from 'react';
import { AgentId, AgentState } from '@noctara/shared';
import { X, Activity, Radio, Cpu, FileText, Volume2 } from 'lucide-react';

export interface DiagnosticData {
  currentAgent: AgentId | null;
  runtimeState: AgentState;
  turnId: string | null;
  audioSource: 'MIC_INPUT' | 'AGENT_TTS' | 'INACTIVE';
  audioRms: number;
  lastSpokenText: string | null;
  lastFullText: string | null;
  activeProvider: string;
  activeModel: string;
  fallbackEvent: string | null;
}

interface DiagnosticHUDProps {
  isOpen: boolean;
  onClose: () => void;
  data: DiagnosticData;
}

export const DiagnosticHUD: React.FC<DiagnosticHUDProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-24 left-2.5 right-2.5 sm:left-auto sm:right-6 sm:w-96 max-h-[75vh] overflow-y-auto bg-[#04060c]/95 border border-cyan-500/30 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-50 p-3.5 sm:p-4 font-mono text-[11px] select-text text-zinc-300">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <Activity className="w-4 h-4 animate-pulse shrink-0" />
          <span className="font-bold tracking-widest text-xs uppercase">NOCTARA DIAGNOSTIC HUD</span>
        </div>
        <button
          onClick={onClose}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all touch-manipulation active:scale-95"
          aria-label="Close HUD"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Diagnostics */}
      <div className="space-y-2.5">
        {/* Core State & Active Agent */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/50 p-2 rounded border border-white/[0.04]">
            <span className="text-zinc-500 text-[9px] block">ACTIVE AGENT</span>
            <span className={`font-bold text-xs ${
              data.currentAgent === 'NOX'
                ? 'text-cyan-400'
                : data.currentAgent === 'ARIA'
                ? 'text-amber-400'
                : 'text-zinc-400'
            }`}>
              {data.currentAgent || 'NONE (ORCHESTRATOR)'}
            </span>
          </div>

          <div className="bg-black/50 p-2 rounded border border-white/[0.04]">
            <span className="text-zinc-500 text-[9px] block">RUNTIME STATE</span>
            <span className="font-bold text-xs text-white">
              {data.runtimeState}
            </span>
          </div>
        </div>

        {/* Turn ID */}
        <div className="bg-black/50 p-2 rounded border border-white/[0.04]">
          <span className="text-zinc-500 text-[9px] block">CURRENT TURN GROUP ID</span>
          <span className="text-zinc-300 text-[10px] break-all">
            {data.turnId || 'turn_idle_chamber'}
          </span>
        </div>

        {/* Audio Reactivity */}
        <div className="bg-black/50 p-2 rounded border border-white/[0.04]">
          <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-1">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              AUDIO SOURCE
            </span>
            <span className="text-zinc-400 font-bold">{data.audioSource}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-400">ANALYSER RMS:</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              {(data.audioRms * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-cyan-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, data.audioRms * 100)}%` }}
            />
          </div>
        </div>

        {/* Model Router Details */}
        <div className="bg-black/50 p-2 rounded border border-white/[0.04] space-y-1">
          <div className="flex items-center gap-1 text-zinc-500 text-[9px]">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>MODEL / PROVIDER ROUTE</span>
          </div>
          <div className="text-[10px] text-zinc-300">
            PROVIDER: <span className="text-amber-400 font-bold">{data.activeProvider}</span>
          </div>
          <div className="text-[10px] text-zinc-400">
            MODEL: <span className="text-zinc-200">{data.activeModel}</span>
          </div>
          {data.fallbackEvent && (
            <div className="text-[9px] text-red-400 pt-0.5">
              FALLBACK: {data.fallbackEvent}
            </div>
          )}
        </div>

        {/* Spoken vs Full Text */}
        <div className="bg-black/50 p-2 rounded border border-white/[0.04] space-y-1.5">
          <div className="flex items-center gap-1 text-zinc-500 text-[9px]">
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span>LAST SPOKEN RESPONSE (TTS)</span>
          </div>
          <p className="text-[10px] text-zinc-200 italic line-clamp-2 bg-white/[0.02] p-1.5 rounded">
            "{data.lastSpokenText || 'No voice synthesized yet'}"
          </p>

          <div className="flex items-center gap-1 text-zinc-500 text-[9px] pt-1">
            <FileText className="w-3 h-3 text-zinc-400" />
            <span>FULL TEXT RESPONSE (TRANSCRIPT)</span>
          </div>
          <p className="text-[10px] text-zinc-400 line-clamp-2 bg-white/[0.02] p-1.5 rounded">
            {data.lastFullText || 'Standing by'}
          </p>
        </div>
      </div>
    </div>
  );
};
