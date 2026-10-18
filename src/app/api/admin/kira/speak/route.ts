import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';
const TTS_MODEL = process.env.KIRA_TTS_MODEL || 'canopylabs/orpheus-v1-english';
const DEFAULT_VOICE = process.env.KIRA_TTS_VOICE || 'autumn';
const MAX_CHARS = 400; // the client sends one sentence or two at a time

/**
 * Natural-voice text-to-speech for Kira (Groq Orpheus). Returns audio/wav.
 * On failure returns JSON `{ error, code }` so the client can fall back to the
 * browser's built-in voice (e.g. code `model_terms_required` until the Groq
 * org admin accepts the model terms).
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: 'Not configured', code: 'not_configured' }, { status: 503 });

  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body.text || '').trim().slice(0, MAX_CHARS);
    if (!text) return NextResponse.json({ error: 'No text', code: 'empty' }, { status: 400 });
    const voice = /^[a-z0-9_-]{2,40}$/i.test(String(body.voice || '')) ? String(body.voice) : DEFAULT_VOICE;

    const res = await fetch(GROQ_TTS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: TTS_MODEL, voice, input: text, response_format: 'wav' }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      let code = 'tts_failed';
      let message = '';
      try {
        const err = await res.json();
        code = err?.error?.code || code;
        message = err?.error?.message || '';
      } catch {}
      console.warn(`Kira TTS: Groq returned ${res.status} (${code}): ${message.slice(0, 300)}`);
      return NextResponse.json({ error: 'Voice unavailable', code, message }, { status: res.status === 429 ? 429 : 502 });
    }

    return new Response(res.body, {
      headers: { 'Content-Type': res.headers.get('content-type') || 'audio/wav', 'Cache-Control': 'private, no-store' },
    });
  } catch (error: any) {
    console.error('Kira TTS error:', error?.message || error);
    return NextResponse.json({ error: 'Voice unavailable', code: 'tts_failed' }, { status: 500 });
  }
}
