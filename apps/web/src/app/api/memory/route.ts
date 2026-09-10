import { NextResponse } from 'next/server';
import { serverCore } from '@/lib/server-core';

export async function GET() {
  const memories = serverCore.memory.getAllMemories();
  return NextResponse.json({ memories });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'correct') {
      const record = await serverCore.memory.correctMemory(body.id, body.newContent, body.reason);
      return NextResponse.json({ record });
    } else {
      const record = await serverCore.memory.createMemory({
        scope: body.scope || 'root',
        layer: body.layer || 'identity',
        type: body.type || 'FACT',
        content: body.content,
        sourceType: body.sourceType || 'owner_statement',
        confidence: body.confidence ?? 1.0,
        importance: body.importance ?? 1.0
      });
      return NextResponse.json({ record });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
