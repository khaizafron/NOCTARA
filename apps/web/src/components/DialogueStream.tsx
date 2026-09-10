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
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-w-4xl mx-auto w-full">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-xs tracking-wider space-y-2">
          <span>[SYSTEM CHAMBER INITIALIZED]</span>
          <span>Awaiting directive from ROOT Khai.</span>
        </div>
      ) : (
        messages.map((m) => {
          const isRoot = m.speaker === 'ROOT';
          const isNox = m.speaker === 'NOX';
          const isAria = m.speaker === 'ARIA';

          const borderCol = isRoot
            ? 'border-zinc-700 bg-zinc-950/70'
            : isNox
            ? 'border-cyan-500/30 bg-cyan-950/10'
            : isAria
            ? 'border-amber-500/30 bg-amber-950/10'
            : 'border-zinc-800 bg-zinc-900/40';

          const badgeCol = isRoot
            ? 'text-zinc-300'
            : isNox
            ? 'text-cyan-400 font-semibold'
            : isAria
            ? 'text-amber-400 font-semibold'
            : 'text-zinc-500';

          return (
            <div
              key={m.id}
              className={`p-3 rounded-lg border backdrop-blur-md transition-all duration-200 ${borderCol} ${
                isRoot ? 'ml-12' : 'mr-12'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                <span className={badgeCol}>{m.speaker}</span>
                <span className="text-zinc-600 text-[10px]">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                {m.content}
              </p>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};
