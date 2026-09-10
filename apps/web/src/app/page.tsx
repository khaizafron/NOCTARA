'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentState, TaskPlan, MemoryRecord } from '@noctara/shared';

import { NoctaraCoreCanvas } from '../components/NoctaraCoreCanvas';
import { AgentPresence } from '../components/AgentPresence';
import { DialogueStream, MessageItem } from '../components/DialogueStream';
import { CommandDock } from '../components/CommandDock';
import { TelemetryBar } from '../components/TelemetryBar';
import { MemoryInspector } from '../components/MemoryInspector';
import { AutonomyDock } from '../components/AutonomyDock';

export default function NoctaraRoomPage() {
  const [coreState, setCoreState] = useState<AgentState>('IDLE');
  const [noxState, setNoxState] = useState<AgentState>('IDLE');
  const [ariaState, setAriaState] = useState<AgentState>('IDLE');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [audioActivity, setAudioActivity] = useState(0);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isAutonomyOpen, setIsAutonomyOpen] = useState(false);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [activePlan, setActivePlan] = useState<TaskPlan | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioIntervalRef = useRef<any>(null);

  const [providerStatus, setProviderStatus] = useState({
    gemini: 'online',
    tokenrouter: 'online',
    openrouter: 'online'
  });

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
        speaker: 'SYSTEM',
        content: 'NOCTARA intelligence chamber initialized. Recognized human authority: Khai (ROOT). NOX and ARIA standing by.',
        timestamp: new Date().toISOString()
      }
    ]);
  }, [fetchHealthAndMemories]);

  // Barge-in: interrupt speech and stop all audio immediately
  const handleBargeIn = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    setCoreState('IDLE');
    setNoxState('IDLE');
    setAriaState('IDLE');
    setAudioActivity(0);
  }, []);

  // Voice synthesis with synchronized audio wave modulation
  const speakAgentResponse = useCallback((speaker: 'NOX' | 'ARIA', text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);

    const utterance = new SpeechSynthesisUtterance(text);
    if (speaker === 'NOX') {
      utterance.pitch = 0.82;
      utterance.rate = 1.05;
      setNoxState('SPEAKING');
      setAriaState('IDLE');
    } else {
      utterance.pitch = 1.15;
      utterance.rate = 0.96;
      setAriaState('SPEAKING');
      setNoxState('IDLE');
    }

    setCoreState('SPEAKING');

    // Dynamic audio activity simulation while speech synthesizes
    audioIntervalRef.current = setInterval(() => {
      setAudioActivity(0.35 + Math.random() * 0.55);
    }, 100);

    utterance.onend = () => {
      clearInterval(audioIntervalRef.current);
      setCoreState('IDLE');
      setNoxState('IDLE');
      setAriaState('IDLE');
      setAudioActivity(0);
    };

    utterance.onerror = () => {
      clearInterval(audioIntervalRef.current);
      setCoreState('IDLE');
      setNoxState('IDLE');
      setAriaState('IDLE');
      setAudioActivity(0);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSendMessage = async (content: string) => {
    handleBargeIn();

    const userMsg: MessageItem = {
      id: `msg_${Date.now()}`,
      speaker: 'ROOT',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setCoreState('THINKING');
    setNoxState('THINKING');
    setAriaState('THINKING');

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

      for (const turn of turns) {
        const item: MessageItem = {
          id: `msg_${Date.now()}_${turn.speaker}`,
          speaker: turn.speaker,
          content: turn.content,
          timestamp: turn.timestamp
        };
        setMessages((prev) => [...prev, item]);
        speakAgentResponse(turn.speaker as 'NOX' | 'ARIA', turn.content);
      }

      fetchHealthAndMemories();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          speaker: 'SYSTEM',
          content: `Operational anomaly: ${err.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
      setCoreState('ERROR_RECOVERY');
      setTimeout(() => setCoreState('IDLE'), 3000);
    }
  };

  const handleToggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use text input or Chrome/Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setIsListening(false);
      setCoreState('IDLE');
      setAudioActivity(0);
    } else {
      handleBargeIn();
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setCoreState('LISTENING');
        audioIntervalRef.current = setInterval(() => {
          setAudioActivity(0.25 + Math.random() * 0.45);
        }, 120);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (event.results[0]?.isFinal && transcript) {
          clearInterval(audioIntervalRef.current);
          handleSendMessage(transcript);
          setIsListening(false);
          setCoreState('IDLE');
          setAudioActivity(0);
        }
      };

      recognition.onerror = () => {
        clearInterval(audioIntervalRef.current);
        setIsListening(false);
        setCoreState('IDLE');
        setAudioActivity(0);
      };

      recognition.onend = () => {
        clearInterval(audioIntervalRef.current);
        setIsListening(false);
        setCoreState('IDLE');
        setAudioActivity(0);
      };

      recognitionRef.current = recognition;
      recognition.start();
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
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleStartTask = async (goal: string) => {
    setCoreState('EXECUTING');
    setNoxState('EXECUTING');

    try {
      const res = await fetch('/api/autonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', goal })
      });
      const data = await res.json();
      if (data.plan) {
        setActivePlan(data.plan);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_task_${Date.now()}`,
            speaker: 'NOX',
            content: `Dispatched Level-4 autonomous operation: "${goal}". Initialized across ${data.plan.steps?.length || 0} tactical steps.`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch {
      // Handled
    }
    setCoreState('IDLE');
    setNoxState('IDLE');
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
    <main className="flex flex-col h-screen w-screen bg-[#030508] text-zinc-100 font-sans select-none overflow-hidden spatial-grid relative">
      {/* Corner Spatial Coordinates */}
      <div className="absolute top-12 left-6 text-[9px] font-mono text-zinc-600 tracking-widest pointer-events-none hidden lg:block">
        NOCTARA_CORE // CHAMBER_01 <br />
        STATUS: ONLINE
      </div>
      <div className="absolute top-12 right-6 text-[9px] font-mono text-zinc-600 tracking-widest text-right pointer-events-none hidden lg:block">
        AUTHORITY: ROOT_KHAI <br />
        CLEARANCE: LEVEL_5
      </div>

      {/* Top Aircraft Telemetry Bar */}
      <TelemetryBar
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenAutonomy={() => setIsAutonomyOpen(true)}
        providerStatus={providerStatus}
        memoryCount={memories.length}
      />

      {/* Main Environmental Chamber */}
      <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden relative z-10">
        {/* Spatial Intelligence Stage: ARIA - CORE - NOX */}
        <div className="relative flex items-center justify-center w-full max-w-4xl pt-1 sm:pt-2">
          {/* ARIA Spatial Presence Orbit (Left) */}
          <div className="flex-1 flex justify-end pr-2 sm:pr-8">
            <AgentPresence
              agentId="ARIA"
              state={ariaState}
              isSpeaking={ariaState === 'SPEAKING'}
              audioActivity={ariaState === 'SPEAKING' ? audioActivity : 0}
            />
          </div>

          {/* Central Luminous AI Intelligence Sphere */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <NoctaraCoreCanvas
              state={coreState}
              audioActivity={audioActivity}
              size={320}
            />
            {/* Core Telemetry Tag */}
            <div className="text-center mt-[-14px] z-20">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#070912]/80 border border-white/[0.08] text-zinc-400 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                CORE // {coreState}
              </span>
            </div>
          </div>

          {/* NOX Spatial Presence Orbit (Right) */}
          <div className="flex-1 flex justify-start pl-2 sm:pr-8">
            <AgentPresence
              agentId="NOX"
              state={noxState}
              isSpeaking={noxState === 'SPEAKING'}
              audioActivity={noxState === 'SPEAKING' ? audioActivity : 0}
            />
          </div>
        </div>

        {/* Live Intelligence Transcript */}
        <DialogueStream messages={messages} />
      </div>

      {/* Floating Integrated Command Rail */}
      <CommandDock
        onSendMessage={handleSendMessage}
        onBargeIn={handleBargeIn}
        onEmergencyStop={handleEmergencyStop}
        isListening={isListening}
        onToggleListening={handleToggleListening}
        isEmergencyActive={isEmergencyActive}
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
