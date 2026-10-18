'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Settings2, Square, Volume2, X } from 'lucide-react';
import { NATURAL_VOICES } from '@/lib/kira/voice';
import type { KiraVoice } from './useKiraVoice';

/** Round mic button: tap to talk, tap again to finish, tap while Kira speaks to interrupt. */
export function KiraMicButton({ voice, size = 'md' }: { voice: KiraVoice; size?: 'sm' | 'md' }) {
  const { phase } = voice;
  const busy = phase === 'transcribing' || phase === 'thinking';
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const icon = size === 'sm' ? 13 : 17;

  const label =
    phase === 'listening' ? 'Finish speaking' :
    phase === 'speaking' ? 'Interrupt Kira and speak' :
    busy ? 'Working…' : 'Talk to Kira';

  return (
    <button
      type="button"
      onClick={() => (phase === 'speaking' ? voice.startListening() : voice.toggleListening())}
      disabled={busy}
      title={label}
      aria-label={label}
      aria-pressed={phase === 'listening'}
      className={`relative ${dim} shrink-0 rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:cursor-wait ${
        phase === 'listening'
          ? 'bg-rose-500 text-white shadow-[0_0_0_4px_rgba(244,63,94,0.18),0_0_24px_rgba(244,63,94,0.45)]'
          : 'bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:brightness-110'
      }`}
    >
      {phase === 'listening' && <span className="absolute inset-0 rounded-xl bg-rose-500 animate-ping opacity-30" />}
      {busy ? (
        <Loader2 size={icon} className="animate-spin" />
      ) : phase === 'listening' ? (
        <Square size={icon - 3} className="relative fill-current" />
      ) : (
        <Mic size={icon} className="relative" />
      )}
    </button>
  );
}

function LevelBars({ getLevel }: { getLevel: () => number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const lvl = getLevel();
      const bars = ref.current?.children;
      if (bars) {
        for (let i = 0; i < bars.length; i++) {
          const h = 4 + Math.min(1, lvl * (0.6 + ((i * 37) % 10) / 10)) * 14;
          (bars[i] as HTMLElement).style.height = `${h}px`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getLevel]);
  return (
    <div ref={ref} className="flex items-center gap-[3px] h-5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="w-[3px] rounded-full bg-current transition-[height] duration-75" style={{ height: 4 }} />
      ))}
    </div>
  );
}

/** Live status line: listening with captions, thinking, speaking, or an error. */
export function KiraVoiceStatus({ voice }: { voice: KiraVoice }) {
  const { phase, interim, error } = voice;
  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
        <span className="flex-1">{error}</span>
        <button onClick={voice.clearError} className="p-0.5 hover:text-white" aria-label="Dismiss"><X size={13} /></button>
      </div>
    );
  }
  if (phase === 'idle') return null;

  const tone =
    phase === 'listening' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100' :
    phase === 'speaking' ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-slate-300';

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs ${tone}`} aria-live="polite">
      {phase === 'listening' || phase === 'speaking' ? <LevelBars getLevel={voice.level} /> : <Loader2 size={14} className="animate-spin" />}
      <div className="min-w-0 flex-1">
        <div className="font-medium">
          {phase === 'listening' && 'Listening… speak naturally, I’ll stop when you pause'}
          {phase === 'transcribing' && 'Got it, transcribing…'}
          {phase === 'thinking' && 'Kira is checking live data…'}
          {phase === 'speaking' && 'Kira is speaking'}
        </div>
        {interim && phase !== 'speaking' && <div className="truncate italic opacity-80">“{interim}”</div>}
      </div>
      {(phase === 'listening' || phase === 'speaking') && (
        <button
          onClick={phase === 'speaking' ? voice.stopSpeaking : voice.cancel}
          className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium hover:bg-white/10"
        >
          {phase === 'speaking' ? 'Stop' : 'Cancel'}
        </button>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-600'}`}
      >
        <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
      <span>
        <span className="block text-xs font-medium text-slate-100">{label}</span>
        {hint && <span className="block text-[11px] text-slate-400 leading-snug">{hint}</span>}
      </span>
    </label>
  );
}

/** Gear button + popover with voice, speed, hands-free and wake-word settings. */
export function KiraVoiceSettings({ voice }: { voice: KiraVoice }) {
  const [open, setOpen] = useState(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const { settings, updateSettings, naturalVoice, naturalVoiceNote } = voice;

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => setBrowserVoices(window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')));
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Voice settings"
        aria-label="Voice settings"
        aria-expanded={open}
        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <Settings2 size={17} />
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 z-40 w-[320px] rounded-xl border border-white/10 bg-[#0E1426] p-4 shadow-2xl shadow-black/50 text-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">Voice assistant</div>
            <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-white" aria-label="Close"><X size={15} /></button>
          </div>

          <div className={`mb-3 rounded-lg px-3 py-2 text-[11px] leading-snug ${naturalVoice === false ? 'bg-amber-400/10 text-amber-200' : 'bg-emerald-400/10 text-emerald-200'}`}>
            {naturalVoice === false
              ? <>Using your browser’s voice. {naturalVoiceNote || 'The natural voice is unavailable.'}</>
              : naturalVoice
                ? 'Natural voice is active (Groq Orpheus).'
                : 'Natural voice will be used if available, otherwise your browser’s voice.'}
          </div>

          <label className="block text-[11px] font-medium text-slate-400 mb-1">Kira’s voice</label>
          <select
            value={naturalVoice === false ? settings.browserVoiceURI : settings.voice}
            onChange={(e) => (naturalVoice === false ? updateSettings({ browserVoiceURI: e.target.value }) : updateSettings({ voice: e.target.value }))}
            className="w-full mb-3 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-slate-100 [&>option]:bg-[#0E1426]"
          >
            {naturalVoice === false ? (
              <>
                <option value="">Best available</option>
                {browserVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
              </>
            ) : (
              NATURAL_VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)
            )}
          </select>

          <label className="block text-[11px] font-medium text-slate-400 mb-1">Speaking speed · {settings.rate.toFixed(2)}×</label>
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.05}
            value={settings.rate}
            onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
            className="w-full mb-2 accent-cyan-400"
          />

          <label className="block text-[11px] font-medium text-slate-400 mb-1">I’ll speak in</label>
          <select
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value as 'en' | 'auto' })}
            className="w-full mb-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-slate-100 [&>option]:bg-[#0E1426]"
          >
            <option value="en">English</option>
            <option value="auto">Auto-detect (English, Arabic, …)</option>
          </select>

          <div className="border-t border-white/10 mt-2 pt-1">
            <Toggle
              checked={settings.conversation}
              onChange={(v) => updateSettings({ conversation: v })}
              label="Hands-free conversation"
              hint="After answering a spoken question, Kira listens for your follow-up."
            />
            <Toggle
              checked={settings.wakeWord}
              onChange={(v) => updateSettings({ wakeWord: v })}
              label="“Hey Kira” wake word"
              hint="Keeps the mic on while this console is open and unlocked. Short clips of speech are sent to Groq to detect “Hey Kira”."
            />
          </div>

          <button
            type="button"
            onClick={voice.testVoice}
            className="mt-3 w-full rounded-lg bg-white/10 py-2 text-xs font-medium text-white hover:bg-white/15 flex items-center justify-center gap-1.5"
          >
            <Volume2 size={14} /> Test voice
          </button>
        </div>
      )}
    </div>
  );
}
