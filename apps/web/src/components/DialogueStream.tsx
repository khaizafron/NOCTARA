'use client';

import React, { useRef, useEffect } from 'react';

export interface MessageItem {
  id: string;
  turnId?: string;
  speaker: 'ROOT' | 'NOX' | 'ARIA' | 'SYSTEM';
  content: string; // Full text response
  spokenText?: string; // Concise spoken summary
  timestamp: string;
  status?: 'queued' | 'processing' | 'done';
}

interface DialogueStreamProps {
  messages: MessageItem[];
}

export const DialogueStream: React.FC<DialogueStreamProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3.5 max-w-3xl mx-auto w-full select-text overscroll-contain"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 100%)',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-xs tracking-wider space-y-1.5 opacity-60 text-center px-4">
          <span className="text-[10px] sm:text-[11px] tracking-widest text-zinc-500">[NOCTARA INTELLIGENCE CHAMBER ONLINE]</span>
          <span className="text-[9px] sm:text-[10px]">Awaiting directive or voice input from ROOT Khai.</span>
        </div>
      ) : (
        messages.map((m) => {
          const isRoot = m.speaker === 'ROOT';
          const isNox = m.speaker === 'NOX';
          const isAria = m.speaker === 'ARIA';
          const isSystem = m.speaker === 'SYSTEM';

          // Color & border accents
          const borderStyle = isRoot
            ? 'border-l-2 border-zinc-300 bg-white/[0.02]'
            : isNox
            ? 'border-l-2 border-cyan-400 bg-cyan-950/[0.08] shadow-[inset_1px_0_12px_rgba(0,229,255,0.08)]'
            : isAria
            ? 'border-l-2 border-amber-400 bg-amber-950/[0.08] shadow-[inset_1px_0_12px_rgba(245,158,11,0.08)]'
            : 'border-l-2 border-zinc-700 bg-zinc-900/[0.2]';

          const tagColor = isRoot
            ? 'text-zinc-200'
            : isNox
            ? 'text-cyan-400'
            : isAria
            ? 'text-amber-400'
            : 'text-zinc-500';

          const roleBadge = isRoot
            ? 'ROOT AUTHORITY'
            : isNox
            ? 'EXECUTION'
            : isAria
            ? 'STRATEGY'
            : 'SYSTEM TRACE';

          const timeStr = new Date(m.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          const hasDistinctSpoken = Boolean(
            m.spokenText &&
            m.spokenText.trim() !== m.content.trim() &&
            (isNox || isAria)
          );

          return (
            <div
              key={m.id}
              className={`group transition-all duration-200 rounded-r-lg px-2.5 sm:px-3.5 py-2 sm:py-2.5 backdrop-blur-xs ${borderStyle} ${
                isRoot ? 'ml-2 sm:ml-12' : isSystem ? 'mx-1 sm:mx-6' : 'mr-2 sm:mr-12'
              }`}
            >
              {/* Speaker Metadata Header */}
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono tracking-wider mb-1 sm:mb-1.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isRoot
                        ? 'bg-zinc-300'
                        : isNox
                        ? 'bg-cyan-400 shadow-[0_0_6px_#00e5ff]'
                        : isAria
                        ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                        : 'bg-zinc-600'
                    }`}
                  />
                  <span className={`font-bold uppercase ${tagColor}`}>{m.speaker}</span>
                  <span className="text-zinc-600 text-[8px] sm:text-[9px] uppercase tracking-tight font-mono">
                    // {roleBadge}
                  </span>
                  {m.status === 'queued' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-mono tracking-wider animate-pulse flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" /> QUEUED
                    </span>
                  )}
                  {m.status === 'processing' && isRoot && (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-mono tracking-wider animate-pulse flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" /> PROCESSING
                    </span>
                  )}
                  {m.turnId && (
                    <span className="text-zinc-700 text-[8px] font-mono hidden md:inline">
                      [{m.turnId.slice(-6)}]
                    </span>
                  )}
                </div>

                <span className="text-zinc-600 font-mono text-[8px] sm:text-[9px] tabular-nums">{timeStr}</span>
              </div>

              {/* Spoken Voice Pill (Visible when voice summary differs from detailed text) */}
              {hasDistinctSpoken && (
                <div className="mb-2 px-2 py-1 bg-black/40 border border-white/[0.06] rounded text-[10px] sm:text-[11px] text-zinc-300 flex items-center gap-1.5 sm:gap-2 font-mono">
                  <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shrink-0 ${tagColor}`}>
                    // SPOKEN:
                  </span>
                  <span className="italic text-zinc-200 break-words">"{m.spokenText}"</span>
                </div>
              )}

              {/* Full Text Response Content */}
              <div className="text-[12.5px] sm:text-[14px] text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap break-words selection:bg-cyan-500/30">
                {m.content}
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
};

