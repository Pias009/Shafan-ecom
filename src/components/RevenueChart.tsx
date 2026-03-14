"use client";
import React from 'react';

export default function RevenueChart({ data }: { data: number[] }) {
  const w = 600;
  const h = 180;
  const padding = 40;
  const max = Math.max(...data, 1);
  const min = 0;
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (w - 2 * padding);
    const y = h - padding - ((v - min) / (max - min)) * (h - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Revenue trend">
      <polyline fill="none" stroke="#2563eb" strokeWidth={2} points={points} />
      {/* Axes/grid */}
      <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} stroke="#e5e7eb" strokeWidth={1} />
    </svg>
  );
}
