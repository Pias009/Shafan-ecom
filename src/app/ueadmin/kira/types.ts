export type SubAgentId = 'VEX' | 'CYPHER' | 'TARIQ' | 'ATLAS' | 'MAYA' | 'LYRA' | 'AEGIS' | 'VELOX';

export interface AgentPodData {
  id: SubAgentId;
  name: string;
  codename: string;
  role: string;
  team: string;
  isAwakened: boolean;
  neuralLoad: number;
  pingRate: number;
  color: {
    border: string;
    glow: string;
    text: string;
    bg: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
  };
  metricsSummary: string;
  currentTask: string;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  agent: 'KIRA' | 'CYPHER' | 'VEX' | 'TARIQ' | 'ATLAS' | 'LYRA' | 'MAYA' | 'AEGIS' | 'VELOX' | 'SYSTEM';
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'EXEC';
  message: string;
}
