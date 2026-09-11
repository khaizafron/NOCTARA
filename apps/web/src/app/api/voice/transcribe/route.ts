import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    let audioBase64 = '';
    let mimeType = 'audio/webm';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('audio') as Blob | null;
      if (!file) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
      }
      mimeType = file.type || 'audio/webm';
      const arrayBuffer = await file.arrayBuffer();
      audioBase64 = Buffer.from(arrayBuffer).toString('base64');
    } else {
      const body = await req.json();
      audioBase64 = body.audioBase64 || '';
      if (body.mimeType) mimeType = body.mimeType;
    }

    if (!audioBase64) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    // Clean MIME type (remove codecs parameter for Gemini inlineData compatibility)
    const cleanMimeType = mimeType.split(';')[0].trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMimeType,
                  data: audioBase64
                }
              },
              {
                text: 'Transcribe the spoken audio verbatim. If the speaker is speaking in Malay, English, or mixed Malay/English, transcribe accurately. If there is no discernible speech or only background silence/clicks, respond with exactly: EMPTY_SPEECH. Output ONLY the transcribed text with no markdown, notes, or explanations.'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[TRANSCRIBE API ERROR] Gemini returned ${res.status}:`, errText);
      return NextResponse.json({ error: 'Transcription service error' }, { status: 502 });
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!candidateText || candidateText.includes('EMPTY_SPEECH')) {
      return NextResponse.json({ text: '' });
    }

    return NextResponse.json({ text: candidateText });
  } catch (err: any) {
    console.error('[TRANSCRIBE API EXCEPTION]', err);
    return NextResponse.json({ error: err.message || 'Internal transcription failure' }, { status: 500 });
  }
}

