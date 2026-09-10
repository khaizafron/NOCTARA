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

  const [providerStatus, setProviderStatus] = useState({
    gemini: 'unconfigured',
    tokenrouter: 'unconfigured',
    openrouter: 'unconfigured'
  });

  const fetchHealthAndMemories = useCallback(async () => {
    try {
      const [hRes, mRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/memory')
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setProviderStatus(hData.providers);
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
        content: 'NOCTARA command core active. Recognized human authority: Khai (ROOT). NOX and ARIA standing by.',
        timestamp: new Date().toISOString()
      }
    ]);
  }, [fetchHealthAndMemories]);

  const handleBargeIn = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCoreState('IDLE');
    setNoxState('IDLE');
    setAriaState('IDLE');
    setAudioActivity(0);
  }, []);

  const speakAgentResponse = useCallback((speaker: 'NOX' | 'ARIA', text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (speaker === 'NOX') {
      utterance.pitch = 0.8;
      utterance.rate = 1.05;
      setNoxState('SPEAKING');
    } else {
      utterance.pitch = 1.15;
      utterance.rate = 0.95;
      setAriaState('SPEAKING');
    }

    setCoreState('SPEAKING');
    setAudioActivity(0.7);

    utterance.onend = () => {
      setCoreState('IDLE');
      setNoxState('IDLE');
      setAriaState('IDLE');
      setAudioActivity(0);
    };

    utterance.onerror = () => {
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
          content: `Operational error: ${err.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
      setCoreState('ERROR_RECOVERY');
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
        setAudioActivity(0.4);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (event.results[0]?.isFinal && transcript) {
          handleSendMessage(transcript);
          setIsListening(false);
          setCoreState('IDLE');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setCoreState('IDLE');
        setAudioActivity(0);
      };

      recognition.onend = () => {
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
          ? 'Emergency Kill-Switch deactivated by ROOT. Operational capability restored.'
          : '[CRITICAL ALERT] Emergency Kill-Switch TRIGGERED. All tool operations halted.',
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
            content: `Dispatched autonomous plan for goal: "${goal}". Initialized across ${data.plan.steps?.length || 0} steps.`,
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
      body: JSON.stringify({ action: 'correct', id, newContent, reason: 'Corrected directly by ROOT' })
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
    <main className="flex flex-col h-screen w-screen bg-[#08090d] text-zinc-100 font-sans select-none overflow-hidden hologram-grid">
      <TelemetryBar
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenAutonomy={() => setIsAutonomyOpen(true)}
        providerStatus={providerStatus}
        memoryCount={memories.length}
      />

      <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-hidden relative">
        <div className="flex items-center justify-around w-full max-w-4xl py-2">
          <AgentPresence agentId="ARIA" state={ariaState} isSpeaking={ariaState === 'SPEAKING'} />
          <div className="flex flex-col items-center">
            <NoctaraCoreCanvas state={coreState} audioActivity={audioActivity} />
            <div className="text-center mt-[-10px]">
              <span className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
                STATE: {coreState}
              </span>
            </div>
          </div>
          <AgentPresence agentId="NOX" state={noxState} isSpeaking={noxState === 'SPEAKING'} />
        </div>

        <DialogueStream messages={messages} />
      </div>

      <CommandDock
        onSendMessage={handleSendMessage}
        onBargeIn={handleBargeIn}
        onEmergencyStop={handleEmergencyStop}
        isListening={isListening}
        onToggleListening={handleToggleListening}
        isEmergencyActive={isEmergencyActive}
      />

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
