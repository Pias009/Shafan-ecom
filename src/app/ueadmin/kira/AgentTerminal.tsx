'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Pause, Trash2, ShieldCheck, Zap } from 'lucide-react';

export interface TerminalLog {
  id: string;
  timestamp: string;
  agent: 'KIRA' | 'CYPHER' | 'VEX' | 'TARIQ' | 'ATLAS' | 'LYRA' | 'MAYA' | 'AEGIS' | 'VELOX' | 'SYSTEM';
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'EXEC';
  message: string;
}

interface AgentTerminalProps {
  logs: TerminalLog[];
  onClearLogs?: () => void;
  dispatchedCommand?: string | null;
  activeAgentId?: string | null;
}

const AGENT_COLORS: Record<string, string> = {
  KIRA: 'text-fuchsia-950 bg-fuchsia-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  CYPHER: 'text-cyan-950 bg-cyan-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  VEX: 'text-emerald-950 bg-emerald-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  TARIQ: 'text-purple-950 bg-purple-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  ATLAS: 'text-amber-950 bg-amber-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  LYRA: 'text-rose-950 bg-rose-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  MAYA: 'text-pink-950 bg-pink-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  AEGIS: 'text-sky-950 bg-sky-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  VELOX: 'text-orange-950 bg-orange-100 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
  SYSTEM: 'text-slate-950 bg-slate-200 shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)]',
};

