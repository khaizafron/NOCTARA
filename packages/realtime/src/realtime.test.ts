import { describe, it, expect } from 'vitest';
import { LocalRealtimeRoomProvider } from './provider.js';
import { NoctaraEvent } from '@noctara/shared';

describe('Realtime Room Provider', () => {
  it('broadcasts and dispatches strongly typed events', async () => {
    const room = new LocalRealtimeRoomProvider();
    let receivedPayload: any = null;

    const unsubscribe = room.subscribe('root.message.created', (event: NoctaraEvent<any>) => {
      receivedPayload = event.payload;
    });

    await room.broadcast({
      id: 'evt_1',
      type: 'root.message.created',
      timestamp: new Date().toISOString(),
      actor: 'ROOT',
      payload: { text: 'NOCTARA wake up' }
    });

    expect(receivedPayload).toEqual({ text: 'NOCTARA wake up' });
    unsubscribe();
  });
});
