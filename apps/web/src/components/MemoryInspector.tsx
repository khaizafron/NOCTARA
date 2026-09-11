'use client';

import React, { useState } from 'react';
import { X, Edit3, Plus, Search, Database } from 'lucide-react';
import { MemoryRecord } from '@noctara/shared';

interface MemoryInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryRecord[];
  onCorrectMemory: (id: string, newContent: string) => void;
  onAddMemory: (content: string, type: 'FACT' | 'PREFERENCE') => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  isOpen,
  onClose,
  memories,
  onCorrectMemory,
  onAddMemory
}) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [newContent, setNewContent] = useState('');
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState('');

  if (!isOpen) return null;

  const filtered = memories.filter((m) => {
    if (selectedLayer !== 'all' && m.layer !== selectedLayer) return false;
    if (search && !m.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-[#04060c]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.9)] h-full flex flex-col p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] font-mono text-xs text-zinc-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0">
              <Database className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-amber-400 font-bold text-xs sm:text-sm tracking-wider">7-LAYER MEMORY BANK</div>
              <div className="text-zinc-500 text-[9px] sm:text-[10px]">Durable Human & Agent State ({memories.length} records)</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all active:scale-95 touch-manipulation"
            aria-label="Close Memory Bank"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 py-2.5 sm:py-3 overflow-x-auto border-b border-white/[0.04] no-scrollbar touch-pan-x">
          {['all', 'identity', 'semantic', 'pattern', 'project', 'tool_learning'].map((layer) => (
            <button
              key={layer}
              onClick={() => setSelectedLayer(layer)}
              className={`min-h-[32px] px-2.5 py-1 rounded-md text-[10px] uppercase transition-all tracking-wider active:scale-95 shrink-0 touch-manipulation ${
                selectedLayer === layer
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-white/[0.03] text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="py-2.5 sm:py-3 flex items-center gap-2.5 border-b border-white/[0.04]">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Search recalled memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-zinc-200 placeholder-zinc-600 focus:outline-none text-base sm:text-xs min-h-[36px]"
          />
        </div>

        {/* Memory Records List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">No matching memories found in layer.</div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-amber-400 font-semibold tracking-wider">
                    [{m.layer.toUpperCase()}] {m.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-tight ${
                      m.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : m.verificationStatus === 'CORRECTED'
                        ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {m.verificationStatus}
                  </span>
                </div>

                {correctingId === m.id ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={correctionText}
                      onChange={(e) => setCorrectionText(e.target.value)}
                      className="w-full bg-black/60 border border-amber-500/50 rounded-lg p-2 text-zinc-100 focus:outline-none text-base sm:text-xs font-sans leading-relaxed"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setCorrectingId(null)}
                        className="px-2.5 py-1 text-zinc-400 hover:text-white text-[10px] min-h-[32px] touch-manipulation"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onCorrectMemory(m.id, correctionText);
                          setCorrectingId(null);
                        }}
                        className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] active:scale-95 transition-all min-h-[32px] touch-manipulation"
                      >
                        Save Correction
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-zinc-200 text-xs font-sans leading-relaxed">{m.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/[0.04]">
                      <span>Confidence: {Math.round(m.confidence * 100)}%</span>
                      <button
                        onClick={() => {
                          setCorrectingId(m.id);
                          setCorrectionText(m.content);
                        }}
                        className="text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors active:scale-95 min-h-[32px] px-1 touch-manipulation"
                      >
                        <Edit3 className="w-3 h-3" /> Correct
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Memory Form */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
          <input
            type="text"
            placeholder="Teach ROOT fact or preference..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 text-base sm:text-xs min-h-[44px]"
          />
          <button
            onClick={() => {
              if (!newContent.trim()) return;
              onAddMemory(newContent.trim(), 'FACT');
              setNewContent('');
            }}
            className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 font-bold text-xs active:scale-95 transition-all touch-manipulation shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
};
