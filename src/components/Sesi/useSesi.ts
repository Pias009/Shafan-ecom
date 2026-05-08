"use client";

import { create } from "zustand";

export type SesiStateName =
  | "PLAYFUL_FRIEND"
  | "DR_SESI_DIAGNOSIS"
  | "REVEAL_SHINE"
  | "ROUTINE_UPSELL"
  | "PRODUCT_REQUEST"
  | "SKIN_ANALYSIS"
  | "PRODUCT_RECOMMENDATION";

export interface RadarMetric {
  Hydration: number;
  "Oil Control": number;
  "Barrier Strength": number;
  Glow: number;
  Sensitivity: number;
}

export interface ProductSuggestion {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  skinTypes: string[];
  concerns: string[];
  howToUse?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  fromUser: boolean;
  state: SesiStateName;
  type: "text" | "skin_test_cta" | "product_prescription" | "chart" | "routine_pivot" | "product_recommendation" | "skin_analysis" | "cooldown";
  productId?: string;
  gifUrl?: string;
}

interface SesiStore {
  enabled: boolean;
  isOpen: boolean;
  state: SesiStateName;
  persona: "baby" | "doctor";
  messages: ChatMessage[];
  radarData: RadarMetric[];
  suggestedProducts: ProductSuggestion[];
  recommendedProductId: string | null;
  isTyping: boolean;
  routineTimerActive: boolean;
  hasTriggeredRoutinePivot: boolean;
  aiHistory: { role: "user" | "assistant"; content: string }[];
  skinType: string | null;
  skinConcerns: string[];
  questionCount: number;
  lastQuestionTime: number | null;
  cooldownExpiry: number | null;
  hasPurchased: boolean;

  setOpen: (open: boolean) => void;
  advanceState: (next: SesiStateName) => void;
  setPersona: (persona: "baby" | "doctor") => void;
  addMessage: (text: string, fromUser: boolean, type?: ChatMessage["type"], productId?: string, gifUrl?: string) => void;
  setTyping: (typing: boolean) => void;
  setRadarData: (data: Partial<RadarMetric>) => void;
  setChartData: (data: Record<string, number>) => void;
  setRecommendedProductId: (id: string | null) => void;
  setProductSuggestions: (products: ProductSuggestion[]) => void;
  clearProductSuggestions: () => void;
  addAIHistory: (role: "user" | "assistant", content: string) => void;
  triggerRoutinePivot: () => void;
  markRoutineComplete: () => void;
  setSkinType: (type: string) => void;
  setSkinConcerns: (concerns: string[]) => void;
  incrementQuestionCount: () => void;
  markPurchased: () => void;
  triggerCooldown: () => void;
  clearCooldown: () => void;
  reset: () => void;
}

const DEFAULT_RADAR: RadarMetric[] = [
  { Hydration: 0, "Oil Control": 0, "Barrier Strength": 0, Glow: 0, Sensitivity: 0 },
];

const ALLOWED_KEYS: (keyof RadarMetric)[] = [
  "Hydration", "Oil Control", "Barrier Strength", "Glow", "Sensitivity",
];

