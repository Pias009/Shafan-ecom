import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchState {
  query: string;
  isSearching: boolean;
  setQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearQuery: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: "",
      isSearching: false,
      setQuery: (query: string) => set({ query }),
      setIsSearching: (isSearching: boolean) => set({ isSearching }),
      clearQuery: () => set({ query: "", isSearching: false }),
    }),
    {
      name: "search-storage",
    }
  )
);
