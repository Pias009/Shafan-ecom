'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Settings2, Square, Volume2, X } from 'lucide-react';
import { NATURAL_VOICES } from '@/lib/kira/voice';
import type { KiraVoice } from './useKiraVoice';

/** Mic button: tap to talk, tap again to finish, tap while Kira speaks to interrupt. */
export function KiraMicButton({ voice, size = 'md' }: { voice: KiraVoice; size?: 'sm' | 'md' }) {
  const { phase } = voice;
  const busy = phase === 'transcribing' || phase === 'thinking';
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const icon = size === 'sm' ? 14 : 17;
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
      className={`relative grid ${dim} shrink-0 place-items-center rounded-md border transition-colors disabled:cursor-wait ${
        phase === 'listening'
          ? 'border-[#F2B33D] bg-[#F2B33D] text-[#0C0D0F]'
          : 'border-[#2A2D34] bg-[#131418] text-[#ECEAE4] hover:border-[#3A3D45] hover:bg-[#1A1C21]'
      }`}
    >
      {busy ? (
        <Loader2 size={icon} className="animate-spin text-[#A9ACB4]" />
      ) : phase === 'listening' ? (
        <Square size={icon - 4} className="fill-current" />
      ) : (
        <Mic size={icon} strokeWidth={1.75} />
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
          (bars[i] as HTMLElement).style.height = `${3 + Math.min(1, lvl * (0.6 + ((i * 37) % 10) / 10)) * 12}px`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getLevel]);
  return (
    <div ref={ref} className="flex h-4 items-center gap-[2px]" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => <span key={i} className="w-[2px] bg-current" style={{ height: 3 }} />)}
    </div>
  );
}

/** One-line live status: listening (with captions), transcribing, thinking, speaking, or an error. */
export function KiraVoiceStatus({ voice }: { voice: KiraVoice }) {
  const { phase, interim, error } = voice;
  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-[#EC8A80]/30 bg-[#EC8A80]/[0.06] px-3 py-2 text-[12.5px] text-[#F2B5AE]">
        <span className="flex-1">{error}</span>
        <button onClick={voice.clearError} className="p-0.5 hover:text-white" aria-label="Dismiss"><X size={13} /></button>
      </div>
    );
  }
  if (phase === 'idle') return null;

  const color = phase === 'listening' ? 'text-[#F2B33D]' : 'text-[#ECEAE4]';
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#23252B] bg-[#121317] px-3 py-2" aria-live="polite">
      <span className={color}>
        {phase === 'listening' || phase === 'speaking' ? <LevelBars getLevel={voice.level} /> : <Loader2 size={14} className="animate-spin" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`kira-mono text-[11px] uppercase tracking-[0.1em] ${color}`}>
          {phase === 'listening' && 'Listening'}
          {phase === 'transcribing' && 'Transcribing'}
          {phase === 'thinking' && 'Checking live data'}
          {phase === 'speaking' && 'Kira is speaking'}
        </div>
        {interim && phase !== 'speaking' && <div className="truncate text-[13px] text-[#D9D7D1]">“{interim}”</div>}
        {phase === 'listening' && !interim && <div className="text-[12px] text-[#8A8E98]">Speak naturally. I’ll stop when you pause.</div>}
      </div>
      {(phase === 'listening' || phase === 'speaking') && (
        <button
          onClick={phase === 'speaking' ? voice.stopSpeaking : voice.cancel}
          className="rounded border border-[#2A2D34] px-2.5 py-1 text-[11.5px] font-medium text-[#D4D2CC] hover:bg-[#1A1C21] hover:text-white"
        >
          {phase === 'speaking' ? 'Stop' : 'Cancel'}
        </button>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border p-[2px] transition-colors ${checked ? 'border-[#ECEAE4] bg-[#ECEAE4]' : 'border-[#3A3D45] bg-[#1A1C21]'}`}
      >
        <span className={`h-3 w-3 rounded-full transition-transform ${checked ? 'translate-x-[14px] bg-[#0C0D0F]' : 'bg-[#8A8E98]'}`} />
      </button>
      <span>
        <span className="block text-[13px] font-medium text-[#ECEAE4]">{label}</span>
        {hint && <span className="block text-[12px] leading-snug text-[#8A8E98]">{hint}</span>}
      </span>
    </label>
  );
}

const selectCls =
  'w-full rounded-md border border-[#262930] bg-[#0E0F12] px-2.5 py-2 text-[13px] text-[#ECEAE4] focus:border-[#4A4E57] focus:outline-none [&>option]:bg-[#0E0F12]';

/** Voice settings: Kira's voice, speed, language, greeting, hands-free and wake word. */
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
        className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#2A2D34] bg-[#131418] text-[#A9ACB4] hover:border-[#3A3D45] hover:text-white"
      >
        <Settings2 size={16} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 z-40 w-[330px] rounded-md border border-[#262930] bg-[#121317] p-4 text-[#ECEAE4] shadow-2xl shadow-black/60">
          <div className="mb-3 flex items-center justify-between">
            <div className="kira-label">Voice assistant</div>
            <button onClick={() => setOpen(false)} className="p-1 text-[#8A8E98] hover:text-white" aria-label="Close"><X size={15} /></button>
          </div>

          <p className={`mb-3 text-[12px] leading-snug ${naturalVoice === false ? 'text-[#F2B33D]' : 'text-[#8FC79E]'}`}>
            {naturalVoice === false
              ? <>Using your browser’s voice. {naturalVoiceNote || 'The natural voice is unavailable.'}</>
              : naturalVoice
                ? 'Natural voice active (Groq Orpheus).'
                : 'Natural voice when available, otherwise your browser’s voice.'}
          </p>

          <label className="mb-1 block text-[12px] text-[#A9ACB4]">Kira’s voice</label>
          <select
            value={naturalVoice === false ? settings.browserVoiceURI : settings.voice}
            onChange={(e) => (naturalVoice === false ? updateSettings({ browserVoiceURI: e.target.value }) : updateSettings({ voice: e.target.value }))}
            className={`${selectCls} mb-3`}
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

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] text-[#A9ACB4]">Speed · <span className="kira-mono">{settings.rate.toFixed(2)}×</span></label>
              <input
                type="range" min={0.8} max={1.4} step={0.05}
                value={settings.rate}
                onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
                className="mt-2 w-full accent-[#ECEAE4]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-[#A9ACB4]">I’ll speak in</label>
              <select value={settings.language} onChange={(e) => updateSettings({ language: e.target.value as 'en' | 'auto' })} className={selectCls}>
                <option value="en">English</option>
                <option value="auto">Auto-detect</option>
              </select>
            </div>
          </div>

          <div className="border-t border-[#23252B] pt-1">
            <Toggle
              checked={settings.autoGreet}
              onChange={(v) => updateSettings({ autoGreet: v })}
              label="Greet me when I open Kira"
              hint="Kira says hello, listens for your answer, then gives today’s briefing."
            />
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
              hint="Mic stays on while Kira is open and unlocked; short speech clips go to Groq to detect “Hey Kira”."
            />
          </div>

          <button
            type="button"
            onClick={voice.testVoice}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#2A2D34] py-2 text-[13px] font-medium text-[#ECEAE4] hover:bg-[#1A1C21]"
          >
            <Volume2 size={14} /> Test voice
          </button>
        </div>
      )}
    </div>
  );
}
