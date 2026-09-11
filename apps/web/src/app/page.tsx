'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentId, AgentState, TaskPlan, MemoryRecord } from '@noctara/shared';

import { NoctaraCoreCanvas } from '../components/NoctaraCoreCanvas';
import { AgentPresence } from '../components/AgentPresence';
import { DialogueStream, MessageItem } from '../components/DialogueStream';
import { NoctaraChatInput } from '../components/ui/ai-chat-input';
import { TelemetryBar } from '../components/TelemetryBar';
import { MemoryInspector } from '../components/MemoryInspector';
import { AutonomyDock } from '../components/AutonomyDock';
import { DiagnosticHUD, DiagnosticData } from '../components/DiagnosticHUD';
import { globalAudioEngine } from '../lib/audio-engine';

export default function NoctaraRoomPage() {
  const [coreState, setCoreState] = useState<AgentState>('IDLE');
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [noxState, setNoxState] = useState<AgentState>('IDLE');
  const [ariaState, setAriaState] = useState<AgentState>('IDLE');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [audioActivity, setAudioActivity] = useState(0); // 0.0 to 1.0 real RMS
  const [audioSpectrum, setAudioSpectrum] = useState<number[]>(new Array(24).fill(0));
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // Holographic and Diagnostic Drawers
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isAutonomyOpen, setIsAutonomyOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [activePlan, setActivePlan] = useState<TaskPlan | null>(null);

  // Diagnostic Data State
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({
    currentAgent: null,
    runtimeState: 'IDLE',
    turnId: null,
    audioSource: 'INACTIVE',
    audioRms: 0,
    lastSpokenText: null,
    lastFullText: null,
    activeProvider: 'GEMINI (PRIMARY)',
    activeModel: 'gemini-2.5-pro',
    fallbackEvent: null
  });

  const recognitionRef = useRef<any>(null);
  const isInterruptedRef = useRef<boolean>(false);

  const [providerStatus, setProviderStatus] = useState({
    gemini: 'online',
    tokenrouter: 'online',
    openrouter: 'online'
  });

  const [isMobile, setIsMobile] = useState(false);

  // Responsive mobile viewport tracking
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Subscribe to real Web Audio analyser engine
  useEffect(() => {
    if (!globalAudioEngine) return;
    const unsubscribe = globalAudioEngine.subscribe((engineState) => {
      setAudioActivity(engineState.rms);
      setAudioSpectrum(engineState.spectrum);
      setDiagnosticData((prev) => ({
        ...prev,
        audioRms: engineState.rms,
        audioSource: engineState.isMicActive
          ? 'MIC_INPUT'
          : engineState.isAgentSpeaking
          ? 'AGENT_TTS'
          : 'INACTIVE'
      }));
    });
    return unsubscribe;
  }, []);

  const fetchHealthAndMemories = useCallback(async () => {
    try {
      const [hRes, mRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/memory')
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setProviderStatus(hData.providers || { gemini: 'online', tokenrouter: 'online', openrouter: 'online' });
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMemories(mData.memories || []);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    fetchHealthAndMemories();
    setMessages([
      {
        id: 'msg_init',
        turnId: 'turn_init_001',
        speaker: 'SYSTEM',
        content: 'NOCTARA intelligence chamber initialized. Recognized human authority: Khai (ROOT). NOX and ARIA standing by.',
        spokenText: 'NOCTARA intelligence chamber initialized. NOX and ARIA standing by.',
        timestamp: new Date().toISOString()
      }
    ]);
  }, [fetchHealthAndMemories]);

  // ROOT Instant Barge-In: immediately halts speech synthesis and audio playback
  const handleBargeIn = useCallback(() => {
    isInterruptedRef.current = true;
    if (globalAudioEngine) {
      globalAudioEngine.bargeIn();
    }
    setCoreState('IDLE');
    setNoxState('IDLE');
    setAriaState('IDLE');
    setActiveAgent(null);
    setAudioActivity(0);
    setDiagnosticData((prev) => ({
      ...prev,
      runtimeState: 'IDLE',
      currentAgent: null,
      audioSource: 'INACTIVE',
      fallbackEvent: 'ROOT BARGE-IN INTERRUPT TRIGGERED'
    }));
  }, []);

  // Keyboard shortcut: Escape for Instant Barge-In, Ctrl+D or ~ for Diagnostic HUD
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBargeIn();
      } else if (e.key === '`' && (e.ctrlKey || e.metaKey)) {
        setIsDiagnosticOpen((prev) => !prev);
      }
    };
    const handleUserUnlock = () => {
      globalAudioEngine?.unlockAudio();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('pointerdown', handleUserUnlock, { once: true });
    window.addEventListener('keydown', handleUserUnlock, { once: true });
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('pointerdown', handleUserUnlock);
      window.removeEventListener('keydown', handleUserUnlock);
    };
  }, [handleBargeIn]);

  // Send message and execute dialogue turn sequence
  const handleSendMessage = async (content: string) => {
    handleBargeIn();
    isInterruptedRef.current = false;
    // Synchronously unlock AudioContext inside user click / enter key event
    globalAudioEngine?.unlockAudio();

    const userMsgId = `msg_root_${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      speaker: 'ROOT',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setCoreState('THINKING');
    setNoxState('THINKING');
    setAriaState('THINKING');

    setDiagnosticData((prev) => ({
      ...prev,
      runtimeState: 'THINKING',
      lastFullText: content,
      turnId: `turn_exec_${Date.now()}`
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const turns = data.turns || [];

      // Deduplication guard: filter any duplicate turn IDs or identical consecutive messages
      const seenIds = new Set<string>();
      const cleanTurns = turns.filter((t: any) => {
        if (!t || !t.content || seenIds.has(t.id)) return false;
        seenIds.add(t.id);
        return true;
      });

      // 1. Immediately render all full response texts into transcript
      for (const turn of cleanTurns) {
        const item: MessageItem = {
          id: turn.id || `msg_${Date.now()}_${turn.speaker}`,
          turnId: turn.turnId,
          speaker: turn.speaker,
          content: turn.content,
          spokenText: turn.spokenText,
          timestamp: turn.timestamp
        };
        setMessages((prev) => {
          // Avoid duplicate keys
          if (prev.some((m) => m.id === item.id)) return prev;
          return [...prev, item];
        });
      }

      // 2. Sequential Speech Queue: speak each turn's concise spoken summary without overlap
      for (const turn of cleanTurns) {
        if (isInterruptedRef.current) break; // User barged in

        const speaker = turn.speaker as AgentId;
        setActiveAgent(speaker);
        setCoreState('SPEAKING');

        if (speaker === 'NOX') {
          setNoxState('SPEAKING');
          setAriaState('IDLE');
        } else if (speaker === 'ARIA') {
          setAriaState('SPEAKING');
          setNoxState('IDLE');
        }

        setDiagnosticData((prev) => ({
          ...prev,
          currentAgent: speaker,
          runtimeState: 'SPEAKING',
          turnId: turn.turnId || prev.turnId,
          lastSpokenText: turn.spokenText,
          lastFullText: turn.content
        }));

        if (globalAudioEngine) {
          const textToSpeak = (turn.spokenText && turn.spokenText.trim().length > 0) ? turn.spokenText : turn.content;
          if (textToSpeak) {
            await globalAudioEngine.speak(speaker, textToSpeak);
          }
        }

        // Brief natural pause between multiple speakers
        if (!isInterruptedRef.current && cleanTurns.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 320));
        }
      }

      // Return to calm idle state
      if (!isInterruptedRef.current) {
        setCoreState('IDLE');
        setNoxState('IDLE');
        setAriaState('IDLE');
        setActiveAgent(null);
        setDiagnosticData((prev) => ({
          ...prev,
          runtimeState: 'IDLE',
          currentAgent: null
        }));
      }

      fetchHealthAndMemories();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          speaker: 'SYSTEM',
          content: `Operational anomaly: ${err.message}`,
          spokenText: 'Operational anomaly detected in system chamber.',
          timestamp: new Date().toISOString()
        }
      ]);
      setCoreState('ERROR_RECOVERY');
      setDiagnosticData((prev) => ({
        ...prev,
        runtimeState: 'ERROR_RECOVERY',
        fallbackEvent: err.message
      }));
      setTimeout(() => {
        setCoreState('IDLE');
        setDiagnosticData((prev) => ({ ...prev, runtimeState: 'IDLE' }));
      }, 3500);
    }
  };

  // Toggle Continuous Hands-Free JARVIS Open-Mic (Real-Time VAD)
  const handleToggleListening = async () => {
    if (typeof window === 'undefined') return;

    if (isListening) {
      if (globalAudioEngine) {
        globalAudioEngine.stopHandsFree();
      }
      setIsListening(false);
      setCoreState('IDLE');
      setDiagnosticData((prev) => ({
        ...prev,
        runtimeState: 'IDLE',
        audioSource: 'INACTIVE'
      }));
    } else {
      handleBargeIn();
      setIsListening(true);
      setCoreState('IDLE'); // Remains calm idle ("sleep") until speech detected
      setDiagnosticData((prev) => ({
        ...prev,
        runtimeState: 'IDLE',
        audioSource: 'MIC_INPUT'
      }));

      if (globalAudioEngine) {
        await globalAudioEngine.startHandsFree({
          onSpeechStart: () => {
            setCoreState('LISTENING');
            setDiagnosticData((prev) => ({
              ...prev,
              runtimeState: 'LISTENING',
              audioSource: 'MIC_INPUT'
            }));
          },
          onSpeechEnd: () => {
            setCoreState('THINKING');
            setDiagnosticData((prev) => ({
              ...prev,
              runtimeState: 'THINKING'
            }));
          },
          onTranscript: (spokenText: string) => {
            if (spokenText && spokenText.trim().length > 0) {
              handleSendMessage(spokenText);
            }
          },
          onError: (err) => {
            console.warn('[HANDS-FREE VAD ERROR]', err);
          }
        });
      }
    }
  };

  const handleEmergencyStop = () => {
    handleBargeIn();
    setIsEmergencyActive((prev) => !prev);
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_kill_${Date.now()}`,
        speaker: 'SYSTEM',
        content: isEmergencyActive
          ? 'Emergency Kill-Switch deactivated by ROOT. System operations restored.'
          : '[CRITICAL SHUTDOWN] Emergency Kill-Switch TRIGGERED by ROOT Khai. All tool and autonomy routines halted.',
        spokenText: isEmergencyActive ? 'Emergency kill switch deactivated.' : 'Emergency kill switch activated.',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleStartTask = async (goal: string) => {
    setCoreState('EXECUTING');
    setNoxState('EXECUTING');
    setActiveAgent('NOX');

    try {
      const res = await fetch('/api/autonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', goal })
      });
      const data = await res.json();
      if (data.plan) {
        setActivePlan(data.plan);
        const taskMsg = `Dispatched Level-4 autonomous operation: "${goal}". Initialized across ${data.plan.steps?.length || 0} tactical steps.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_task_${Date.now()}`,
            speaker: 'NOX',
            content: taskMsg,
            spokenText: `Autonomous operation dispatched. Executing ${data.plan.steps?.length || 0} tactical steps.`,
            timestamp: new Date().toISOString()
          }
        ]);
        if (globalAudioEngine) {
          globalAudioEngine.speak('NOX', `Autonomous operation dispatched. Executing ${data.plan.steps?.length || 0} tactical steps.`);
        }
      }
    } catch {
      // Handled
    }
    setCoreState('IDLE');
    setNoxState('IDLE');
    setActiveAgent(null);
  };

  const handleCancelTask = async (planId: string) => {
    await fetch('/api/autonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', planId })
    });
    if (activePlan) {
      setActivePlan({ ...activePlan, status: 'CANCELLED' });
    }
    setCoreState('IDLE');
    setNoxState('IDLE');
  };

  const handleCorrectMemory = async (id: string, newContent: string) => {
    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'correct', id, newContent, reason: 'Corrected directly by ROOT Khai' })
    });
    fetchHealthAndMemories();
  };

  const handleAddMemory = async (content: string, type: 'FACT' | 'PREFERENCE') => {
    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type, layer: 'identity', scope: 'root' })
    });
    fetchHealthAndMemories();
  };

  return (
    <main className="flex flex-col h-[100dvh] w-full max-w-[100vw] bg-[#030508] text-zinc-100 font-sans select-none overflow-hidden spatial-grid relative">
      {/* Dynamic Ambient Environmental Aura */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background:
            coreState === 'EXECUTING'
              ? 'radial-gradient(ellipse 65% 45% at 50% 30%, rgba(0, 229, 255, 0.08) 0%, transparent 70%)'
              : coreState === 'RESEARCHING'
              ? 'radial-gradient(ellipse 65% 45% at 50% 30%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)'
              : coreState === 'THINKING'
              ? 'radial-gradient(ellipse 55% 40% at 50% 30%, rgba(99, 102, 241, 0.09) 0%, transparent 70%)'
              : coreState === 'SPEAKING'
              ? activeAgent === 'NOX'
                ? 'radial-gradient(ellipse 60% 45% at 50% 30%, rgba(0, 229, 255, 0.1) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 60% 45% at 50% 30%, rgba(245, 158, 11, 0.1) 0%, transparent 70%)'
              : coreState === 'AWAITING_APPROVAL'
              ? 'radial-gradient(ellipse 55% 40% at 50% 30%, rgba(245, 158, 11, 0.12) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 55% 40% at 50% 30%, rgba(14, 165, 233, 0.04) 0%, transparent 70%)'
        }}
      />

      {/* Corner Spatial Coordinates */}
      <div className="absolute top-12 left-6 text-[9px] font-mono text-zinc-600 tracking-widest pointer-events-none hidden lg:block">
        NOCTARA_CORE // CHAMBER_01 <br />
        STATUS: ONLINE
      </div>
      <div className="absolute top-12 right-6 text-[9px] font-mono text-zinc-600 tracking-widest text-right pointer-events-none hidden lg:block">
        AUTHORITY: ROOT_KHAI <br />
        CLEARANCE: LEVEL_5
      </div>

      {/* Top Aircraft Telemetry Bar with Live Provider Status and Diagnostic trigger */}
      <TelemetryBar
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenAutonomy={() => setIsAutonomyOpen(true)}
        onToggleDiagnostic={() => setIsDiagnosticOpen((prev) => !prev)}
        isDiagnosticOpen={isDiagnosticOpen}
        providerStatus={providerStatus}
        memoryCount={memories.length}
      />

      {/* Main Environmental Chamber */}
      <div className="flex-1 flex flex-col items-center justify-between p-1.5 sm:p-4 overflow-hidden relative z-10 w-full">
        {/* Spatial Intelligence Stage: ARIA - Conduit - CORE - Conduit - NOX */}
        <div className="relative flex items-center justify-center w-full max-w-4xl pt-0.5 sm:pt-2 px-1 sm:px-4">
          {/* ARIA Spatial Presence Orbit (Left) */}
          <div className="flex-1 flex justify-end pr-0.5 sm:pr-4">
            <AgentPresence
              agentId="ARIA"
              state={ariaState}
              isSpeaking={ariaState === 'SPEAKING'}
              audioActivity={ariaState === 'SPEAKING' ? audioActivity : 0}
              size={isMobile ? 78 : 112}
              onClick={() => handleSendMessage('ARIA, summarize our strategic continuity and long-term goals.')}
            />
          </div>

          {/* ARIA -> Core Resonant Conduit */}
          <div className="w-3 sm:w-16 md:w-28 h-[2px] mx-0.5 sm:mx-2 relative overflow-hidden block rounded-full">
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                ariaState === 'SPEAKING' || ariaState === 'THINKING' || ariaState === 'RESEARCHING'
                  ? 'opacity-100'
                  : 'opacity-15'
              }`}
              style={{
                background:
                  'linear-gradient(90deg, #f59e0b 0%, rgba(245, 158, 11, 0.5) 60%, rgba(0, 229, 255, 0.2) 100%)'
              }}
            />
            {(ariaState === 'SPEAKING' || ariaState === 'THINKING' || ariaState === 'RESEARCHING') && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent w-10 h-full animate-[conduit-flow_1.3s_linear_infinite]" />
            )}
          </div>

          {/* Central Luminous AI Intelligence Sphere */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <NoctaraCoreCanvas
              state={coreState}
              activeAgent={activeAgent}
              audioActivity={audioActivity}
              size={isMobile ? 172 : 320}
            />
            {/* Core Telemetry Tag */}
            <div className="text-center mt-[-10px] sm:mt-[-14px] z-20">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-mono tracking-widest uppercase bg-[#070912]/80 border border-white/[0.08] text-zinc-400 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                CORE // {coreState} {activeAgent ? `[${activeAgent}]` : ''}
              </span>
            </div>
          </div>

          {/* NOX -> Core Resonant Conduit */}
          <div className="w-3 sm:w-16 md:w-28 h-[2px] mx-0.5 sm:mx-2 relative overflow-hidden block rounded-full">
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                noxState === 'SPEAKING' || noxState === 'THINKING' || noxState === 'EXECUTING' || noxState === 'VERIFYING'
                  ? 'opacity-100'
                  : 'opacity-15'
              }`}
              style={{
                background:
                  noxState === 'EXECUTING'
                    ? 'linear-gradient(90deg, rgba(0, 229, 255, 0.4) 0%, rgba(0, 229, 255, 0.8) 50%, #00e5ff 100%)'
                    : 'linear-gradient(90deg, rgba(0, 229, 255, 0.2) 0%, rgba(0, 229, 255, 0.5) 40%, #00e5ff 100%)'
              }}
            />
            {(noxState === 'SPEAKING' || noxState === 'THINKING' || noxState === 'EXECUTING' || noxState === 'VERIFYING') && (
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent w-12 h-full ${
                  noxState === 'EXECUTING'
                    ? 'animate-[conduit-flow_0.7s_linear_infinite]'
                    : noxState === 'VERIFYING'
                    ? 'animate-[conduit-flow_1.8s_ease-in-out_infinite]'
                    : 'animate-[conduit-flow_1.3s_linear_infinite]'
                }`}
                style={{
                  opacity: noxState === 'SPEAKING' ? 0.6 + audioActivity * 0.4 : 0.85
                }}
              />
            )}
          </div>

          {/* NOX Spatial Presence Orbit (Right) */}
          <div className="flex-1 flex justify-start pl-0.5 sm:pl-4">
            <AgentPresence
              agentId="NOX"
              state={noxState}
              isSpeaking={noxState === 'SPEAKING'}
              audioActivity={noxState === 'SPEAKING' ? audioActivity : 0}
              size={isMobile ? 78 : 112}
              onClick={() => handleSendMessage('NOX, audit system integrity and run test gates.')}
            />
          </div>
        </div>

        {/* Live Intelligence Transcript (Always preserves complete textual reasoning) */}
        <DialogueStream messages={messages} />
      </div>

      {/* Floating Integrated Command Rail with Real Frequency Spectrum */}
      <NoctaraChatInput
        onSendMessage={(msg) => handleSendMessage(msg)}
        onBargeIn={handleBargeIn}
        onEmergencyStop={handleEmergencyStop}
        isListening={isListening}
        onToggleListening={handleToggleListening}
        isEmergencyActive={isEmergencyActive}
        spectrum={audioSpectrum}
        isSpeaking={coreState === 'SPEAKING'}
        activeAgent={activeAgent}
      />

      {/* Live Diagnostic HUD (Section 31) */}
      <DiagnosticHUD
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        data={diagnosticData}
      />

      {/* Holographic Drawers */}
      <MemoryInspector
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onCorrectMemory={handleCorrectMemory}
        onAddMemory={handleAddMemory}
      />

      <AutonomyDock
        isOpen={isAutonomyOpen}
        onClose={() => setIsAutonomyOpen(false)}
        activePlan={activePlan}
        onStartTask={handleStartTask}
        onCancelTask={handleCancelTask}
      />
    </main>
  );
}

