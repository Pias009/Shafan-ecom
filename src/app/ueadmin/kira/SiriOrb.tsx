'use client';

import React, { useEffect, useRef } from 'react';

interface SiriOrbProps {
  isSpeaking?: boolean;
  isProcessing?: boolean;
  size?: number; // size in pixels, default 160
  className?: string;
  onClick?: () => void;
}

export function SiriOrb({
  isSpeaking = false,
  isProcessing = false,
  size = 170,
  className = '',
  onClick,
}: SiriOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const render = () => {
      time += isSpeaking ? 0.05 : isProcessing ? 0.04 : 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = (size * dpr * 0.38);

      // Base energetic parameters
      const energy = isSpeaking ? 1.8 : isProcessing ? 1.4 : 0.8;

      // 1. Deep Core Ambient Glow
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 1.3
      );
      coreGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)'); // cyan
      coreGrad.addColorStop(0.35, 'rgba(129, 140, 248, 0.35)'); // indigo
      coreGrad.addColorStop(0.7, 'rgba(217, 70, 239, 0.25)'); // fuchsia
      coreGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Multi-Harmonic Siri Fluid Waves (Apple Intelligence style)
      const layers = [
        { color1: '#00f0ff', color2: '#3b82f6', speed: 1.0, freq: 4, amp: 7 * energy, phase: 0 },
        { color1: '#ec4899', color2: '#8b5cf6', speed: 1.3, freq: 5, amp: 9 * energy, phase: Math.PI / 3 },
        { color1: '#a855f7', color2: '#06b6d4', speed: 0.8, freq: 3, amp: 6 * energy, phase: Math.PI / 1.5 },
        { color1: '#6366f1', color2: '#f43f5e', speed: 1.5, freq: 6, amp: 8 * energy, phase: Math.PI },
      ];

      layers.forEach((l) => {
        ctx.save();
        ctx.beginPath();

        const numPoints = 80;
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          // Fluid harmonic deformation
          const wave1 = Math.sin(angle * l.freq + time * l.speed + l.phase);
          const wave2 = Math.cos(angle * (l.freq - 1) - time * 0.7 + l.phase);
          const wave3 = Math.sin(angle * 2 + time * 1.8);
          
          const rOffset = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) * l.amp;
          const currentR = radius + rOffset;

          const x = centerX + Math.cos(angle) * currentR;
          const y = centerY + Math.sin(angle) * currentR;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        // Layer Gradient
        const waveGrad = ctx.createLinearGradient(
          centerX - radius,
          centerY - radius,
          centerX + radius,
          centerY + radius
        );
        waveGrad.addColorStop(0, l.color1);
        waveGrad.addColorStop(1, l.color2);

        ctx.strokeStyle = waveGrad;
        ctx.lineWidth = (isSpeaking ? 3.5 : 2.5) * dpr;
        ctx.shadowColor = l.color1;
        ctx.shadowBlur = 14 * energy;
        ctx.stroke();

        // Soft internal body blend
        ctx.fillStyle = waveGrad;
        ctx.globalAlpha = 0.12 * energy;
        ctx.fill();

        ctx.restore();
      });

      // 3. Central Nucleus Specular Highlight (The Siri Glass Center)
      const nucleusGrad = ctx.createRadialGradient(
        centerX - radius * 0.25,
        centerY - radius * 0.3,
        radius * 0.05,
        centerX,
        centerY,
        radius * 0.75
      );
      nucleusGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      nucleusGrad.addColorStop(0.2, 'rgba(196, 181, 253, 0.75)');
      nucleusGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.45)');
      nucleusGrad.addColorStop(1, 'rgba(30, 27, 75, 0.1)');

      ctx.fillStyle = nucleusGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // 4. Subtle Chromatic Flare Sparks (Apple Siri high-end finish)
      if (isSpeaking || isProcessing) {
        ctx.save();
        for (let p = 0; p < 4; p++) {
          const sparkAngle = time * 1.5 + (p * Math.PI) / 2;
          const sparkDist = radius * (0.8 + 0.25 * Math.sin(time * 3 + p));
          const sx = centerX + Math.cos(sparkAngle) * sparkDist;
          const sy = centerY + Math.sin(sparkAngle) * sparkDist;

          ctx.fillStyle = p % 2 === 0 ? '#38bdf8' : '#f43f5e';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSpeaking, isProcessing, size]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer 3D Gyroscopic Rings (Apple Siri Spherical Horizon) */}
      <div
        className={`absolute inset-0 rounded-full border border-cyan-400/30 transition-transform duration-700 pointer-events-none ${
          isSpeaking
            ? 'animate-spin scale-110 border-cyan-400/60 shadow-[0_0_25px_rgba(56,189,248,0.4)]'
            : 'group-hover:scale-105'
        }`}
        style={{
          animationDuration: isSpeaking ? '4s' : '14s',
          transform: 'rotateX(55deg) rotateY(15deg)',
        }}
      />
      <div
        className={`absolute inset-0 rounded-full border border-fuchsia-400/25 transition-transform duration-700 pointer-events-none ${
          isSpeaking
            ? 'animate-spin scale-105 border-fuchsia-400/50 shadow-[0_0_20px_rgba(217,70,239,0.35)]'
            : ''
        }`}
        style={{
          animationDuration: isSpeaking ? '6s' : '20s',
          animationDirection: 'reverse',
          transform: 'rotateX(-45deg) rotateY(-30deg)',
        }}
      />

      {/* Siri Liquid Canvas Orb */}
      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      />

      {/* Holographic Base Glow */}
      <div
        className={`absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-indigo-500/20 blur-xl pointer-events-none transition-opacity duration-500 ${
          isSpeaking ? 'opacity-100 scale-125' : 'opacity-40 group-hover:opacity-75'
        }`}
      />
    </div>
  );
}
