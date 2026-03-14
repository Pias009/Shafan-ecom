"use client";
import React from 'react';

type Segment = { label: string; value: number; color?: string };

export default function DonutChart({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((a, s) => a + (s.value || 0), 0);
  const size = 200;
  const thickness = 28;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Orders by status">
      <g transform={`translate(${size/2}, ${size/2}) rotate(-90)`}>
        {segments.map((s, idx) => {
          const value = s.value || 0;
          const frac = total > 0 ? value / total : 0;
          const dash = frac * circumference;
          const color = s.color || '#888'
          const dashCap = idx === 0 ? 'butt' : 'butt';
          const circle = (
            <circle
              key={idx}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap={dashCap}
            />
          );
          offset += dash;
          return circle;
        })}
      </g>
    </svg>
  );
}
