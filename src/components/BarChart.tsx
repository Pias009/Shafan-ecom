"use client";
import React from 'react';

type Point = { label: string; value: number };

export default function BarChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="w-full">
      {data.map((d) => {
        const w = Math.round((d.value / max) * 100);
        return (
          <div key={d.label} className="flex items-center mb-2">
            <span className="w-40 text-sm text-black/80 mr-2">{d.label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
              <div style={{ width: `${w}%` }} className="h-4 bg-blue-600" />
            </div>
            <span className="ml-2 text-sm text-black/70 w-20 text-right">{d.value}</span>
          </div>
        );
      })}
    </div>
  );
}
