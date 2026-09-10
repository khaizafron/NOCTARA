'use client';

import React, { useState } from 'react';
import { X, Play, XCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col p-6 font-mono text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-sm">LEVEL-4 AUTONOMOUS OPERATIONS</span>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {activePlan ? (
            <div className="p-4 rounded border border-cyan-500/30 bg-cyan-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold">GOAL: {activePlan.goal}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                  {activePlan.status}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Tool Calls Executed</span>
                  <span>
                    {activePlan.executedToolCount} / {activePlan.maxToolBudget} Max
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (activePlan.executedToolCount / activePlan.maxToolBudget) * 100)}%`
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-zinc-400 text-[11px] font-semibold">Execution Steps:</span>
                {activePlan.steps.map((step) => (
                  <div
                    key={step.id}
                    className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <span className="text-zinc-300 text-xs font-sans">
                        {step.order}. {step.description}
                      </span>
                      {step.toolId && (
                        <div className="text-[10px] text-cyan-400">Tool: {step.toolId}</div>
                      )}
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400'
                          : step.status === 'RUNNING'
                          ? 'bg-cyan-950 text-cyan-400 animate-pulse'
                          : step.status === 'FAILED'
                          ? 'bg-red-950 text-red-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>

              {activePlan.status === 'EXECUTING' && (
                <button
                  onClick={() => onCancelTask(activePlan.id)}
                  className="w-full py-2 rounded bg-red-950/40 text-red-400 border border-red-900/60 hover:bg-red-900/50 flex items-center justify-center gap-1.5 transition font-bold"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel Task
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-600 space-y-1">
              <div>No autonomous operations currently executing.</div>
              <div className="text-[10px]">Assign a goal below for NOX to plan and execute.</div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-900 space-y-2">
          <span className="text-zinc-400 text-[11px]">Dispatch New Autonomous Goal:</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Audit security boundaries and run test suite..."
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 text-xs"
            />
            <button
              onClick={() => {
                if (!goalInput.trim()) return;
                onStartTask(goalInput.trim());
                setGoalInput('');
              }}
              className="px-4 py-2 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
