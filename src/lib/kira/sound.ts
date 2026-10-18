// High-tech sound & voice synthesis utility for AGENT KIRA

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a luxury, futuristic dual-chime frequency sweep when Agent Kira activates or sends a report
 */
export function playKiraChime(volume: number = 0.15) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Arpeggiated high-tech frequencies (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.055);

      // Volume envelope: rapid attack, smooth exponential decay
      gain.gain.setValueAtTime(0.001, now + index * 0.055);
      gain.gain.linearRampToValueAtTime(volume, now + index * 0.055 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.055 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.055);
      osc.stop(now + index * 0.055 + 0.36);
    });
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
}

/**
 * High-tech stasis pod de-crystallization / wake-up power glide
 */
export function playStasisAwakenSound(volume: number = 0.16) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency sweep upward from 120Hz to 680Hz
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.32);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(3500, now + 0.32);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    console.warn('Stasis sound error:', err);
  }
}

/**
 * Quick cybernetic data burst sound for terminal stream / command dispatch
 */
export function playCommandDispatchSound(volume: number = 0.12) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.04);
    osc.frequency.setValueAtTime(1760, now + 0.08);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (err) {
    console.warn('Dispatch sound error:', err);
  }
}

/**
 * Speaks Agent Kira's text aloud using the browser's native SpeechSynthesis API
 */
export function speakKiraVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  muted: boolean = false
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || muted) {
    onEnd?.();
    return null;
  }

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Clean text for speech: remove markdown formatting, bullet symbols, asterisks
    const cleanedText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/•/g, '')
      .replace(/#/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .trim();

    if (!cleanedText) {
      onEnd?.();
      return null;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = 1.05;
    utterance.pitch = 1.08;

    // Select the best available natural female voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria') ||
            v.name.includes('Natural') ||
            v.name.includes('Female') ||
            v.name.includes('Google UK English Female'))
      ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    onEnd?.();
    return null;
  }
}

export function stopKiraVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
