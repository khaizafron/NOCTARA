'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AgentState } from '@noctara/shared';
import { NoxLiquidOrbCanvas } from './orbs/NoxLiquidOrbCanvas';

// Boot sequence messages — cycle one by one
const BOOT_LINES = [
  'NOCTARA // INITIALIZING CORE SYSTEMS...',
  'LOADING AGENT CORES: NOX + ARIA...',
  'CALIBRATING INTELLIGENCE MATRIX...',
  'ESTABLISHING SECURE ROOT LINK...',
  'CHAMBER ONLINE — STANDING BY.',
];

// Keep the boot orb in a calm, NOX-only cadence: alive but never drifting into speaking-like states.
const STATE_SEQUENCE: AgentState[] = [
  'IDLE',
  'THINKING',
  'IDLE',
  'THINKING',
  'IDLE',
  'THINKING',
];

interface NoctaraBootScreenProps {
  onComplete: () => void;
}

export const NoctaraBootScreen: React.FC<NoctaraBootScreenProps> = ({ onComplete }) => {
  const [lineIndex, setLineIndex] = useState(0);
  const [orbState, setOrbState] = useState<AgentState>('IDLE');
  const [exiting, setExiting] = useState(false);

  // Cycle boot lines every ~1.1s
  useEffect(() => {
    if (lineIndex >= BOOT_LINES.length - 1) return;
    const t = setTimeout(() => setLineIndex((i) => i + 1), 1100);
    return () => clearTimeout(t);
  }, [lineIndex]);

  // Smooth NOX-only boot cadence: no abrupt speaking/exec transitions, just steady system awareness.
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % STATE_SEQUENCE.length;
      setOrbState(STATE_SEQUENCE[i]);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 5200);
    const doneTimer = setTimeout(() => onComplete(), 6000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
          style={{ userSelect: 'none' }}
        >
          {/* Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            className="drop-shadow-[0_0_25px_rgba(34,211,238,0.7)]"
          >
            <NoxLiquidOrbCanvas
              state={orbState}
              audioActivity={0.08}
              size={240}
              isSpeaking={false}
            />
          </motion.div>

          {/* NOCTARA wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mt-8 text-white font-mono text-xl tracking-[0.25em] font-semibold"
          >
            NOCTARA
          </motion.div>

          {/* Cycling boot status line */}
          <div className="mt-4 h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={lineIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="text-center text-[11px] font-mono tracking-widest text-cyan-400/70"
              >
                {BOOT_LINES[lineIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <motion.div
            className="mt-6 h-2.5 overflow-hidden rounded-full border border-cyan-400/20 bg-slate-950/80 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
            style={{
              width: 'min(72vw, 540px)',
              boxShadow: '0 0 0 1px rgba(34,211,238,0.08), 0 0 18px rgba(34,211,238,0.18), inset 0 0 18px rgba(15,23,42,0.9)',
            }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(34,211,238,0.2) 0%, rgba(34,211,238,0.95) 18%, rgba(125,211,252,1) 38%, rgba(96,165,250,1) 52%, rgba(34,211,238,0.95) 78%, rgba(14,165,233,0.4) 100%)',
                boxShadow: '0 0 14px rgba(34,211,238,0.95), 0 0 28px rgba(59,130,246,0.75), 0 0 42px rgba(34,211,238,0.45)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5.2, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Second-pass fade-in overlay covers the "pop" of app mounting */}
      {exiting && (
        <motion.div
          key="fade-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
};
