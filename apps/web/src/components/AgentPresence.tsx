'use client';

import React from 'react';
import { AgentId, AgentState } from '@noctara/shared';

interface AgentPresenceProps {
  agentId: AgentId;
  state: AgentState;
  isSpeaking: boolean;
}

export const AgentPresence: React.FC<AgentPresenceProps> = ({ agentId, state, isSpeaking }) => {
  const isNox = agentId === 'NOX';
  const accentColor = isNox ? '#00e5ff' : '#f59e0b';
  const roleTitle = isNox ? 'EXECUTION & SYSTEMS' : 'COMPANION & STRATEGY';

  return (
    <div className="flex flex-col items-center gap-2 p-4 transition-all duration-300">
      <div
        className="relative flex items-center justify-center w-20 h-20 rounded-full border transition-all duration-500"
        style={{
          borderColor: isSpeaking ? accentColor : 'rgba(255, 255, 255, 0.1)',
          boxShadow: isSpeaking ? `0 0 24px ${accentColor}40` : 'none',
          backgroundColor: 'rgba(15, 17, 26, 0.6)'
        }}
      >
        <div
          className="w-8 h-8 rounded-full transition-transform duration-300"
          style={{
            backgroundColor: accentColor,
            transform: isSpeaking ? 'scale(1.2)' : 'scale(1.0)',
            opacity: state === 'IDLE' ? 0.7 : 1.0
          }}
        />
      </div>

      <div className="flex flex-col items-center text-center">
        <span className="font-bold tracking-widest text-sm" style={{ color: accentColor }}>
          {agentId}
        </span>
        <span className="text-[10px] text-zinc-500 tracking-wider font-mono">{roleTitle}</span>
        <span className="mt-1 px-2 py-0.5 text-[9px] rounded font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
          {state}
        </span>
      </div>
    </div>
  );
};
