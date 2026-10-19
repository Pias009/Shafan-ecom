'use client';

// Voice engine for Agent Kira: speech in (mic → silence detection → Groq Whisper),
// speech out (Groq Orpheus natural voice, then a built-in in-browser voice, then
// the browser's own speech synthesis),
// and an optional "Hey Kira" wake word.

export type KiraVoiceSettings = {
  /** Groq Orpheus voice id, used when the natural voice is available. */
  voice: string;
  /** Browser voice used as fallback ('' = best available). */
  browserVoiceURI: string;
  rate: number;
  /** After Kira answers a spoken question, listen again automatically. */
  conversation: boolean;
  /** Listen in the background for "Hey Kira". */
  wakeWord: boolean;
  /** Kira greets you out loud and starts the conversation when you open HQ. */
  autoGreet: boolean;
  language: 'en' | 'auto';
};

export const DEFAULT_VOICE_SETTINGS: KiraVoiceSettings = {
  voice: 'autumn',
  browserVoiceURI: '',
  rate: 1,
  conversation: true,
  wakeWord: false,
  autoGreet: true,
  language: 'en',
};

export const NATURAL_VOICES = [
  { id: 'autumn', label: 'Autumn (female)' },
  { id: 'diana', label: 'Diana (female)' },
  { id: 'hannah', label: 'Hannah (female)' },
  { id: 'austin', label: 'Austin (male)' },
  { id: 'daniel', label: 'Daniel (male)' },
  { id: 'troy', label: 'Troy (male)' },
];

const SETTINGS_KEY = 'kira-voice-settings';
const NATURAL_OFF_KEY = 'kira-natural-voice-off';