export function AgentTerminal({
  logs,
  onClearLogs,
  dispatchedCommand,
  activeAgentId,
}: AgentTerminalProps) {
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [filterAgent, setFilterAgent] = useState<string>('ALL');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll strictly to bottom as new logs flow in
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = filterAgent === 'ALL'
    ? logs
    : logs.filter((l) => l.agent === filterAgent);

  return (
    <div className="w-full rounded-[32px] bg-gradient-to-br from-white via-slate-50 to-sky-50/60 shadow-[14px_14px_35px_rgba(163,177,198,0.35),_-14px_-14px_35px_rgba(255,255,255,0.95)] overflow-hidden flex flex-col h-[520px]">
      
      {/* Terminal Top Control Bar (Borderless 3D Morphic) */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.35),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal size={17} className="text-blue-950 animate-pulse" />
            <span className="text-xs font-mono font-black tracking-wider text-slate-950 uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
              Autonomous Agent Neural Stream
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-950 font-black shadow-[2px_2px_5px_rgba(163,177,198,0.3),_-2px_-2px_5px_rgba(255,255,255,0.9)] drop-shadow-xs">
              LIVE &middot; CODE BLUE ASCENDING
            </span>
          </div>
        </div>

        {/* Filter & Controls (Borderless 3D Morphism) */}
        <div className="flex items-center gap-2.5">
          {/* Agent Filter Selector */}
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="text-[11px] font-mono font-black bg-white text-slate-950 rounded-xl px-3 py-1.5 focus:outline-none shadow-[3px_3px_8px_rgba(163,177,198,0.35),_-3px_-3px_8px_rgba(255,255,255,0.95)] drop-shadow-xs cursor-pointer"
          >
            <option value="ALL">ALL AGENTS (8)</option>
            <option value="KIRA">KIRA (HEAD)</option>
            <option value="CYPHER">CYPHER (DEV)</option>
            <option value="VELOX">VELOX (SPEED &amp; UX)</option>
            <option value="VEX">VEX (SALES)</option>
            <option value="TARIQ">TARIQ (SEO)</option>
            <option value="ATLAS">ATLAS (STOCK)</option>
            <option value="LYRA">LYRA (DROP-OFFS)</option>
            <option value="MAYA">MAYA (MKTG)</option>
            <option value="AEGIS">AEGIS (SECURITY)</option>
          </select>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer drop-shadow-xs ${
              autoScroll
                ? 'bg-blue-100 text-blue-950 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),_inset_-2px_-2px_5px_rgba(255,255,255,0.9)]'
                : 'bg-white text-slate-900 shadow-[3px_3px_8px_rgba(163,177,198,0.35),_-3px_-3px_8px_rgba(255,255,255,0.95)]'
            }`}
            title={autoScroll ? 'Pause auto-scroll' : 'Enable auto-scroll'}
          >
            {autoScroll ? <Pause size={11} className="text-blue-950" /> : <Play size={11} className="text-slate-900" />}
            <span>{autoScroll ? 'AUTO-STREAM' : 'PAUSED'}</span>
          </button>

          {/* Clear Logs */}
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-950 shadow-[3px_3px_8px_rgba(163,177,198,0.35),_-3px_-3px_8px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all cursor-pointer"
              title="Clear terminal buffer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Dispatched Command Alert Banner */}
      {dispatchedCommand && (
        <div className="mx-4 mb-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-100/90 via-cyan-100/80 to-slate-100 shadow-[inset_3px_3px_7px_rgba(163,177,198,0.3),_inset_-3px_-3px_7px_rgba(255,255,255,0.95)] flex items-center justify-between text-xs font-mono text-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-blue-950 animate-bounce" />
            <span className="text-[11px] text-blue-950 font-black uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
              DISPATCHED DIRECTIVE:
            </span>
            <span className="text-slate-950 font-black truncate max-w-md drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
              "{dispatchedCommand}"
            </span>
          </div>
          {activeAgentId && (
            <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-lg bg-emerald-200 text-emerald-950 shadow-[2px_2px_5px_rgba(163,177,198,0.3)] drop-shadow-xs">
              Awakened: AGENT {activeAgentId}
            </span>
          )}
        </div>
      )}

      {/* Terminal Main Streaming Log Viewport (Recessed 3D Inset Cavity) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 mx-4 mb-3 p-4 overflow-y-auto space-y-2 font-mono text-[12px] leading-relaxed rounded-2xl bg-gradient-to-br from-slate-100/95 via-sky-50/70 to-slate-50/95 shadow-[inset_5px_5px_14px_rgba(163,177,198,0.38),_inset_-5px_-5px_14px_rgba(255,255,255,0.95)] scrollbar-thin scrollbar-thumb-slate-300"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-800 text-xs font-mono font-bold">
            <span>[WAITING FOR SUB-AGENT NEURAL ACTIVITY...]</span>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExec = log.level === 'EXEC';
            const isWarn = log.level === 'WARN';
            const isSuccess = log.level === 'SUCCESS';

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2.5 transition-opacity duration-300 hover:bg-white/60 px-2 py-1 rounded-lg ${
                  isExec ? 'bg-white/90 shadow-[2px_2px_6px_rgba(163,177,198,0.3),_-2px_-2px_6px_rgba(255,255,255,0.9)] pl-2.5' : ''
                }`}
              >
                {/* Timestamp */}
                <span className="text-slate-700 select-none text-[11px] font-black shrink-0 drop-shadow-xs">
                  [{log.timestamp}]
                </span>

                {/* Agent Tag */}
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 tracking-wider drop-shadow-xs ${
                    AGENT_COLORS[log.agent] || 'text-slate-950 bg-slate-200 shadow-sm'
                  }`}
                >
                  [{log.agent}]
                </span>

                {/* Level Arrow */}
                <span
                  className={`text-[11px] font-black shrink-0 select-none ${
                    isWarn
                      ? 'text-amber-950'
                      : isSuccess
                      ? 'text-emerald-950'
                      : isExec
                      ? 'text-blue-950'
                      : 'text-slate-950'
                  }`}
                >
                  {isExec ? '>>' : '>'}
                </span>

                {/* Message Body - PURE DARK BLUE / BLACK 3D TEXT */}
                <span
                  className={`break-all ${
                    isExec
                      ? 'text-blue-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]'
                      : isWarn
                      ? 'text-amber-950 font-bold drop-shadow-xs'
                      : isSuccess
                      ? 'text-emerald-950 font-bold drop-shadow-xs'
                      : 'text-slate-950 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer Statusline */}
      <div className="px-6 py-3 flex items-center justify-between text-[11px] font-mono text-slate-800 font-bold shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-blue-950 font-black drop-shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping inline-block" />
            <span>SOCKET: 0ms LATENCY</span>
          </span>
          <span>&middot;</span>
          <span className="text-slate-900 font-black">BUFFER: {filteredLogs.length} EVENTS</span>
          <span>&middot;</span>
          <span className="text-slate-700">ASCII UTF-8</span>
        </div>
        <div className="text-blue-950 font-black flex items-center gap-1 drop-shadow-xs">
          <ShieldCheck size={14} className="text-emerald-700" />
          <span>AUTONOMOUS WORKFLOW ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
