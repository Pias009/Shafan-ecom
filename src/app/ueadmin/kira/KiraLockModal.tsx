'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clipboard, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { playKiraChime } from '@/lib/kira/sound';
import { getLocalVoiceState, onLocalVoiceState, type LocalVoiceState } from '@/lib/kira/voice';

interface KiraLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
}

export function KiraLockModal({ isOpen, onUnlock }: KiraLockModalProps) {
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [voiceState, setVoiceState] = useState<LocalVoiceState>({ status: 'idle', progress: 0 });

  useEffect(() => {
    setVoiceState(getLocalVoiceState());
    return onLocalVoiceState(setVoiceState);
  }, []);

  if (!isOpen) return null;

  const fail = (message: string) => {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) {
        setToken(text.trim());
        setError('');
      }
    } catch {}
  };

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token.trim()) return fail('Enter your access token.');
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/admin/kira/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        playKiraChime(0.18);
        setToken('');
        onUnlock();
      } else {
        fail(data.message || 'That token is not valid.');
      }
    } catch {
      fail('Could not verify the token. Check your connection.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0C0E]/85 p-4 select-none" role="dialog" aria-modal="true" aria-label="Unlock Kira">
      <div className={`w-full max-w-[420px] rounded-md border border-[#262930] bg-[#121317] text-[#ECEAE4] shadow-2xl shadow-black/60 ${shake ? 'kira-shake' : ''}`}>
        <div className="flex items-center justify-between border-b border-[#23252B] px-5 py-3">
          <span className="kira-mono text-[12px] font-semibold tracking-[0.18em]">KIRA</span>
          <span className="kira-label flex items-center gap-1.5"><Lock size={11} /> Locked</span>
        </div>

        <form onSubmit={verify} className="px-5 pb-5 pt-5">
          <h2 className="text-[20px] font-semibold tracking-tight">Unlock Kira</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#A9ACB4]">
            Enter the Kira access token. A super admin can share it with you.
          </p>

          <div className="mt-5 flex items-center justify-between">
            <label htmlFor="kira-token" className="text-[12.5px] text-[#A9ACB4]">Access token</label>
            <button type="button" onClick={paste} className="flex items-center gap-1 text-[12px] text-[#A9ACB4] hover:text-white">
              <Clipboard size={12} /> Paste
            </button>
          </div>
          <div className="relative mt-1.5">
            <input
              id="kira-token"
              type={show ? 'text' : 'password'}
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(''); }}
              placeholder="KIRA-…"
              autoComplete="off"
              autoFocus
              className="kira-mono h-11 w-full rounded-md border border-[#262930] bg-[#0E0F12] px-3.5 pr-11 text-[14px] tracking-wider text-[#ECEAE4] placeholder:text-[#5E626B] focus:border-[#4A4E57] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[#8A8E98] hover:text-white"
              aria-label={show ? 'Hide token' : 'Show token'}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <p className="mt-3 flex items-center gap-2 text-[12.5px] text-[#EC8A80]">
              <AlertTriangle size={14} className="shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#ECEAE4] text-[14px] font-semibold text-[#0C0D0F] hover:bg-white disabled:opacity-50"
          >
            {verifying ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : 'Unlock'}
          </button>

          <p className="mt-4 text-[12px] leading-relaxed text-[#7E828C]">
            Kira greets you by voice after unlocking (you can mute her). She locks again when you switch tabs or leave the window.
          </p>
          {voiceState.status === 'loading' && (
            <div className="mt-3" aria-live="polite">
              <div className="kira-mono flex justify-between text-[11px] text-[#A9ACB4]">
                <span>Preparing Kira’s voice</span><span>{voiceState.progress}%</span>
              </div>
              <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-[#23252B]">
                <div className="h-full bg-[#F2B33D] transition-[width] duration-300" style={{ width: `${voiceState.progress}%` }} />
              </div>
            </div>
          )}
        </form>
      </div>

      <style jsx global>{`
        @keyframes kira-shake {
          0%, 100% { transform: translateX(0); }
          25%, 75% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
        }
        .kira-shake { animation: kira-shake 0.35s ease-in-out; }
      `}</style>
    </div>
  );
}

export default KiraLockModal;
