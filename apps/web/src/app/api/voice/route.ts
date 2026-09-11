import { NextRequest, NextResponse } from 'next/server';
import { AgentId } from '@noctara/shared';

export async function POST(req: NextRequest) {
  try {
    const { text, agentId } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json({ fallback: true, reason: 'ELEVENLABS_API_KEY not configured' });
    }

    const noxVoiceId = process.env.ELEVENLABS_NOX_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9';
    const ariaVoiceId = process.env.ELEVENLABS_ARIA_VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2';
    const voiceId = agentId === 'NOX' ? noxVoiceId : ariaVoiceId;

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: agentId === 'NOX' ? 0.65 : 0.45,
          similarity_boost: 0.85
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[VOICE API WARNING] ElevenLabs synthesis failed (${res.status}): ${errText}`);
      return NextResponse.json({ fallback: true, error: errText }, { status: 200 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err: any) {
    console.error('[VOICE API ERROR]', err);
    return NextResponse.json({ fallback: true, error: err.message }, { status: 200 });
  }
}
