'use client';

import React from 'react';
import { AgentId, AgentState } from '@noctara/shared';
import { AriaLiquidOrbCanvas } from './orbs/AriaLiquidOrbCanvas';
import { NoxLiquidOrbCanvas } from './orbs/NoxLiquidOrbCanvas';

interface AgentPresenceProps {
  agentId: AgentId;
  state: AgentState;
  isSpeaking: boolean;
  audioActivity?: number;
  onClick?: () => void;
  size?: number;
}

export const AgentPresence: React.FC<AgentPresenceProps> = ({
  agentId,
  state,
  isSpeaking,
  audioActivity = 0,
  onClick,
  size = 112
}) => {
  const isNox = agentId === 'NOX';
  const isAria = agentId === 'ARIA';

  // Distinct identity colors: ARIA is ethereal violet/electric blue; NOX is technical cyan/sky blue
  const primaryColor = isNox ? '#00e5ff' : '#a855f7';
  const secondaryColor = isNox ? '#0284c7' : '#6366f1';
  const roleLabel = isNox ? 'EXECUTION CORE' : 'STRATEGY CORE';
  const roleSub = isNox ? 'AUTONOMOUS OPERATOR' : 'COMPANION INTELLIGENCE';

  const nodeSize = Math.round(size * 0.5);
  const jewelSize = Math.round(size * 0.18);

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-1.5 sm:gap-3 p-1.5 sm:p-4 transition-all duration-300 select-none touch-manipulation ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      }`}
    >
      {/* Presence aura behind node */}
      <div
        className="absolute -inset-2 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-all duration-700 pointer-events-none"
        style={{
          background: isSpeaking
            ? `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor} 50%, transparent 80%)`
            : `radial-gradient(circle, ${primaryColor}22 0%, transparent 70%)`
        }}
      />

      {/* Dimensional Presence Orb Container */}
      <div
        className="relative flex items-center justify-center transition-all duration-300"
        style={{ width: size, height: size }}
      >
        {/* ARIA: Procedural WebGPU Liquid Orb Presence */}
        {isAria && (
          <AriaLiquidOrbCanvas
            state={state}
            audioActivity={audioActivity}
            size={size}
            className="transition-transform duration-300"
          />
        )}

        {/* NOX: Procedural WebGPU High-Precision Liquid Intelligence Core */}
        {isNox && (
          <NoxLiquidOrbCanvas
            state={state}
            audioActivity={audioActivity}
            size={size}
            isSpeaking={isSpeaking}
            className="transition-transform duration-300"
          />
        )}

        {/* Voice frequency mini visualizer when speaking */}
        {isSpeaking && (
          <div className="absolute -bottom-1 flex items-end gap-1 h-2.5 sm:h-3 pointer-events-none">
            {[0.6, 1.0, 0.75, 0.9, 0.5].map((h, i) => (
              <span
                key={i}
                className="w-0.5 sm:w-1 rounded-full animate-pulse"
                style={{
                  height: `${h * 100}%`,
                  backgroundColor: primaryColor,
                  animationDelay: `${i * 120}ms`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Metadata & Micro-Telemetry */}
      <div className="flex flex-col items-center text-center space-y-0.5 sm:space-y-1">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 0 6px ${primaryColor}`
            }}
          />
          <span
            className="font-mono text-[10px] sm:text-xs font-bold tracking-widest uppercase"
            style={{ color: primaryColor }}
          >
            {agentId}
          </span>
        </div>

        <span className="text-[8px] sm:text-[10px] text-zinc-400 font-mono tracking-wider whitespace-nowrap">
          {roleLabel}
        </span>
        <span className="text-[7.5px] sm:text-[9px] text-zinc-600 font-mono tracking-tight block">
          {roleSub}
        </span>

        {/* Tactical Status Pill */}
        <div className="pt-0.5">
          <span
            className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono uppercase tracking-wider rounded border"
            style={{
              backgroundColor: isSpeaking ? `${primaryColor}18` : '#090b10',
              borderColor: isSpeaking ? `${primaryColor}60` : '#27272a',
              color: isSpeaking ? primaryColor : '#a1a1aa'
            }}
          >
            {state}
          </span>
        </div>
      </div>
    </div>
  );
};
