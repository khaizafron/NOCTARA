'use client';

import React, { useRef, useEffect } from 'react';

export interface MessageItem {
  id: string;
  speaker: 'ROOT' | 'NOX' | 'ARIA' | 'SYSTEM';
  content: string;
  timestamp: string;
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
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 max-w-3xl mx-auto w-full select-text"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 100%)'
      }}
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-xs tracking-wider space-y-1.5 opacity-60">
          <span className="text-[11px] tracking-widest text-zinc-500">[NOCTARA INTELLIGENCE CHAMBER ONLINE]</span>
          <span className="text-[10px]">Awaiting directive or voice input from ROOT Khai.</span>
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

          return (
            <div
              key={m.id}
              className={`group transition-all duration-200 rounded-r-lg px-3.5 py-2.5 backdrop-blur-xs ${borderStyle} ${
                isRoot ? 'ml-6 sm:ml-12' : isSystem ? 'mx-2 sm:mx-6' : 'mr-6 sm:mr-12'
              }`}
            >
              {/* Speaker Metadata Header */}
              <div className="flex items-center justify-between text-[10px] font-mono tracking-wider mb-1.5">
                <div className="flex items-center gap-2">
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
                  <span className="text-zinc-600 text-[9px] uppercase tracking-tight font-mono">
                    // {roleBadge}
                  </span>
                </div>

                <span className="text-zinc-600 font-mono text-[9px] tabular-nums">{timeStr}</span>
              </div>

              {/* Message Content */}
              <div className="text-[13px] sm:text-[14px] text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-cyan-500/30">
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