export function loadVoiceSettings(): KiraVoiceSettings {
  try {
    return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(s: KiraVoiceSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

/* ------------------------------------------------------------------ */
/* Text preparation                                                    */
/* ------------------------------------------------------------------ */

export function cleanForSpeech(text: string): string {
  return text
    .replace(/(^|\n)\s*—?\s*Live data[^\n]*/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\bAED\s?([\d,.]+)/g, '$1 dirhams')
    .replace(/→/g, ' to ')
    .replace(/[·|]/g, ', ')
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Sentence-sized chunks: faster first audio, and avoids Chrome cutting long speech. */
export function splitForSpeech(text: string, max = 220): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const out: string[] = [];
  let buf = '';
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if ((buf + ' ' + s).trim().length <= max) {
      buf = (buf + ' ' + s).trim();
    } else {
      if (buf) out.push(buf);
      if (s.length <= max) buf = s;
      else {
        // Very long sentence: split on commas / spaces.
        let rest = s;
        while (rest.length > max) {
          const cut = Math.max(rest.lastIndexOf(', ', max), rest.lastIndexOf(' ', max));
          const at = cut > 40 ? cut + 1 : max;
          out.push(rest.slice(0, at).trim());
          rest = rest.slice(at).trim();
        }
        buf = rest;
      }
    }
  }
  if (buf) out.push(buf);
  return out;
}

/* ------------------------------------------------------------------ */
/* Shared audio context                                                */
/* ------------------------------------------------------------------ */

let sharedCtx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') sharedCtx = new Ctor();
  if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

function rmsOf(analyser: AnalyserNode, buf: Float32Array<ArrayBuffer>): number {
  analyser.getFloatTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

/* ------------------------------------------------------------------ */
/* Built-in voice (Piper, runs in the browser)                         */
/* ------------------------------------------------------------------ */

// Guarantees Kira can always talk: no API key or model terms, and it works in
// browsers with no speech voices installed (Chrome on Linux has none). The model
// (~60 MB) downloads once while the lock screen shows, then lives in OPFS.
const LOCAL_VOICE_ID = 'en_US-hfc_female-medium';
// Must match the installed onnxruntime-web version (package.json pins it).
const LOCAL_WASM_PATHS = {
  onnxWasm: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/',
  piperData: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data',
  piperWasm: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm',
};

export type LocalVoiceState = { status: 'idle' | 'loading' | 'ready' | 'failed'; progress: number; error?: string };

type PiperSession = { predict: (text: string) => Promise<Blob> };

let localState: LocalVoiceState = { status: 'idle', progress: 0 };
let localSession: Promise<PiperSession | null> | null = null;
let localQueue: Promise<unknown> = Promise.resolve();
const localListeners = new Set<(s: LocalVoiceState) => void>();

function setLocalState(s: LocalVoiceState) {
  localState = s;
  localListeners.forEach((fn) => fn(s));
}

export function getLocalVoiceState() {
  return localState;
}

export function onLocalVoiceState(fn: (s: LocalVoiceState) => void): () => void {
  localListeners.add(fn);
  return () => { localListeners.delete(fn); };
}

/** Load the built-in voice (downloads the model the first time). Safe to call repeatedly. */
export function prepareLocalVoice(): Promise<PiperSession | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (localSession) return localSession;
  setLocalState({ status: 'loading', progress: 0 });
  localSession = (async () => {
    try {
      const { TtsSession } = await import('@mintplex-labs/piper-tts-web');
      const session = await TtsSession.create({
        voiceId: LOCAL_VOICE_ID,
        wasmPaths: LOCAL_WASM_PATHS,
        progress: (p) => {
          if (p.url.startsWith('tts://') || !p.total || localState.status !== 'loading') return;
          setLocalState({ status: 'loading', progress: Math.min(99, Math.round((p.loaded / p.total) * 100)) });
        },
      });
      // Warm up the phonemizer and model so the first real sentence starts quickly.
      await session.predict('Hi.').catch(() => {});
      setLocalState({ status: 'ready', progress: 100 });
      return session;
    } catch (e: any) {
      console.warn('Kira: built-in voice failed to load', e);
      setLocalState({ status: 'failed', progress: 0, error: e?.message || 'Could not load the built-in voice' });
      localSession = null; // allow a retry later
      return null;
    }
  })();
  return localSession;
}

/** One synthesis at a time: the ONNX session can't run two inferences at once. */
function synthesizeLocal(session: PiperSession, text: string): Promise<Blob> {
  const run = localQueue.then(() => session.predict(text));
  localQueue = run.catch(() => {});
  return run;
}

function browserVoicesAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.getVoices().length > 0;
}

/* ------------------------------------------------------------------ */
/* Speaker                                                             */
/* ------------------------------------------------------------------ */

export type SpeakHandlers = { onStart?: () => void; onEnd?: () => void };
export type VoiceProvider = 'natural' | 'local' | 'browser' | null;

export class KiraSpeaker {
  private generation = 0;
  private audio: HTMLAudioElement | null = null;
  private analyser: AnalyserNode | null = null;
  private buf = new Float32Array(1024);
  private browserSpeaking = false;
  /** null = not tried yet this session */
  naturalAvailable: boolean | null = null;
  lastNaturalError = '';
  /** Which engine voiced the last reply. */
  provider: VoiceProvider = null;

  constructor() {
    try {
      if (sessionStorage.getItem(NATURAL_OFF_KEY)) this.naturalAvailable = false;
    } catch {}
  }

  /** 0..1 loudness of what Kira is saying, for the orb animation. */
  level(): number {
    if (this.analyser && this.audio && !this.audio.paused) return Math.min(1, rmsOf(this.analyser, this.buf) * 4);
    if (this.browserSpeaking) return 0.35 + 0.25 * Math.sin(Date.now() / 90);
    return 0;
  }

  stop() {
    this.generation++;
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.analyser = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    this.browserSpeaking = false;
  }

  async speak(text: string, settings: KiraVoiceSettings, handlers: SpeakHandlers = {}) {
    this.stop();
    const gen = this.generation;
    let chunks = splitForSpeech(cleanForSpeech(text));
    if (chunks.length === 0) { handlers.onEnd?.(); return; }

    let started = false;
    const markStart = () => { if (!started) { started = true; handlers.onStart?.(); } };

    try {
      // 1. Groq natural voice.
      if (this.naturalAvailable !== false) {
        const played = await this.playChunks(chunks, (t) => this.fetchChunk(t, settings.voice), settings, gen, markStart, true);
        if (played > 0) this.provider = 'natural';
        if (gen !== this.generation) return;
        if (played === chunks.length) return;
        chunks = chunks.slice(played);
      }

      // 2. Built-in voice if it's ready, or if the browser has no voice to fall back on (wait for it).
      if (localState.status === 'ready' || !browserVoicesAvailable()) {
        const session = await prepareLocalVoice();
        if (gen !== this.generation) return;
        if (session) {
          const played = await this.playChunks(chunks, (t) => synthesizeLocal(session, t), settings, gen, markStart);
          if (played > 0) this.provider = 'local';
          if (gen !== this.generation || played === chunks.length) return;
          chunks = chunks.slice(played);
        }
      }

      // 3. Browser speech synthesis.
      this.provider = 'browser';
      await this.speakBrowser(chunks, settings, gen, markStart);
    } finally {
      if (gen === this.generation) handlers.onEnd?.();
    }
  }

  private fetchChunk(text: string, voice: string): Promise<Blob> {
    return fetch('/api/admin/kira/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    }).then(async (res) => {
      if (res.ok) return res.blob();
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.message || err.code || `HTTP ${res.status}`) as Error & { code?: string; status?: number };
      e.code = err.code;
      e.status = res.status;
      throw e;
    });
  }

  /**
   * Plays chunks as audio, producing the next one while the current one plays.
   * Returns how many chunks were played; the caller voices the rest another way.
   */
  private async playChunks(
    chunks: string[],
    produce: (text: string) => Promise<Blob>,
    settings: KiraVoiceSettings,
    gen: number,
    markStart: () => void,
    natural = false,
  ): Promise<number> {
    const pending: Promise<Blob>[] = [produce(chunks[0])];
    pending[0].catch(() => {});

    for (let i = 0; i < chunks.length; i++) {
      if (gen !== this.generation) return i;
      if (i + 1 < chunks.length) {
        pending[i + 1] = produce(chunks[i + 1]);
        pending[i + 1].catch(() => {});
      }

      let blob: Blob;
      try {
        blob = await pending[i];
      } catch (e: any) {
        // Permanent problems (terms not accepted, bad voice, not configured): stop trying this session.
        if (natural && e?.status !== 429 && e?.status !== 500) {
          this.naturalAvailable = false;
          this.lastNaturalError = e?.code === 'model_terms_required'
            ? 'Natural voice needs the Groq model terms accepted by your Groq org admin.'
            : `Natural voice unavailable (${e?.code || e?.message || 'error'}).`;
          try { sessionStorage.setItem(NATURAL_OFF_KEY, '1'); } catch {}
        }
        return i;
      }
      if (natural) this.naturalAvailable = true;

      const url = URL.createObjectURL(blob);
      try {
        await this.playUrl(url, settings.rate, gen, markStart);
      } catch {
        return i;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    return chunks.length;
  }

  private playUrl(url: string, rate: number, gen: number, markStart: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (gen !== this.generation) return resolve();
      const audio = new Audio(url);
      audio.playbackRate = rate;
      this.audio = audio;
      const ctx = audioCtx();
      // Only route through the analyser when the context is running; a suspended
      // context would swallow the sound.
      if (ctx && ctx.state === 'running') {
        try {
          const src = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 1024;
          src.connect(analyser);
          analyser.connect(ctx.destination);
          this.analyser = analyser;
        } catch {}
      }
      audio.onplaying = () => markStart();
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('playback failed'));
      audio.onpause = () => { if (gen !== this.generation) resolve(); };
      audio.play().catch(reject);
    });
  }

  private pickBrowserVoice(uri: string): SpeechSynthesisVoice | undefined {
    const voices = window.speechSynthesis.getVoices();
    if (uri) {
      const v = voices.find((x) => x.voiceURI === uri);
      if (v) return v;
    }
    const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    const rank = [/natural/i, /neural/i, /aria|jenny|libby|sonia/i, /google uk english female/i, /samantha|karen|moira|tessa|serena/i, /google us english/i, /female/i];
    for (const r of rank) {
      const v = en.find((x) => r.test(x.name));
      if (v) return v;
    }
    return en[0] || voices[0];
  }

  private async speakBrowser(chunks: string[], settings: KiraVoiceSettings, gen: number, markStart: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (synth.getVoices().length === 0) {
      await new Promise<void>((r) => {
        const t = setTimeout(r, 800);
        synth.addEventListener('voiceschanged', () => { clearTimeout(t); r(); }, { once: true });
      });
    }
    const voice = this.pickBrowserVoice(settings.browserVoiceURI);

    for (const chunk of chunks) {
      if (gen !== this.generation) return;
      await new Promise<void>((resolve) => {
        // Some browsers never fire onend (known Chrome bug); don't let Kira hang "speaking".
        const watchdog = setTimeout(() => { synth.cancel(); resolve(); }, Math.max(3000, (chunk.length * 85) / settings.rate) + 2500);
        const done = () => { clearTimeout(watchdog); resolve(); };
        const u = new SpeechSynthesisUtterance(chunk);
        if (voice) u.voice = voice;
        u.rate = settings.rate;
        u.pitch = 1.03;
        u.onstart = () => { this.browserSpeaking = true; markStart(); };
        u.onend = done;
        u.onerror = done;
        synth.speak(u);
      });
    }
    this.browserSpeaking = false;
  }
}

