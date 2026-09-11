import { AgentId } from '@noctara/shared';
import { VoiceResponseFormatter } from '@noctara/voice';
import { AgentRuntime } from './runtime.js';

export type OrchestrationDecision = 'NOX' | 'ARIA' | 'BOTH' | 'SILENCE' | 'DEBATE';

export interface DialogueTurn {
  id: string;
  turnId: string;
  agentId?: AgentId;
  speaker: 'ROOT' | 'NOX' | 'ARIA';
  content: string;
  spokenText: string;
  timestamp: string;
}

export class ThreeWayOrchestrator {
  private nox: AgentRuntime;
  private aria: AgentRuntime;
  private lastSpeaker: 'NOX' | 'ARIA' = 'NOX';

  constructor(nox: AgentRuntime, aria: AgentRuntime) {
    this.nox = nox;
    this.aria = aria;
  }

  public decideTurn(userMessage: string): OrchestrationDecision {
    const text = userMessage.trim().toLowerCase();

    // 1. Direct address check
    if (text.startsWith('nox') || text.includes('@nox') || text.includes('hey nox')) {
      return 'NOX';
    }
    if (text.startsWith('aria') || text.includes('@aria') || text.includes('hey aria')) {
      return 'ARIA';
    }

    // 2. Both / Debate / Collaborative Task-Splitting check
    if (
      text.includes('both') ||
      text.includes('korang berdua') ||
      text.includes('kamu berdua') ||
      text.includes('diantara kamu') ||
      text.includes('debate') ||
      text.includes('what do you both think') ||
      text.includes('discuss together') ||
      text.includes('should we') ||
      text.includes('split') ||
      text.includes('split task') ||
      text.includes('bahagi task') ||
      text.includes('bahagikan') ||
      text.includes('dua-dua') ||
      text.includes('kedua-dua') ||
      text.includes('kalian') ||
      text.includes('cooperate') ||
      text.includes('collaborate') ||
      text.includes('plan and execute') ||
      text.includes('rancang dan buat') ||
      text.includes('rancang dan laksana') ||
      text.includes('lepastu') ||
      text.includes('kemudian')
    ) {
      return text.includes('debate') ? 'DEBATE' : 'BOTH';
    }

    // 3. Topic classification
    const techKeywords = ['code', 'git', 'deploy', 'error', 'database', 'script', 'worker', 'build', 'execute', 'terminal', 'compile'];
    const strategyKeywords = ['why', 'remember', 'context', 'future', 'project', 'plan', 'history', 'feeling', 'reflect', 'research', 'explore', 'design', 'vision'];

    const hasTech = techKeywords.some((k) => text.includes(k));
    const hasStrategy = strategyKeywords.some((k) => text.includes(k));

    if (hasTech && !hasStrategy) return 'NOX';
    if (hasStrategy && !hasTech) return 'ARIA';
    if (hasTech && hasStrategy) return 'BOTH';

    // 4. Dynamic turn alternation / random presence for general conversation
    // Alternate between NOX and ARIA so both feel actively present in the chamber
    return this.lastSpeaker === 'NOX' ? 'ARIA' : 'NOX';
  }

  public async executeConversation(
    userMessage: string,
    onSpeakerTurn?: (turn: DialogueTurn) => void
  ): Promise<DialogueTurn[]> {
    const decision = this.decideTurn(userMessage);
    const turns: DialogueTurn[] = [];
    const now = () => new Date().toISOString();
    const groupTurnId = `turn_grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const createTurn = (speaker: 'NOX' | 'ARIA', rawContent: string): DialogueTurn => {
      const formatted = VoiceResponseFormatter.formatSpokenResponse(rawContent, speaker);
      return {
        id: `turn_${speaker.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turnId: groupTurnId,
        agentId: speaker,
        speaker,
        content: rawContent,
        spokenText: formatted.spokenText,
        timestamp: now()
      };
    };

