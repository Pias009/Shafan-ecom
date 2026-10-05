'use client';

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Clipboard,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { playKiraChime, playStasisAwakenSound } from '@/lib/kira/sound';

interface KiraLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
}

export function KiraLockModal({ isOpen, onUnlock }: KiraLockModalProps) {
  const [inputToken, setInputToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputToken(text.trim());
          setErrorMessage('');
        }
      }
    } catch {
      // Clipboard permissions denied
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = inputToken.trim();

    if (!token) {
      setErrorMessage('Please enter your secret access token.');
      triggerShake();
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/kira/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage('ACCESS GRANTED // COMMAND CONSOLE UNLOCKED');
        playStasisAwakenSound(0.2);
        playKiraChime(0.2);

        setTimeout(() => {
          onUnlock();
          setIsVerifying(false);
          setSuccessMessage('');
          setInputToken('');
        }, 600);
      } else {
        triggerShake();
        setErrorMessage(data.message || 'Invalid or unauthorized token. Access Denied.');
        setIsVerifying(false);
      }
    } catch (err) {
      console.error('Lock verification error:', err);
      triggerShake();
      setErrorMessage('Verification failed. Please check network connection.');
      setIsVerifying(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl select-none"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Lock Card */}
      <div
        className={`relative w-full max-w-lg bg-slate-900/90 border border-fuchsia-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(217,70,239,0.15)] overflow-hidden transition-transform duration-200 ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Top classified banner */}
        <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="font-mono font-black text-red-400 tracking-wider text-[11px]">
              CLASSIFIED // LEVEL-5 RESTRICTED
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 font-mono text-[10px] font-bold">
            ZERO-TRUST ENFORCED
          </span>
        </div>

        {/* Lock Icon & Title Header */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-400/40 text-fuchsia-400 mb-3 shadow-[0_0_25px_rgba(217,70,239,0.25)]">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Agent Kira Is Locked
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            The 24/7 AI Operations Command Center is protected by cryptographic database security. Enter your registered access token to unlock.
          </p>
        </div>

        {/* Token Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
              <label htmlFor="kira-token" className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <KeyRound className="w-3.5 h-3.5 text-fuchsia-400" />
                Security Access Token
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Clipboard className="w-3 h-3" /> Paste
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                id="kira-token"
                type={showPassword ? 'text' : 'password'}
                value={inputToken}
                onChange={(e) => {
                  setInputToken(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter or paste token..."
                autoComplete="off"
                autoFocus
                className="w-full bg-slate-950/80 border-2 border-slate-700/70 focus:border-fuchsia-500 focus:shadow-[0_0_20px_rgba(217,70,239,0.3)] rounded-2xl px-4 py-3.5 text-white font-mono text-sm tracking-wider outline-none transition-all placeholder:text-slate-600 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide token' : 'Show token'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono font-bold animate-pulse">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Unlock Submit Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(217,70,239,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Decrypting Token...</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock Agent Kira</span>
              </>
            )}
          </button>
        </form>

        {/* Security protocol notes */}
        <div className="mt-5 pt-4 border-t border-white/5 space-y-1.5 text-[10.5px] text-slate-400">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-semibold">Instant Auto-Lock Enabled</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal pl-5">
            Console automatically locks the moment you click outside, switch browser tabs, or defocus the window.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
}

export default KiraLockModal;
