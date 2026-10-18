'use client';

import React, { useEffect, useRef } from 'react';

type Props = {
  listening: boolean;
  speaking: boolean;
  thinking: boolean;
  /** 0..1 live loudness, read every frame (mic while listening, Kira while speaking). */
  getLevel?: () => number;
  size?: number;
  onClick?: () => void;
  title?: string;
};

const AMBER = '242, 179, 61';
const IVORY = '236, 234, 228';

/**
 * Kira's voice indicator: a ring of fine radial bars. Monochrome at rest,
 * amber while listening, ivory while speaking. No gradients, just geometry.
 */
export function VoiceCore({ listening, speaking, thinking, getLevel, size = 132, onClick, title }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef(getLevel);
  levelRef.current = getLevel;
  const stateRef = useRef({ listening, speaking, thinking });
  stateRef.current = { listening, speaking, thinking };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const BARS = 72;
    const bars = new Float32Array(BARS);
    let smooth = 0;
    let t = 0;
    let raf = 0;

    const draw = () => {
      const { listening: L, speaking: S, thinking: T } = stateRef.current;
      const target = Math.max(0, Math.min(1, levelRef.current?.() ?? 0));
      smooth += (target - smooth) * 0.22;
      t += reduce ? 0 : 0.016;

      const w = canvas.width;
      const c = w / 2;
      const rInner = w * 0.27;
      const maxLen = w * 0.17;
      const color = L ? AMBER : IVORY;
      ctx.clearRect(0, 0, w, w);

      // Hairline rings.
      ctx.lineWidth = 1 * dpr;
      ctx.strokeStyle = `rgba(${IVORY}, 0.10)`;
      ctx.beginPath(); ctx.arc(c, c, rInner - 6 * dpr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(${IVORY}, 0.06)`;
      ctx.beginPath(); ctx.arc(c, c, rInner + maxLen + 4 * dpr, 0, Math.PI * 2); ctx.stroke();

      // Thinking: a single arc sweeping the outer ring.
      if (T && !L && !S) {
        ctx.strokeStyle = `rgba(${IVORY}, 0.55)`;
        ctx.lineWidth = 1.5 * dpr;
        const a = t * 3;
        ctx.beginPath(); ctx.arc(c, c, rInner + maxLen + 4 * dpr, a, a + 0.9); ctx.stroke();
      }

      // Radial bars.
      const active = L || S;
      for (let i = 0; i < BARS; i++) {
        const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2;
        const wave = 0.5 + 0.5 * Math.sin(angle * 3 + t * 2.2) * Math.cos(angle * 2 - t * 1.4);
        const idle = 0.06 + 0.05 * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 0.35));
        const goal = active ? 0.12 + smooth * (0.35 + 0.65 * wave) : idle;
        bars[i] += (goal - bars[i]) * 0.25;
        const len = Math.max(2 * dpr, bars[i] * maxLen);
        const x1 = c + Math.cos(angle) * rInner;
        const y1 = c + Math.sin(angle) * rInner;
        const x2 = c + Math.cos(angle) * (rInner + len);
        const y2 = c + Math.sin(angle) * (rInner + len);
        ctx.strokeStyle = `rgba(${color}, ${active ? 0.35 + bars[i] * 1.4 : 0.28})`;
        ctx.lineWidth = 1.6 * dpr;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      // Core.
      ctx.fillStyle = L ? `rgba(${AMBER}, 0.95)` : `rgba(${IVORY}, ${S ? 0.95 : 0.85})`;
      ctx.beginPath(); ctx.arc(c, c, w * 0.035 + smooth * w * 0.02, 0, Math.PI * 2); ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="group relative grid place-items-center rounded-full outline-none focus-visible:ring-1 focus-visible:ring-[#F2B33D]/60"
      style={{ width: size, height: size }}
    >
      <canvas ref={ref} style={{ width: size, height: size }} />
    </button>
  );
}
