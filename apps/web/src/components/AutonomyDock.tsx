'use client';

import React, { useState } from 'react';
import { X, Play, XCircle, Terminal, Layers } from 'lucide-react';
import { TaskPlan } from '@noctara/shared';

interface AutonomyDockProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan: TaskPlan | null;
  onStartTask: (goal: string) => void;
  onCancelTask: (planId: string) => void;
}

export const AutonomyDock: React.FC<AutonomyDockProps> = ({
  isOpen,
  onClose,
  activePlan,
  onStartTask,
  onCancelTask
}) => {
  const [goalInput, setGoalInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-[#04060c]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.9)] h-full flex flex-col p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] font-mono text-xs text-zinc-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 shrink-0">
              <Terminal className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-cyan-400 font-bold text-xs sm:text-sm tracking-wider">LEVEL-4 AUTONOMOUS OPERATIONS</div>
              <div className="text-zinc-500 text-[9px] sm:text-[10px]">Mission Planner & Multi-Step Execution Core</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all active:scale-95 touch-manipulation"
            aria-label="Close Autonomy Operations"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Operational State Stream */}
        <div className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-4 pr-1 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {activePlan ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/15 space-y-3.5 shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-cyan-300 font-bold text-xs tracking-wide break-words">MISSION: {activePlan.goal}</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] bg-cyan-900/40 text-cyan-300 border border-cyan-500/40 shrink-0">
                  {activePlan.status}
                </span>
              </div>

              {/* Progress Track */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Execution Budget Consumption</span>
                  <span>
                    {activePlan.executedToolCount} / {activePlan.maxToolBudget} Max Operations
                  </span>
                </div>
                <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_8px_#00e5ff]"
                    style={{
                      width: `${Math.min(100, (activePlan.executedToolCount / activePlan.maxToolBudget) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Execution Steps */}
              <div className="space-y-2 pt-1">
                <span className="text-zinc-400 text-[10px] tracking-wider uppercase font-semibold">
                  Tactical Plan Sequence:
                </span>
                {activePlan.steps.map((step) => (
                  <div
                    key={step.id}
                    className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <span className="text-zinc-200 text-xs font-sans">
                        {step.order}. {step.description}
                      </span>
                      {step.toolId && (
                        <div className="text-[10px] text-cyan-400 font-mono">Invoking Tool: {step.toolId}</div>
                      )}
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider shrink-0 ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : step.status === 'RUNNING'
                          ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/50 animate-pulse'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cancel Mission Action */}
              <div className="pt-2 border-t border-white/[0.06] flex justify-end">
                <button
                  onClick={() => onCancelTask(activePlan.id)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-red-950/30 text-red-400 border border-red-900/40 hover:bg-red-900/40 hover:border-red-600/60 text-[10px] flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation"
                >
                  <XCircle className="w-3.5 h-3.5" /> Abort Mission Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-600 space-y-2">
              <Layers className="w-8 h-8 text-zinc-700 mx-auto" />
              <div>No autonomous operations currently executing.</div>
              <div className="text-[10px] text-zinc-500">Assign a high-level outcome for NOX to plan and execute.</div>
            </div>
          )}
        </div>

        {/* New Goal Dispatch */}
        <div className="pt-3 sm:pt-4 border-t border-white/[0.06] space-y-2">
          <span className="text-zinc-400 text-[10px] tracking-wider uppercase">Dispatch New Autonomous Goal:</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Run tests, inspect package boundaries..."
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 text-base sm:text-xs min-h-[44px]"
            />
            <button
              onClick={() => {
                if (!goalInput.trim()) return;
                onStartTask(goalInput.trim());
                setGoalInput('');
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(0,229,255,0.4)] touch-manipulation shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
