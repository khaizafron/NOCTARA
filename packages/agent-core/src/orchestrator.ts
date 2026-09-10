import { AgentId } from '@noctara/shared';
import { AgentRuntime } from './runtime.js';

export type OrchestrationDecision = 'NOX' | 'ARIA' | 'BOTH' | 'SILENCE' | 'DEBATE';

export interface DialogueTurn {
  speaker: 'ROOT' | 'NOX' | 'ARIA';
  content: string;
  timestamp: string;
}

export class ThreeWayOrchestrator {
  private nox: AgentRuntime;
  private aria: AgentRuntime;

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

    // 2. Both / Debate check
    if (
      text.includes('both') ||
      text.includes('debate') ||
      text.includes('what do you think') ||
      text.includes('discuss') ||
      text.includes('should we')
    ) {
      return text.includes('debate') ? 'DEBATE' : 'BOTH';
    }

    // 3. Topic classification
    const techKeywords = ['code', 'git', 'test', 'bug', 'deploy', 'error', 'database', 'script', 'worker', 'build'];
    const strategyKeywords = ['why', 'remember', 'context', 'future', 'project', 'plan', 'history', 'feeling', 'reflect'];

    const hasTech = techKeywords.some((k) => text.includes(k));
    const hasStrategy = strategyKeywords.some((k) => text.includes(k));

    if (hasTech && !hasStrategy) return 'NOX';
    if (hasStrategy && !hasTech) return 'ARIA';

    return 'BOTH';
  }

  public async executeConversation(
    userMessage: string,
    onSpeakerTurn?: (turn: DialogueTurn) => void
  ): Promise<DialogueTurn[]> {
    const decision = this.decideTurn(userMessage);
    const turns: DialogueTurn[] = [];
    const now = () => new Date().toISOString();

    if (decision === 'NOX') {
      const { response } = await this.nox.processMessage(userMessage);
      const turn: DialogueTurn = { speaker: 'NOX', content: response, timestamp: now() };
      turns.push(turn);
      onSpeakerTurn?.(turn);
      return turns;
    }

    if (decision === 'ARIA') {
      const { response } = await this.aria.processMessage(userMessage);
      const turn: DialogueTurn = { speaker: 'ARIA', content: response, timestamp: now() };
      turns.push(turn);
      onSpeakerTurn?.(turn);
      return turns;
    }

    if (decision === 'BOTH') {
      const isTechBiased = userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('system');
      const first = isTechBiased ? this.nox : this.aria;
      const second = isTechBiased ? this.aria : this.nox;

      const firstRes = await first.processMessage(userMessage);
      const firstTurn: DialogueTurn = { speaker: first.agentId, content: firstRes.response, timestamp: now() };
      turns.push(firstTurn);
      onSpeakerTurn?.(firstTurn);

      const secondRes = await second.processMessage(
        `Khai said: "${userMessage}"\n${first.agentId} replied: "${firstRes.response}"\nProvide your perspective.`
      );
      const secondTurn: DialogueTurn = { speaker: second.agentId, content: secondRes.response, timestamp: now() };
      turns.push(secondTurn);
      onSpeakerTurn?.(secondTurn);

      return turns;
    }

    if (decision === 'DEBATE') {
      const r1Nox = await this.nox.processMessage(userMessage);
      const t1: DialogueTurn = { speaker: 'NOX', content: r1Nox.response, timestamp: now() };
      turns.push(t1);
      onSpeakerTurn?.(t1);

      const r1Aria = await this.aria.processMessage(`Topic: "${userMessage}"\nNOX argued: "${r1Nox.response}"\nOffer strategic critique.`);
      const t2: DialogueTurn = { speaker: 'ARIA', content: r1Aria.response, timestamp: now() };
      turns.push(t2);
      onSpeakerTurn?.(t2);

      const r2Nox = await this.nox.processMessage(`ARIA countered: "${r1Aria.response}"\nProvide final technical response.`);
      const t3: DialogueTurn = { speaker: 'NOX', content: r2Nox.response, timestamp: now() };
      turns.push(t3);
      onSpeakerTurn?.(t3);

      return turns;
    }

    return [];
  }
}