    if (decision === 'NOX') {
      const { response } = await this.nox.processMessage(userMessage);
      const turn = createTurn('NOX', response);
      turns.push(turn);
      onSpeakerTurn?.(turn);
    } else if (decision === 'ARIA') {
      const { response } = await this.aria.processMessage(userMessage);
      const turn = createTurn('ARIA', response);
      turns.push(turn);
      onSpeakerTurn?.(turn);
    } else if (decision === 'BOTH') {
      const isTechBiased = userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('system') || userMessage.toLowerCase().includes('exec');
      const isSplitIntent =
        userMessage.toLowerCase().includes('split') ||
        userMessage.toLowerCase().includes('bahagi') ||
        userMessage.toLowerCase().includes('dua-dua') ||
        userMessage.toLowerCase().includes('lepastu') ||
        userMessage.toLowerCase().includes('kemudian');

      // When splitting tasks, ARIA leads with strategic architecture and task division, NOX executes the technical operation
      const first = isSplitIntent ? this.aria : (isTechBiased ? this.nox : this.aria);
      const second = isSplitIntent ? this.nox : (isTechBiased ? this.aria : this.nox);

      const firstDirective = isSplitIntent
        ? `ROOT (Khai) commanded: "${userMessage}". As ARIA (Strategy Core), provide the strategic overview, architectural plan, and task division. Specify what NOX should execute.`
        : userMessage;

      const firstRes = await first.processMessage(firstDirective);
      const firstTurn = createTurn(first.agentId, firstRes.response);
      turns.push(firstTurn);
      onSpeakerTurn?.(firstTurn);

      const secondPrompt = isSplitIntent
        ? `Khai commanded: "${userMessage}"\nARIA planned: "${firstRes.response}"\nAs NOX (Execution Core), take over the operational/tactical execution immediately. Confirm system actions and verification to Sir Khai.`
        : `Khai said: "${userMessage}"\n${first.agentId} replied: "${firstRes.response}"\nProvide your distinct perspective. Do not repeat ${first.agentId}'s statements.`;

      const secondRes = await second.processMessage(secondPrompt);

      // Regression & deduplication guard: never output duplicate content or identical responses under two agents
      let cleanSecondContent = secondRes.response;
      if (cleanSecondContent.trim() === firstRes.response.trim()) {
        cleanSecondContent = second.agentId === 'ARIA'
          ? `I concur with ${first.agentId}'s technical evaluation, and recommend monitoring strategic continuity.`
          : `I have verified ${first.agentId}'s perspective against our execution invariants. Systems are aligned.`;
      }

      const secondTurn = createTurn(second.agentId, cleanSecondContent);
      turns.push(secondTurn);
      onSpeakerTurn?.(secondTurn);
    } else if (decision === 'DEBATE') {
      const r1Nox = await this.nox.processMessage(userMessage);
      const t1 = createTurn('NOX', r1Nox.response);
      turns.push(t1);
      onSpeakerTurn?.(t1);

      const r1Aria = await this.aria.processMessage(`Topic: "${userMessage}"\nNOX argued: "${r1Nox.response}"\nOffer strategic critique.`);
      let ariaContent = r1Aria.response;
      if (ariaContent.trim() === r1Nox.response.trim()) {
        ariaContent = `While NOX emphasizes immediate technical execution, we must evaluate long-term architectural stability.`;
      }
      const t2 = createTurn('ARIA', ariaContent);
      turns.push(t2);
      onSpeakerTurn?.(t2);

      const r2Nox = await this.nox.processMessage(`ARIA countered: "${ariaContent}"\nProvide final technical synthesis.`);
      let noxContent = r2Nox.response;
      if (noxContent.trim() === ariaContent.trim()) {
        noxContent = `Technical constraints factored. I will implement with defensive guardrails in place.`;
      }
      const t3 = createTurn('NOX', noxContent);
      turns.push(t3);
      onSpeakerTurn?.(t3);
    }

    if (turns.length > 0) {
      const finalSpeaker = turns[turns.length - 1].speaker;
      if (finalSpeaker === 'NOX' || finalSpeaker === 'ARIA') {
        this.lastSpeaker = finalSpeaker;
      }
    }

    return turns;
  }
}

