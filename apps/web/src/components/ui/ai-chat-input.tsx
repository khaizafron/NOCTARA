'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lightbulb, Mic, MicOff, Globe, Paperclip, Send,
  ShieldAlert, Sparkles, Cpu, Terminal, X,
  FileText, Image as ImageIcon, File, Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LiquidMetalButton } from './liquid-metal-button';

const PLACEHOLDERS = [
  'Instruct NOX to analyse codebase security...',
  'Ask ARIA to architect a new system design...',
  'Split task: plan and execute with both agents...',
  'Debate: cloud models vs local fine-tuned models...',
  'Deploy, verify, and report mission status...',
  'What should NOCTARA build next?',
];

interface AttachedFile {
  id: string;
  file: File;
  previewUrl?: string;
  uploading: boolean;
  uploadedUrl?: string;
  error?: string;
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />;
  if (type.startsWith('text/') || type.includes('pdf')) return <FileText className="w-3.5 h-3.5 text-amber-400" />;
  return <File className="w-3.5 h-3.5 text-zinc-400" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function uploadToSupabase(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const { url } = await res.json();
  return url;
}

const placeholderContainerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.022 } },
  exit: { transition: { staggerChildren: 0.012, staggerDirection: -1 } },
};

const letterVariants = {
  initial: { opacity: 0, filter: 'blur(10px)', y: 8 },
  animate: {
    opacity: 1, filter: 'blur(0px)', y: 0,
    transition: { opacity: { duration: 0.22 }, filter: { duration: 0.35 }, y: { type: 'spring' as const, stiffness: 90, damping: 22 } },
  },
  exit: {
    opacity: 0, filter: 'blur(10px)', y: -8,
    transition: { opacity: { duration: 0.18 }, filter: { duration: 0.28 }, y: { type: 'spring' as const, stiffness: 90, damping: 22 } },
  },
};

interface NoctaraChatInputProps {
  onSendMessage: (message: string, attachments?: AttachedFile[]) => void;
  onBargeIn: () => void;
  onEmergencyStop: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  isEmergencyActive: boolean;
  spectrum?: number[];
  isSpeaking?: boolean;
  activeAgent?: 'NOX' | 'ARIA' | null;
  queuedCount?: number;
  isBusy?: boolean;
}

