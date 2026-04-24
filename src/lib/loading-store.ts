import { create } from 'zustand';

interface LoadingState {
  isRedirecting: boolean;
  message: string;
  setRedirecting: (status: boolean, msg?: string) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isRedirecting: false,
  message: "Processing...",
  setRedirecting: (status, msg) => set({ isRedirecting: status, message: msg || "Processing..." }),
}));
