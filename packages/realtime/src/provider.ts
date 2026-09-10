import { NoctaraEvent, NoctaraEventType, AgentId, AgentState } from '@noctara/shared';
import { EventEmitter } from 'node:events';

export interface AgentPresenceState {
  agentId: AgentId;
  state: AgentState;
  lastActive: string;
}

export interface RealtimeRoomProvider {
  broadcast<T>(event: NoctaraEvent<T>): Promise<void>;
  subscribe<T>(
    eventType: NoctaraEventType | '*',
    handler: (event: NoctaraEvent<T>) => void
  ): () => void;
}

export class LocalRealtimeRoomProvider implements RealtimeRoomProvider {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  public async broadcast<T>(event: NoctaraEvent<T>): Promise<void> {
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);
  }

  public subscribe<T>(
    eventType: NoctaraEventType | '*',
    handler: (event: NoctaraEvent<T>) => void
  ): () => void {
    this.emitter.on(eventType, handler);
    return () => {
      this.emitter.off(eventType, handler);
    };
  }
}

export const globalRealtimeRoom = new LocalRealtimeRoomProvider();