export const useSesi = create<SesiStore>((set) => ({
  enabled: process.env.NEXT_PUBLIC_SESI_ENABLED !== "false",
  isOpen: false,
  state: "PLAYFUL_FRIEND",
  persona: "baby",
  messages: [],
  radarData: DEFAULT_RADAR,
  suggestedProducts: [],
  recommendedProductId: null,
  isTyping: false,
  routineTimerActive: false,
  hasTriggeredRoutinePivot: false,
  aiHistory: [],
  skinType: null,
  skinConcerns: [],
  questionCount: 0,
  lastQuestionTime: null,
  cooldownExpiry: null,
  hasPurchased: false,

  setOpen: (open) => set({ isOpen: open }),

  advanceState: (next) => {
    if (next === "DR_SESI_DIAGNOSIS") {
      set({ state: next, persona: "doctor", routineTimerActive: false, hasTriggeredRoutinePivot: false });
    } else if (next === "PLAYFUL_FRIEND") {
      set({ state: next, persona: "baby" });
    } else if (next === "REVEAL_SHINE") {
      set({ state: next, persona: "doctor" });
    } else if (next === "ROUTINE_UPSELL") {
      set({ state: next, persona: "doctor", routineTimerActive: false });
    } else if (next === "PRODUCT_REQUEST") {
      set({ state: next, persona: "baby", skinType: null, skinConcerns: [] });
    } else if (next === "SKIN_ANALYSIS") {
      set({ state: next, persona: "doctor" });
    } else if (next === "PRODUCT_RECOMMENDATION") {
      set({ state: next, persona: "doctor" });
    } else {
      set({ state: next });
    }
  },

  setPersona: (persona) => set({ persona }),

  addMessage: (text: string, fromUser: boolean, type?: ChatMessage["type"], productId?: string, gifUrl?: string) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `${Date.now()}-${Math.random()}`,
          text,
          fromUser,
          state: state.state,
          type: type ?? "text",
          productId,
          gifUrl,
        },
      ],
    })),

  setTyping: (typing) => set({ isTyping: typing }),

  setRadarData: (updates) =>
    set((state) => {
      const current = { ...state.radarData[0] };
      for (const key of ALLOWED_KEYS) {
        if (key in updates) {
          const val = (updates as Partial<Record<string, number>>)[key];
          if (typeof val === "number") {
            current[key] = Math.max(0, Math.min(100, val));
          }
        }
      }
      return { radarData: [current] };
    }),

  setChartData: (updates) =>
    set((state) => {
      const current = { ...state.radarData[0] };
      const allowed = ["Hydration", "Oil Control", "Barrier Strength", "Glow", "Sensitivity"];
      for (const key of allowed) {
        if (key in updates && typeof updates[key] === "number") {
          (current as Record<string, number>)[key] = Math.max(0, Math.min(100, updates[key]));
        }
      }
      return { radarData: [current] };
    }),

  setRecommendedProductId: (id) => set({ recommendedProductId: id }),

  setProductSuggestions: (products) => set({ suggestedProducts: products }),

  clearProductSuggestions: () => set({ suggestedProducts: [] }),

  setSkinType: (type) => set({ skinType: type }),

  setSkinConcerns: (concerns) => set({ skinConcerns: concerns }),

  incrementQuestionCount: () =>
    set((state) => ({
      questionCount: state.questionCount + 1,
      lastQuestionTime: Date.now(),
    })),

  markPurchased: () => set({ hasPurchased: true, questionCount: 0, cooldownExpiry: null }),

  triggerCooldown: () => {
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem("sesi-cooldown", JSON.stringify(expiry));
    } catch {
      // ignore
    }
    set({ cooldownExpiry: expiry, questionCount: 0, lastQuestionTime: null });
  },

  clearCooldown: () => {
    try {
      localStorage.removeItem("sesi-cooldown");
    } catch {
      // ignore
    }
    set({ cooldownExpiry: null, questionCount: 0, lastQuestionTime: null });
  },

  addAIHistory: (role, content) =>
    set((state) => ({ aiHistory: [...state.aiHistory, { role, content }] })),

  triggerRoutinePivot: () => set({ routineTimerActive: true, hasTriggeredRoutinePivot: true }),

  markRoutineComplete: () => set({ routineTimerActive: false }),

  reset: () =>
    set({
      isOpen: false,
      state: "PLAYFUL_FRIEND",
      persona: "baby",
      messages: [],
      radarData: DEFAULT_RADAR,
      suggestedProducts: [],
      recommendedProductId: null,
      isTyping: false,
      routineTimerActive: false,
      hasTriggeredRoutinePivot: false,
      aiHistory: [],
      skinType: null,
      skinConcerns: [],
      questionCount: 0,
      lastQuestionTime: null,
      cooldownExpiry: null,
      hasPurchased: false,
    }),
}));
