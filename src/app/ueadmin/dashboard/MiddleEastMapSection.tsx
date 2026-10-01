'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Truck,
  Eye,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { CountryGeoStat } from './DashboardClient';

interface MiddleEastMapSectionProps {
  countryStats: CountryGeoStat[];
  mostDeliveredCountry: CountryGeoStat;
  mostVisitedCountry: CountryGeoStat;
  selectedCountryCode: string | null;
  onSelectCountry: (code: string | null) => void;
  mapMode: 'delivered' | 'visits';
  onToggleMapMode: (mode: 'delivered' | 'visits') => void;
}

// -------------------------------------------------------------
// PRECISE GEOGRAPHIC ANCHORS ON THE 900x520 REGIONAL MAP CANVAS
// Tuned for the Arabian Peninsula, Arabian Gulf & Red Sea corridor
// -------------------------------------------------------------
interface MapPointConfig {
  code: string;
  px: number;
  py: number;
  labelOffsetX: number;
  labelOffsetY: number;
  hubName: string;
}

const REGIONAL_POINTS: Record<string, MapPointConfig> = {
  AE: { code: 'AE', px: 675, py: 220, labelOffsetX: 25, labelOffsetY: -18, hubName: 'Dubai Logistics Central' },
  SA: { code: 'SA', px: 420, py: 230, labelOffsetX: -135, labelOffsetY: -16, hubName: 'Riyadh Distribution Hub' },
  QA: { code: 'QA', px: 585, py: 195, labelOffsetX: -35, labelOffsetY: 35, hubName: 'Doha Express Terminal' },
  KW: { code: 'KW', px: 470, py: 105, labelOffsetX: -50, labelOffsetY: -48, hubName: 'Kuwait City Hub' },
  OM: { code: 'OM', px: 790, py: 260, labelOffsetX: 25, labelOffsetY: 25, hubName: 'Muscat Regional Depot' },
  BH: { code: 'BH', px: 550, py: 165, labelOffsetX: 18, labelOffsetY: -45, hubName: 'Manama Gateway' },
};

