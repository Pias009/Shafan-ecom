'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_VOICE_SETTINGS, KiraListener, KiraSpeaker, loadVoiceSettings, saveVoiceSettings,
  type KiraVoiceSettings,
} from '@/lib/kira/voice';

export type VoicePhase = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

/**
 * Voice-assistant loop for Agent Kira:
 *   tap mic / orb / "Hey Kira" → listen → transcribe → onCommand(text, true)
 *   → caller fetches the answer → speak(answer, { viaVoice: true })
 *   → (hands-free) listen again.
 */
export function useKiraVoice({
  active,
  muted,
  onCommand,
  onWake,
  onSilence,
}: {
  /** False while Kira is locked: everything stops and the mic is released. */
  active: boolean;
  /** Spoken replies off ("MUTED"); voice input still works. */
  muted: boolean;
  onCommand: (text: string) => void;
  onWake?: () => void;
  /** Kira listened but the admin said nothing (e.g. didn't answer her greeting). */
  onSilence?: () => void;
}) {
  const [settings, setSettingsState] = useState<KiraVoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const [naturalVoice, setNaturalVoice] = useState<boolean | null>(null);
  const [naturalVoiceNote, setNaturalVoiceNote] = useState('');

  const speakerRef = useRef<KiraSpeaker | null>(null);
  const listenerRef = useRef<KiraListener | null>(null);
  const phaseRef = useRef<VoicePhase>('idle');
  const settingsRef = useRef(settings);
  const commandRef = useRef(onCommand);
  const wakeRef = useRef(onWake);
  const silenceRef = useRef(onSilence);
  /** True while the mic is in use or its permission prompt is open (Kira's blur auto-lock ignores blur then). */
  const micBusyRef = useRef(false);

  commandRef.current = onCommand;
  wakeRef.current = onWake;
  silenceRef.current = onSilence;
  settingsRef.current = settings;

  const setPhaseBoth = useCallback((p: VoicePhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  useEffect(() => {
    speakerRef.current = new KiraSpeaker();
    listenerRef.current = new KiraListener();
    setSettingsState(loadVoiceSettings());
    setNaturalVoice(speakerRef.current.naturalAvailable);
    return () => {
      speakerRef.current?.stop();
      listenerRef.current?.stop(true);
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<KiraVoiceSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      saveVoiceSettings(next);
      return next;
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    speakerRef.current?.stop();
    if (phaseRef.current === 'speaking') setPhaseBoth('idle');
  }, [setPhaseBoth]);

  const startListening = useCallback(() => {
    const listener = listenerRef.current;
    if (!listener) return;
    if (!KiraListener.supported()) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    speakerRef.current?.stop();
    setError('');
    setInterim('');
    micBusyRef.current = true;
    listener.listenOnce({
      language: settingsRef.current.language,
      onPhase: (p) => {
        if (p === 'listening') setPhaseBoth('listening');
        else if (p === 'transcribing') setPhaseBoth('transcribing');
      },
      onInterim: (t) => setInterim(t),
      onResult: (text) => {
        micBusyRef.current = false;
        setInterim(text);
        if (text) {
          setPhaseBoth('thinking');
          commandRef.current(text);
        } else {
          setPhaseBoth('idle');
          setInterim('');
          silenceRef.current?.();
        }
      },
      onError: (msg) => {
        micBusyRef.current = false;
        setPhaseBoth('idle');
        setError(msg);
      },
    });
  }, [setPhaseBoth]);

  /** Mic button / orb: start listening, or finish early if already listening, or interrupt Kira. */
  const toggleListening = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'listening') listenerRef.current?.finishNow();
    else if (p === 'transcribing' || p === 'thinking') return;
    else startListening();
  }, [startListening]);

  const cancel = useCallback(() => {
    listenerRef.current?.stop();
    speakerRef.current?.stop();
    micBusyRef.current = false;
    setInterim('');
    setPhaseBoth('idle');
  }, [setPhaseBoth]);

  /**
   * Speak a reply. Listens again afterwards when `listenAfter` is set (Kira asked a
   * question) or, with hands-free on, when the admin was talking by voice.
   */
  const speak = useCallback(
    (text: string, opts: { viaVoice?: boolean; listenAfter?: boolean } = {}) => {
      const speaker = speakerRef.current;
      const resumeListening = () => {
        if ((opts.listenAfter || (opts.viaVoice && settingsRef.current.conversation)) && phaseRef.current === 'idle') {
          setTimeout(() => { if (phaseRef.current === 'idle') startListening(); }, 350);
        }
      };
      if (!speaker || muted) {
        setPhaseBoth('idle');
        setInterim('');
        resumeListening();
        return;
      }
      setPhaseBoth('speaking');
      setInterim('');
      speaker.speak(text, settingsRef.current, {
        onStart: () => setNaturalVoice(speaker.naturalAvailable),
        onEnd: () => {
          setNaturalVoice(speaker.naturalAvailable);
          if (speaker.lastNaturalError) setNaturalVoiceNote(speaker.lastNaturalError);
          if (phaseRef.current === 'speaking') {
            setPhaseBoth('idle');
            resumeListening();
          }
        },
      });
    },
    [muted, setPhaseBoth, startListening],
  );

  /** The answer request failed or produced nothing: return to idle. */
  const resetAfterCommand = useCallback(() => {
    if (phaseRef.current === 'thinking') setPhaseBoth('idle');
  }, [setPhaseBoth]);

  // Lock / unlock: stop everything and release the microphone when locked.
  useEffect(() => {
    if (!active) {
      listenerRef.current?.stop(true);
      speakerRef.current?.stop();
      micBusyRef.current = false;
      setInterim('');
      setPhaseBoth('idle');
    }
  }, [active, setPhaseBoth]);

  useEffect(() => {
    if (muted) stopSpeaking();
  }, [muted, stopSpeaking]);

  // Wake word: listen in the background only while idle.
  useEffect(() => {
    const listener = listenerRef.current;
    if (!listener) return;
    if (active && settings.wakeWord && phase === 'idle') {
      let cancelled = false;
      // Hold off the blur auto-lock only while the permission prompt may be open.
      micBusyRef.current = true;
      listener.prepareMic()
        .catch(() => {})
        .finally(() => {
          micBusyRef.current = false;
          if (cancelled || phaseRef.current !== 'idle') return;
          listener.listenForWake({
            language: settings.language,
            onWake: () => {
              wakeRef.current?.();
              startListening();
            },
            onWakeCommand: (text) => {
              wakeRef.current?.();
              listener.stop();
              setInterim(text);
              setPhaseBoth('thinking');
              commandRef.current(text);
            },
            onError: (msg) => {
              setError(msg);
              updateSettings({ wakeWord: false });
            },
          });
        });
      return () => {
        cancelled = true;
        if (listener.mode === 'wake') listener.stop();
      };
    }
    if (listener.mode === 'wake') listener.stop();
  }, [active, settings.wakeWord, settings.language, phase, startListening, setPhaseBoth, updateSettings]);

  /** 0..1 loudness for the orb: the admin's voice while listening, Kira's while speaking. */
  const level = useCallback(() => {
    if (phaseRef.current === 'listening') return listenerRef.current?.level() || 0;
    if (phaseRef.current === 'speaking') return speakerRef.current?.level() || 0;
    return 0;
  }, []);

  const testVoice = useCallback(() => {
    speak('Hi, I am Kira. This is how I will sound when I answer you.');
  }, [speak]);

  return {
    phase,
    interim,
    error,
    clearError: () => setError(''),
    settings,
    updateSettings,
    naturalVoice,
    naturalVoiceNote,
    micBusyRef,
    level,
    startListening,
    toggleListening,
    cancel,
    speak,
    stopSpeaking,
    resetAfterCommand,
    testVoice,
  };
}

export type KiraVoice = ReturnType<typeof useKiraVoice>;
