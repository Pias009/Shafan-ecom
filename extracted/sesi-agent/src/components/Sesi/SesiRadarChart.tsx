"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useSesi, RadarMetric } from "./useSesi";
import { motion } from "framer-motion";

const ALLOWED_KEYS: (keyof RadarMetric)[] = [
  "Hydration",
  "Oil Control",
  "Barrier Strength",
  "Glow",
  "Sensitivity",
];

export default function SesiRadarChart() {
  const { radarData } = useSesi();
  const data = radarData[0];

  const chartData = ALLOWED_KEYS.map((key) => ({
    metric: key,
    value: data[key],
    fullMark: 100,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-teal-100/50 shadow-sm"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">
          Skin Scan
        </span>
      </div>
      <div className="w-full h-36 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e0f2f1" strokeWidth={1} />
            <PolarAngleAxis
              dataKey="metric"
              tick={{
                fill: "#0d9488",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Radar
              name="Skin Score"
              dataKey="value"
              stroke="#14b8a6"
              strokeWidth={2.5}
              fill="#14b8a6"
              fillOpacity={0.25}
              animationDuration={800}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1.5 grid grid-cols-5 gap-0.5 text-center">
        {ALLOWED_KEYS.map((key) => (
          <div key={key} className="flex flex-col items-center">
            <span className="text-[7px] font-bold text-gray-500 uppercase">
              {key.split(" ")[0]}
            </span>
            <span className="text-[9px] font-black text-teal-600">
              {data[key]}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
