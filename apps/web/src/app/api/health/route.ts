import { NextResponse } from 'next/server';
import { serverCore } from '@/lib/server-core';

export async function GET() {
  const gemini = serverCore.registry.getProvider('gemini');
  const tokenrouter = serverCore.registry.getProvider('tokenrouter');
  const openrouter = serverCore.registry.getProvider('openrouter');

  return NextResponse.json({
    status: 'ONLINE',
    rootUser: 'Khai (ROOT)',
    providers: {
      gemini: gemini?.isConfigured() ? 'online' : 'unconfigured',
      tokenrouter: tokenrouter?.isConfigured() ? 'online' : 'unconfigured',
      openrouter: openrouter?.isConfigured() ? 'online' : 'unconfigured'
    },
    memoryCount: serverCore.memory.getAllMemories().length
  });
}
