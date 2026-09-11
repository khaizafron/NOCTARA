import { NextResponse } from 'next/server';
import { getServerCore } from '@/lib/server-core';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const core = getServerCore();
    const turns = await core.orchestrator.executeConversation(message);
    return NextResponse.json({ turns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Turn execution failed' }, { status: 500 });
  }
}