export function MiddleEastMapSection({
  countryStats,
  mostDeliveredCountry,
  mostVisitedCountry,
  selectedCountryCode,
  onSelectCountry,
  mapMode,
  onToggleMapMode,
}: MiddleEastMapSectionProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Map countryStats by code for instant lookup
  const statsByCode = React.useMemo(() => {
    const map = new Map<string, CountryGeoStat>();
    countryStats.forEach((c) => map.set(c.code, c));
    return map;
  }, [countryStats]);

  const activeCountry = selectedCountryCode ? statsByCode.get(selectedCountryCode) : null;
  const uaePoint = REGIONAL_POINTS['AE'];

  return (
    <div className="w-full p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-6">
      {/* ========================================================= */}
      {/* SECTION HEADER: TITLE & INTERACTIVE CONTROLS              */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Compass size={20} className="animate-spin" style={{ animationDuration: '24s' }} />
            </div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
              Middle East Logistics & Audience Footprint
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-100 text-cyan-800 border border-cyan-300">
              GCC Regional Map
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            Fulfillment routes from UAE central hub to GCC destinations &middot; Click nodes to filter data
          </p>
        </div>

        {/* View Mode Toggle & Reset Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => onToggleMapMode('delivered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'delivered'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck size={14} className="text-cyan-600" />
              <span>Orders Delivered</span>
            </button>
            <button
              onClick={() => onToggleMapMode('visits')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'visits'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye size={14} className="text-purple-600" />
              <span>User Visits</span>
            </button>
          </div>

          {/* Reset Active Filter */}
          {selectedCountryCode && (
            <button
              onClick={() => onSelectCountry(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              title="Reset country filter"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TOP TWO SPOTLIGHT METRICS: DELIVERED & VISITED HUBS       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spotlight 1: Most Order Delivered Country */}
        <div
          onClick={() => onSelectCountry(mostDeliveredCountry.code)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            selectedCountryCode === mostDeliveredCountry.code
              ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-300'
              : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-cyan-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl drop-shadow-xs">{mostDeliveredCountry.flag}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-cyan-800">
                    🏆 Most Order Delivered Country
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-900 text-[9px] font-black uppercase">
                    #1 Fulfillment
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {mostDeliveredCountry.name}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-slate-900 tracking-tight block">
                {mostDeliveredCountry.deliveredOrders.toLocaleString()} Delivered
              </span>
              <span className="text-[11px] font-bold text-emerald-700">
                {mostDeliveredCountry.deliveryRate}% fulfillment rate
              </span>
            </div>
          </div>
          {/* Progress fulfillment bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${mostDeliveredCountry.deliveryRate}%` }}
            />
          </div>
        </div>

        {/* Spotlight 2: Most User Visited Country */}
        <div
          onClick={() => onSelectCountry(mostVisitedCountry.code)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            selectedCountryCode === mostVisitedCountry.code
              ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-300'
              : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl drop-shadow-xs">{mostVisitedCountry.flag}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-purple-800">
                    🌐 Most User Visited Country
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 text-[9px] font-black uppercase">
                    #1 Traffic
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {mostVisitedCountry.name}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-slate-900 tracking-tight block">
                {mostVisitedCountry.visits.toLocaleString()} Visits
              </span>
              <span className="text-[11px] font-bold text-purple-700">
                {mostVisitedCountry.visitsPercentage}% regional audience share
              </span>
            </div>
          </div>
          {/* Progress traffic bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${mostVisitedCountry.visitsPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN REGIONAL MAP CANVAS WITH HIGH-PRECISION POINTS       */}
      {/* ========================================================= */}
      <div className="relative w-full rounded-2xl bg-gradient-to-br from-slate-50 via-[#F8FAFC] to-slate-100/90 border border-slate-200 p-4 overflow-hidden">
        <svg
          viewBox="0 0 900 520"
          className="w-full h-auto max-h-[560px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
            </pattern>

            {/* Delivery Flight Path Gradients */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>

            {/* Filter Shadow for Nodes */}
            <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* 1. Coordinate Grid Background */}
          <rect width="900" height="520" fill="url(#mapGrid)" rx="16" />

          {/* 2. Water Bodies Ambient Labels */}
          <text x="590" y="140" fill="#94A3B8" fontSize="11" fontWeight="800" letterSpacing="0.2em" opacity="0.6">
            ARABIAN GULF (GCC LOGISTICS CORRIDOR)
          </text>
          <text x="240" y="320" fill="#94A3B8" fontSize="11" fontWeight="800" letterSpacing="0.2em" opacity="0.6" transform="rotate(-30 240, 320)">
            RED SEA
          </text>
          <text x="760" y="195" fill="#94A3B8" fontSize="10" fontWeight="800" letterSpacing="0.2em" opacity="0.6">
            GULF OF OMAN
          </text>
          <text x="580" y="470" fill="#94A3B8" fontSize="11" fontWeight="800" letterSpacing="0.2em" opacity="0.6">
            ARABIAN SEA
          </text>

          {/* 3. Stylized Geographic Land Silhouette: Arabian Peninsula */}
          <path
            d="
              M 190,50
              Q 210,120 250,220
              Q 290,320 330,420
              Q 350,440 380,445
              Q 490,455 600,420
              Q 720,370 820,310
              Q 860,260 850,240
              Q 800,210 740,185
              Q 700,165 690,175
              Q 650,210 630,225
              Q 590,235 585,185
              Q 580,235 565,235
              Q 530,190 510,140
              Q 480,95 450,85
              Q 360,70 270,55
              Z
            "
            fill="url(#landGradient)"
            stroke="#CBD5E1"
            strokeWidth="1.8"
            strokeLinejoin="round"
            filter="url(#nodeShadow)"
          />

          {/* 4. Territorial Border Guidelines (Subtle Muted Dashed Lines) */}
          <path d="M 430,75 Q 460,140 480,180 Q 510,230 560,250" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M 600,240 Q 640,250 670,255" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M 690,265 Q 730,285 760,330" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

          {/* 5. Curved Flight Trajectory Arcs Originating from Dubai (UAE) */}
          {Object.entries(REGIONAL_POINTS)
            .filter(([code]) => code !== 'AE')
            .map(([code, pt]) => {
              const isSelected = selectedCountryCode === code;
              const isHovered = hoveredCountry === code;
              const isActive = isSelected || isHovered;

              // Arc Midpoint control for curved trajectory
              const midX = (uaePoint.px + pt.px) / 2;
              const midY = Math.min(uaePoint.py, pt.py) - (code === 'SA' ? 65 : code === 'KW' ? 55 : 35);
              const pathD = `M ${uaePoint.px} ${uaePoint.py} Q ${midX} ${midY} ${pt.px} ${pt.py}`;

              return (
                <g key={`route-${code}`}>
                  {/* Outer Glow Path when Active */}
                  {isActive && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="5"
                      strokeLinecap="round"
                      opacity="0.25"
                    />
                  )}
                  {/* Delivery Arc Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isActive ? '#0284C7' : '#94A3B8'}
                    strokeWidth={isActive ? '2.5' : '1.5'}
                    strokeDasharray={isActive ? 'none' : '4 4'}
                    strokeLinecap="round"
                    opacity={isActive ? 0.95 : 0.45}
                  />
                  {/* Flow Indicator Circle on Route Midpoint */}
                  <circle
                    cx={midX}
                    cy={midY + 12}
                    r={isActive ? 3.5 : 2}
                    fill={isActive ? '#06B6D4' : '#94A3B8'}
                    opacity={isActive ? 0.9 : 0.4}
                  />
                </g>
              );
            })}

          {/* 6. High-Precision Regional Points (Country Pins) */}
          {Object.entries(REGIONAL_POINTS).map(([code, pt]) => {
            const stat = statsByCode.get(code);
            if (!stat) return null;

            const isSelected = selectedCountryCode === code;
            const isHovered = hoveredCountry === code;
            const isTopDeliv = code === mostDeliveredCountry.code;
            const isTopVisit = code === mostVisitedCountry.code;

            const primaryColor = isTopDeliv ? '#06B6D4' : isTopVisit ? '#A855F7' : '#10B981';

            // Leader Line Coordinates linking pin to floating pill
            const cardX = pt.px + pt.labelOffsetX;
            const cardY = pt.py + pt.labelOffsetY;

            return (
              <g
                key={`point-${code}`}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectCountry(isSelected ? null : code)}
                onMouseEnter={() => setHoveredCountry(code)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                {/* Connecting Leader Line */}
                <line
                  x1={pt.px}
                  y1={pt.py}
                  x2={cardX}
                  y2={cardY}
                  stroke={isSelected ? '#0284C7' : '#CBD5E1'}
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />

                {/* Radar Waves / Concentric Pulsing Ring */}
                <circle
                  cx={pt.px}
                  cy={pt.py}
                  r="14"
                  fill={primaryColor}
                  opacity={isSelected ? 0.25 : 0.12}
                  className="animate-ping"
                  style={{ transformOrigin: `${pt.px}px ${pt.py}px`, animationDuration: isTopDeliv ? '2s' : '3s' }}
                />
                <circle
                  cx={pt.px}
                  cy={pt.py}
                  r="8"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="1.5"
                  opacity={0.6}
                />

                {/* Pinhead Center Core */}
                <circle
                  cx={pt.px}
                  cy={pt.py}
                  r={isSelected ? '5.5' : '4'}
                  fill={isSelected ? '#0284C7' : primaryColor}
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  filter="url(#nodeShadow)"
                />

                {/* Foreign Object Floating Data Pill (Non-Overlapping Card) */}
                <foreignObject
                  x={cardX - (pt.labelOffsetX < 0 ? 150 : 0)}
                  y={cardY - 22}
                  width="180"
                  height="60"
                  className="overflow-visible pointer-events-auto"
                >
                  <div
                    className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-md transition-all flex items-center gap-2 whitespace-nowrap ${
                      isSelected
                        ? 'bg-slate-900 text-white border-cyan-400 ring-2 ring-cyan-400 scale-105'
                        : isHovered
                        ? 'bg-white text-slate-900 border-slate-400 shadow-lg scale-105'
                        : 'bg-white/95 text-slate-800 border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg leading-none">{stat.flag}</span>
                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase tracking-wider">
                          {stat.code}
                        </span>
                        {isTopDeliv && (
                          <span className="text-[9px] px-1 rounded bg-cyan-100 text-cyan-800 font-black">
                            🏆 #1
                          </span>
                        )}
                        {isTopVisit && !isTopDeliv && (
                          <span className="text-[9px] px-1 rounded bg-purple-100 text-purple-800 font-black">
                            🌐 #1
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] font-extrabold ${isSelected ? 'text-cyan-300' : 'text-slate-600'}`}>
                        {mapMode === 'delivered' ? (
                          <span>{stat.deliveredOrders} Deliv. ({stat.deliveryRate}%)</span>
                        ) : (
                          <span>{stat.visits.toLocaleString()} Visits ({stat.visitsPercentage}%)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Selection Breadcrumb Pill */}
        {activeCountry && (
          <div className="absolute top-4 left-4 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-300 shadow-md flex items-center gap-3">
            <span className="text-2xl">{activeCountry.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase">
                  Active Filter: {activeCountry.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                  Connected
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500">
                {activeCountry.deliveredOrders} delivered orders &middot; {activeCountry.visits.toLocaleString()} visitors
              </p>
            </div>
            <button
              onClick={() => onSelectCountry(null)}
              className="ml-2 text-slate-400 hover:text-slate-700 text-sm font-black p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Clear selection"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* BOTTOM GCC REGIONAL HUBS GRID (ALL 6 TERRITORIES)         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {countryStats.map((c) => {
          const isSelected = selectedCountryCode === c.code;
          const isTopDeliv = c.code === mostDeliveredCountry.code;
          const isTopVisit = c.code === mostVisitedCountry.code;

          return (
            <button
              key={c.code}
              onClick={() => onSelectCountry(isSelected ? null : c.code)}
              className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border shadow-xs ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-cyan-400 scale-[1.02]'
                  : 'bg-slate-50/80 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{c.flag}</span>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-900'
                      : isTopDeliv
                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      : isTopVisit
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.code}
                </span>
              </div>

              <div>
                <div className="text-xs font-black truncate">{c.name}</div>
                <div
                  className={`text-[10px] font-bold mt-1 ${
                    isSelected ? 'text-cyan-300' : 'text-slate-500'
                  }`}
                >
                  {mapMode === 'delivered' ? (
                    <span>{c.deliveredOrders} Deliv. &middot; {c.deliveryRate}%</span>
                  ) : (
                    <span>{c.visits.toLocaleString()} Visits &middot; {c.visitsPercentage}%</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