/* ------------------------------------------------------------------ */
/* Listener                                                            */
/* ------------------------------------------------------------------ */

export type ListenPhase = 'listening' | 'transcribing' | 'idle';

type ListenOptions = {
  language: 'en' | 'auto';
  onPhase: (p: ListenPhase) => void;
  onInterim?: (text: string) => void;
  onResult: (text: string) => void;
  onError: (message: string) => void;
};

type WakeOptions = {
  language: 'en' | 'auto';
  /** "Hey Kira" alone. */
  onWake: () => void;
  /** "Hey Kira, how are sales?" — the part after the wake word. */
  onWakeCommand: (text: string) => void;
  onError: (message: string) => void;
};

const WAKE_RE = /^\W*(?:(?:hey|hi|ok|okay|hello|yo)\W+)?(?:agent\W+)?(?:kira|kiera|keira|kyra|kera|kara|keera|cira)\b\W*(.*)$/i;
const SPEECH_RECOGNITION_FAILED_KEY = 'kira-webspeech-failed';

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

export async function transcribe(blob: Blob, language: 'en' | 'auto'): Promise<string> {
  const form = new FormData();
  form.append('audio', blob, 'speech');
  form.append('language', language);
  const res = await fetch('/api/admin/kira/transcribe', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Transcription failed');
  return String(data.text || '').trim();
}

export class KiraListener {
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private buf = new Float32Array(1024);
  private timer: ReturnType<typeof setInterval> | null = null;
  private recorder: MediaRecorder | null = null;
  private recognition: any = null;
  private session = 0;
  private currentLevel = 0;
  private wakeTimestamps: number[] = [];
  private finishCurrent: (() => void) | null = null;
  mode: 'off' | 'command' | 'wake' = 'off';

  static supported(): boolean {
    return typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  }

  /** 0..1 mic loudness, for the orb animation. */
  level(): number {
    return this.currentLevel;
  }

  /** Ask for the microphone (permission prompt) without starting to listen. */
  async prepareMic() {
    await this.ensureStream();
  }

  private async ensureStream() {
    if (this.stream && this.stream.getAudioTracks().some((t) => t.readyState === 'live')) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const ctx = audioCtx();
    if (ctx) {
      const src = ctx.createMediaStreamSource(this.stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      src.connect(this.analyser);
    }
  }

  private rms(): number {
    return this.analyser ? rmsOf(this.analyser, this.buf) : 0;
  }

  private stopLoop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.currentLevel = 0;
  }

  private stopRecognition() {
    try { this.recognition?.abort(); } catch {}
    this.recognition = null;
  }

  /** Stop listening. `release` also turns the microphone off. */
  stop(release = false) {
    this.session++;
    this.mode = 'off';
    this.finishCurrent = null;
    this.stopLoop();
    this.stopRecognition();
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.ondataavailable = null;
      this.recorder.onstop = null;
      try { this.recorder.stop(); } catch {}
    }
    this.recorder = null;
    if (release && this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.analyser = null;
    }
  }

  private micError(e: any): string {
    if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') {
      return 'Microphone access is blocked. Allow the microphone for this site (address bar → site settings) and try again.';
    }
    if (e?.name === 'NotFoundError') return 'No microphone was found on this device.';
    return 'Could not start the microphone.';
  }

  private startCaptions(language: 'en' | 'auto', onInterim?: (t: string) => void) {
    if (!onInterim) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try { if (sessionStorage.getItem(SPEECH_RECOGNITION_FAILED_KEY)) return; } catch {}
    try {
      const rec = new SR();
      rec.lang = language === 'en' ? 'en-US' : navigator.language || 'en-US';
      rec.interimResults = true;
      rec.continuous = true;
      rec.onresult = (ev: any) => {
        let t = '';
        for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        onInterim(t.trim());
      };
      rec.onerror = (ev: any) => {
        // Brave and some browsers block the speech service; captions are optional.
        if (['network', 'service-not-allowed', 'not-allowed'].includes(ev?.error)) {
          try { sessionStorage.setItem(SPEECH_RECOGNITION_FAILED_KEY, '1'); } catch {}
        }
      };
      rec.start();
      this.recognition = rec;
    } catch {}
  }

  /** Capture one spoken command; stops by itself when you stop talking. */
  async listenOnce(opts: ListenOptions) {
    this.stop();
    const session = this.session;
    this.mode = 'command';
    try {
      await this.ensureStream();
    } catch (e) {
      this.mode = 'off';
      opts.onPhase('idle');
      opts.onError(this.micError(e));
      return;
    }
    if (session !== this.session) return;

    const mime = pickMime();
    const recorder = new MediaRecorder(this.stream!, mime ? { mimeType: mime } : undefined);
    this.recorder = recorder;
    const parts: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };

    let heardSpeech = false;
    let speechMs = 0;
    let silenceMs = 0;
    let elapsed = 0;
    // Adaptive noise floor: drops instantly to quieter readings, rises slowly. Works even
    // when the admin starts talking the moment they tap the mic.
    let noise = 0.008;
    const TICK = 50;

    const finish = (hadSpeech: boolean) => {
      if (session !== this.session) return;
      this.stopLoop();
      this.stopRecognition();
      recorder.onstop = async () => {
        if (session !== this.session) return;
        this.mode = 'off';
        if (!hadSpeech) {
          opts.onPhase('idle');
          opts.onResult('');
          return;
        }
        opts.onPhase('transcribing');
        try {
          const text = await transcribe(new Blob(parts, { type: recorder.mimeType || 'audio/webm' }), opts.language);
          if (session !== this.session) return;
          opts.onPhase('idle');
          opts.onResult(text);
        } catch (e: any) {
          if (session !== this.session) return;
          opts.onPhase('idle');
          opts.onError(e?.message || 'Could not understand the recording.');
        }
      };
      try { recorder.stop(); } catch {}
    };

    this.finishCurrent = () => finish(true);
    recorder.start(250);
    opts.onPhase('listening');
    this.startCaptions(opts.language, opts.onInterim);

    this.timer = setInterval(() => {
      const r = this.rms();
      elapsed += TICK;
      noise = r < noise ? r : noise + (r - noise) * 0.005;
      const threshold = Math.min(0.045, Math.max(0.012, noise * 2.5));
      this.currentLevel = Math.min(1, r * 6);

      if (r > threshold) {
        speechMs += TICK;
        silenceMs = 0;
        if (speechMs >= 150) heardSpeech = true;
      } else {
        silenceMs += TICK;
      }

      if (heardSpeech && silenceMs >= 1300) finish(true); // natural pause = done
      else if (!heardSpeech && elapsed >= 7000) finish(false); // nobody spoke
      else if (elapsed >= 20000) finish(heardSpeech); // hard cap
    }, TICK);
  }

  /** Finish the current command early (e.g. user taps the mic again) and transcribe what was said. */
  finishNow() {
    if (this.mode === 'command') this.finishCurrent?.();
  }

  /** Background "Hey Kira" detection. Speech clips are sent for transcription only when someone talks. */
  async listenForWake(opts: WakeOptions) {
    this.stop();
    const session = this.session;
    this.mode = 'wake';
    try {
      await this.ensureStream();
    } catch (e) {
      this.mode = 'off';
      opts.onError(this.micError(e));
      return;
    }
    if (session !== this.session) return;

    const mime = pickMime();
    const TICK = 50;
    let recorder: MediaRecorder;
    let parts: Blob[] = [];
    let speechMs = 0;
    let silenceMs = 0;
    let segmentMs = 0;
    let idleMs = 0;
    let inSpeech = false;
    let floor = 0.01;

    const startRecorder = () => {
      parts = [];
      recorder = new MediaRecorder(this.stream!, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
      recorder.start(250);
      this.recorder = recorder;
      idleMs = 0;
    };

    const flush = (send: boolean) => {
      const rec = recorder;
      const captured = parts;
      rec.onstop = async () => {
        if (!send || session !== this.session) return;
        // Throttle: at most 10 clips a minute.
        const now = Date.now();
        this.wakeTimestamps = this.wakeTimestamps.filter((t) => now - t < 60_000);
        if (this.wakeTimestamps.length >= 10) return;
        this.wakeTimestamps.push(now);
        try {
          const text = await transcribe(new Blob(captured, { type: rec.mimeType || 'audio/webm' }), opts.language);
          if (session !== this.session) return;
          const m = text.match(WAKE_RE);
          if (!m) return;
          const rest = (m[1] || '').trim();
          if (rest.replace(/\W/g, '').length >= 3) opts.onWakeCommand(rest);
          else opts.onWake();
        } catch {}
      };
      try { rec.stop(); } catch {}
      if (session === this.session && this.mode === 'wake') startRecorder();
    };

    startRecorder();
    this.timer = setInterval(() => {
      const r = this.rms();
      this.currentLevel = 0;
      if (!inSpeech) floor = floor * 0.97 + r * 0.03; // adapt to room noise
      const threshold = Math.min(0.05, Math.max(0.015, floor * 2.5));

      if (r > threshold) {
        speechMs += TICK;
        silenceMs = 0;
        if (speechMs >= 120) inSpeech = true;
      } else {
        silenceMs += TICK;
        if (!inSpeech) speechMs = 0;
      }

      if (inSpeech) {
        segmentMs += TICK;
        if (silenceMs >= 700 || segmentMs >= 8000) {
          const longEnough = segmentMs >= 400;
          inSpeech = false;
          speechMs = 0;
          segmentMs = 0;
          flush(longEnough);
        }
      } else {
        idleMs += TICK;
        // Keep the rolling recording short while the room is quiet.
        if (idleMs >= 6000) flush(false);
      }
    }, TICK);
  }
}
