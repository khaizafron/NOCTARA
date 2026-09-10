import { NextResponse } from 'next/server';
import { serverCore } from '@/lib/server-core';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'start') {
      const plan = await serverCore.planner.createPlan(body.goal, 'NOX');
      // Kick off execution asynchronously in background
      serverCore.executor.executePlan(plan);
      return NextResponse.json({ plan });
    } else if (body.action === 'cancel') {
      const success = serverCore.executor.cancelPlan(body.planId);
      return NextResponse.json({ success });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
