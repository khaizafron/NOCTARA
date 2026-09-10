'use client';

import React from 'react';
import { AgentId, AgentState } from '@noctara/shared';

interface AgentPresenceProps {
  agentId: AgentId;
  state: AgentState;
  isSpeaking: boolean;
  audioActivity?: number;
  onClick?: () => void;
}

export const AgentPresence: React.FC<AgentPresenceProps> = ({
  agentId,
  state,
  isSpeaking,
  audioActivity = 0,
  onClick
}) => {
  const isNox = agentId === 'NOX';
  const isAria = agentId === 'ARIA';

  // Distinct identity colors
  const primaryColor = isNox ? '#00e5ff' : '#f59e0b';
  const secondaryColor = isNox ? '#0284c7' : '#fbbf24';
  const roleLabel = isNox ? 'EXECUTION CORE' : 'STRATEGY CORE';
  const roleSub = isNox ? 'AUTONOMOUS OPERATOR' : 'COMPANION INTELLIGENCE';

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-3 p-4 transition-all duration-300 select-none ${
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
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* ARIA: Fluid Concentric Planetary Orbits */}
        {isAria && (
          <>
            <svg
              className="absolute inset-0 w-full h-full animate-[spin_18s_linear_infinite] pointer-events-none"
              viewBox="0 0 112 112"
            >
              <ellipse
                cx="56"
                cy="56"
                rx="50"
                ry="36"
                fill="none"
                stroke={isSpeaking ? 'rgba(245, 158, 11, 0.6)' : 'rgba(245, 158, 11, 0.22)'}
                strokeWidth="1.2"
                strokeDasharray="5 7"
              />
            </svg>
            <svg
              className="absolute inset-0 w-full h-full animate-[spin_24s_linear_infinite_reverse] pointer-events-none"
              viewBox="0 0 112 112"
            >
              <ellipse
                cx="56"
                cy="56"
                rx="42"
                ry="48"
                fill="none"
                stroke={isSpeaking ? 'rgba(251, 191, 36, 0.5)' : 'rgba(251, 191, 36, 0.18)'}
                strokeWidth="1"
              />
            </svg>
          </>
        )}

        {/* NOX: Angular Precision Brackets & Diagnostic Orbit */}
        {isNox && (
          <>
            <svg
              className="absolute inset-0 w-full h-full animate-[spin_28s_linear_infinite] pointer-events-none"
              viewBox="0 0 112 112"
            >
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke={isSpeaking ? 'rgba(0, 229, 255, 0.6)' : 'rgba(0, 229, 255, 0.22)'}
                strokeWidth="1.2"
                strokeDasharray="14 12 4 12"
              />
            </svg>
            {/* Precision corner brackets */}
            <div
              className={`absolute inset-1 border transition-all duration-500 pointer-events-none ${
                isSpeaking
                  ? 'border-cyan-400/80 shadow-[0_0_15px_rgba(0,229,255,0.4)] scale-105'
                  : 'border-cyan-500/20 scale-100'
              } rounded-lg`}
              style={{
                clipPath:
                  'polygon(0 0, 18px 0, 18px 1.5px, 1.5px 1.5px, 1.5px 18px, 0 18px, 0 calc(100% - 18px), 1.5px calc(100% - 18px), 1.5px calc(100% - 1.5px), 18px calc(100% - 1.5px), 18px 100%, 0 100%, calc(100% - 18px) 100%, calc(100% - 18px) calc(100% - 1.5px), calc(100% - 1.5px) calc(100% - 1.5px), calc(100% - 1.5px) calc(100% - 18px), 100% calc(100% - 18px), 100% 100%, 100% 18px, calc(100% - 1.5px) 18px, calc(100% - 1.5px) 1.5px, calc(100% - 18px) 1.5px, calc(100% - 18px) 0, 100% 0)'
              }}
            />
          </>
        )}

        {/* Central Luminous Node */}
        <div
          className="relative flex items-center justify-center w-14 h-14 rounded-full backdrop-blur-md transition-all duration-500"
          style={{
            background: isSpeaking
              ? `radial-gradient(circle, ${primaryColor}60 0%, #030508 80%)`
              : `radial-gradient(circle, ${primaryColor}25 0%, #050811 80%)`,
            boxShadow: isSpeaking
              ? `0 0 28px ${primaryColor}70, inset 0 0 12px ${secondaryColor}90`
              : `0 0 14px ${primaryColor}20, inset 0 0 6px ${secondaryColor}30`,
            border: `1px solid ${isSpeaking ? primaryColor : primaryColor + '40'}`
          }}
        >
          {/* Inner core jewel */}
          <div
            className="w-5 h-5 rounded-full transition-transform duration-300"
            style={{
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${primaryColor} 60%, ${secondaryColor} 100%)`,
              transform: isSpeaking ? 'scale(1.28)' : 'scale(1.0)',
              boxShadow: `0 0 12px ${primaryColor}`
            }}
          />
        </div>

        {/* Voice frequency mini visualizer when speaking */}
        {isSpeaking && (
          <div className="absolute -bottom-1 flex items-end gap-1 h-3 pointer-events-none">
            {[0.6, 1.0, 0.75, 0.9, 0.5].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full animate-pulse"
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
      <div className="flex flex-col items-center text-center space-y-1">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 0 6px ${primaryColor}`
            }}
          />
          <span
            className="font-mono text-xs font-bold tracking-widest uppercase"
            style={{ color: primaryColor }}
          >
            {agentId}
          </span>
        </div>

        <span className="text-[10px] text-zinc-400 font-mono tracking-wider">
          {roleLabel}
        </span>
        <span className="text-[9px] text-zinc-600 font-mono tracking-tight hidden sm:block">
          {roleSub}
        </span>

        {/* Tactical Status Pill */}
        <div className="pt-0.5">
          <span
            className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded border"
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
