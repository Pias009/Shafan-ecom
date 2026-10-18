import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const STT_MODEL = process.env.KIRA_STT_MODEL || 'whisper-large-v3-turbo';
const MAX_BYTES = 8 * 1024 * 1024;

// Biases Whisper toward store vocabulary ("Kira" otherwise comes out as "Krah").
const VOCABULARY =
  'Kira, Hey Kira, Agent Kira, SHANFA, AED, dirhams, SKU, Tabby, Tamara, Stripe, COD, cash on delivery, ' +
  'orders, stock, restock, checkout, revenue, UAE, Saudi, Kuwait, Qatar, Bahrain, Oman';

// Whisper invents these on silence or noise; treat them as "nothing said".
const HALLUCINATIONS = /^(\.|you|thank you\.?|thanks\.?|thanks for watching!?|bye\.?|okay\.?)$/i;

/** Speech-to-text for Kira voice input (Groq Whisper). Body: multipart `audio` (+ optional `language`). */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: 'Voice input is not configured (GROQ_API_KEY)' }, { status: 503 });

  try {
    const form = await req.formData();
    const audio = form.get('audio');
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: 'No audio received' }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Recording is too long' }, { status: 413 });
    }

    const language = String(form.get('language') || 'en');
    const upstream = new FormData();
    const ext = audio.type.includes('mp4') ? 'mp4' : audio.type.includes('ogg') ? 'ogg' : 'webm';
    upstream.append('file', audio, `speech.${ext}`);
    upstream.append('model', STT_MODEL);
    upstream.append('response_format', 'json');
    upstream.append('temperature', '0');
    upstream.append('prompt', VOCABULARY);
    if (language !== 'auto') upstream.append('language', language);

    const res = await fetch(GROQ_STT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: upstream,
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.warn(`Kira STT: Groq returned ${res.status}:`, detail);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 502 });
    }

    const data = await res.json();
    const text = String(data.text || '').trim();
    return NextResponse.json({ text: HALLUCINATIONS.test(text) ? '' : text });
  } catch (error: any) {
    console.error('Kira STT error:', error?.message || error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