export const NoctaraChatInput: React.FC<NoctaraChatInputProps> = ({
  onSendMessage, onBargeIn, onEmergencyStop, isListening, onToggleListening,
  isEmergencyActive, spectrum = [], isSpeaking = false, activeAgent = null,
  queuedCount = 0, isBusy = false,
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded || input) return;
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 380);
    }, 3200);
    return () => clearInterval(interval);
  }, [isExpanded, input]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (!input && attachedFiles.length === 0) setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [input, attachedFiles]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed && attachedFiles.length === 0) return;
      onSendMessage(trimmed, attachedFiles.length > 0 ? attachedFiles : undefined);
      setInput('');
      setAttachedFiles([]);
      setIsExpanded(false);
    },
    [input, attachedFiles, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    },
    [handleSubmit]
  );

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const MAX_SIZE = 50 * 1024 * 1024;
    const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      uploading: true,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    setIsExpanded(true);
    for (const af of newFiles) {
      if (af.file.size > MAX_SIZE) {
        setAttachedFiles((prev) =>
          prev.map((f) => (f.id === af.id ? { ...f, uploading: false, error: 'File exceeds 50 MB' } : f))
        );
        continue;
      }
      try {
        const url = await uploadToSupabase(af.file);
        setAttachedFiles((prev) =>
          prev.map((f) => (f.id === af.id ? { ...f, uploading: false, uploadedUrl: url } : f))
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setAttachedFiles((prev) =>
          prev.map((f) => (f.id === af.id ? { ...f, uploading: false, error: message } : f))
        );
      }
    }
  }, []);

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => {
      const af = prev.find((f) => f.id === id);
      if (af?.previewUrl) URL.revokeObjectURL(af.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const isAudioActive = isListening || isSpeaking;
  const waveformColor = isListening ? '#00e5ff' : activeAgent === 'ARIA' ? '#f59e0b' : '#00e5ff';
  const canSend = (input.trim().length > 0 || attachedFiles.length > 0) && !isBusy;

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 select-none z-30" ref={wrapperRef}>
      {/* Quick Action Rail */}
      <div className="flex items-center justify-between text-xs font-mono px-0.5 gap-2 mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 no-scrollbar touch-pan-x">
          <button type="button" onClick={() => onSendMessage('Audit codebase security and package boundaries')}
            className="px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-cyan-400 border border-white/[0.06] hover:border-cyan-500/40 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] active:scale-95 shrink-0 touch-manipulation min-h-[32px]">
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>Audit<span className="hidden sm:inline"> Codebase</span></span>
          </button>
          <button type="button" onClick={() => onSendMessage('Debate: Should we prioritize local fine-tuned models over cloud API providers?')}
            className="px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-amber-400 border border-white/[0.06] hover:border-amber-500/40 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] active:scale-95 shrink-0 touch-manipulation min-h-[32px]">
            <Cpu className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Debate<span className="hidden sm:inline"> Architecture</span></span>
          </button>
          <button type="button" onClick={() => onSendMessage('Inspect current system telemetry and memory status')}
            className="hidden sm:flex px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] hover:border-zinc-500/40 transition-all items-center gap-1.5 text-[11px] active:scale-95 shrink-0 touch-manipulation min-h-[32px]">
            <Terminal className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>System Health</span>
          </button>
        </div>
        <button type="button" onClick={onEmergencyStop}
          className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md font-mono text-[10px] font-bold border transition-all flex items-center gap-1.5 active:scale-95 shrink-0 touch-manipulation ${
            isEmergencyActive
              ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse'
              : 'bg-red-950/30 text-red-400/90 border-red-900/40 hover:bg-red-900/40 hover:border-red-600/60'
          }`}>
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{isEmergencyActive ? 'KILL-SWITCH ENGAGED' : 'EMERGENCY STOP'}</span>
          <span className="sm:hidden">{isEmergencyActive ? 'KILL' : 'STOP'}</span>
        </button>
      </div>

      {/* Liquid Glass Container */}
      <motion.div layout onClick={() => setIsExpanded(true)} style={{ borderRadius: 24 }}
        className="relative w-full overflow-hidden bg-white/[0.04] backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_40px_rgba(0,229,255,0.06),0_2px_12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_8px_48px_rgba(0,229,255,0.10),0_2px_16px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] transition-shadow duration-300">
        {/* Inner glow */}
        <div className="absolute inset-0 pointer-events-none rounded-[24px] bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-violet-500/[0.03]" />

        {/* Audio Spectrum Strip */}
        <AnimatePresence>
          {isAudioActive && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 20 }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-0.5 sm:gap-[3px] px-4 bg-black/30 overflow-hidden">
              <span className="text-[8px] font-mono uppercase tracking-wider mr-2 shrink-0" style={{ color: waveformColor }}>
                {isListening ? 'MIC_VAD' : `${activeAgent ?? 'AGENT'}_AUDIO`}
              </span>
              {Array.from({ length: 24 }).map((_, i) => {
                const bin = spectrum[i] ?? 0;
                const h = Math.max(8, Math.min(100, bin * 100));
                return <span key={i} className="w-0.5 sm:w-[3px] rounded-full transition-all duration-75"
                  style={{ height: `${h}%`, backgroundColor: waveformColor, opacity: bin > 0.05 ? 0.9 : 0.22 }} />;
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Attachments Preview */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
              {attachedFiles.map((af) => (
                <motion.div key={af.id} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                  className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.10] backdrop-blur-md max-w-[180px]">
                  {af.previewUrl
                    ? <img src={af.previewUrl} alt={af.file.name} className="w-6 h-6 rounded-md object-cover shrink-0" />
                    : fileIcon(af.file.type)}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-zinc-200 truncate max-w-[100px]">{af.file.name}</span>
                    <span className="text-[9px] text-zinc-500">{formatBytes(af.file.size)}</span>
                  </div>
                  {af.uploading && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />}
                  {af.error && <span className="text-[9px] text-red-400 truncate">{af.error}</span>}
                  {!af.uploading && !af.error && af.uploadedUrl && <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />}
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(af.id); }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center hover:bg-red-900/60 transition-colors">
                    <X className="w-2.5 h-2.5 text-zinc-300" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Row */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 px-3 sm:px-4 py-3">
          <input ref={fileInputRef} type="file" multiple
            accept="image/*,text/*,.pdf,.doc,.docx,.csv,.json,.md,.py,.ts,.js"
            className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />

          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all flex items-center justify-center text-zinc-400 hover:text-cyan-400 active:scale-95 touch-manipulation mb-0.5">
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <textarea ref={textareaRef} rows={1} value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsExpanded(true)}
              placeholder=""
              className="w-full resize-none bg-transparent border-0 outline-none text-base sm:text-sm text-zinc-100 placeholder-transparent py-2 min-h-[40px] max-h-[160px] overflow-y-auto font-sans leading-relaxed"
              style={{ zIndex: 1, position: 'relative' }} />
            <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-start pt-2">
              <AnimatePresence mode="wait">
                {showPlaceholder && !isExpanded && !input && (
                  <motion.span key={placeholderIndex} className="text-zinc-500 text-base sm:text-sm select-none leading-relaxed"
                    variants={placeholderContainerVariants} initial="initial" animate="animate" exit="exit">
                    {PLACEHOLDERS[placeholderIndex].split('').map((char, i) => (
                      <motion.span key={i} variants={letterVariants} style={{ display: 'inline-block' }}>
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button type="button" onClick={onToggleListening}
            className={`w-10 h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center active:scale-95 touch-manipulation mb-0.5 ${
              isListening
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.6)] animate-pulse'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
            }`}>
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <div className="mb-0.5 shrink-0 flex items-center justify-center">
            {canSend ? (
              <LiquidMetalButton
                viewMode="icon"
                onClick={handleSubmit}
                icon={<Send className="w-3.5 h-3.5" />}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] opacity-40 flex items-center justify-center text-zinc-600">
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </div>
            )}
          </div>
        </form>

        {/* Expanded Controls */}
        <AnimatePresence>
          {(isExpanded || input || attachedFiles.length > 0) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex items-center justify-between px-4 pb-3 overflow-hidden">
              <div className="flex items-center gap-2">
                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setThinkActive((a) => !a)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                    thinkActive
                      ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                      : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07]'
                  }`}>
                  <Lightbulb className={`w-3.5 h-3.5 ${thinkActive ? 'text-amber-400 fill-amber-400/40' : ''}`} />
                  Think
                </motion.button>
                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setDeepSearchActive((a) => !a)}
                  animate={{ width: deepSearchActive ? 108 : 36 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full text-[11px] font-medium overflow-hidden whitespace-nowrap transition-all ${
                    deepSearchActive
                      ? 'bg-blue-500/10 border border-blue-500/40 text-blue-300'
                      : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07]'
                  }`}>
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <motion.span animate={{ opacity: deepSearchActive ? 1 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    Deep Search
                  </motion.span>
                </motion.button>
              </div>
              <div className="flex items-center gap-2">
                {queuedCount > 0 && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    {queuedCount} QUEUED
                  </motion.span>
                )}
                <span className="text-[9px] font-mono text-zinc-600">Shift+Enter new line</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default NoctaraChatInput;