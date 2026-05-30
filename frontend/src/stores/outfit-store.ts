import { create } from 'zustand';
import { outfitsService } from '@/services/outfits.service';
import { extractError } from '@/lib/api';
import type { Outfit, OutfitFilters, OutfitRecommendation } from '@/types/outfit';

interface OutfitState {
  outfits: Outfit[];
  currentOutfit: Outfit | null;
  recommendations: OutfitRecommendation[];
  recommendationWarning: string | null;
  filters: OutfitFilters;
  total: number;
  isLoading: boolean;
  isRecommending: boolean;
  error: string | null;

  fetchOutfits: (filters?: OutfitFilters) => Promise<void>;
  fetchOutfit: (id: string) => Promise<void>;
  getRecommendations: (occasion?: string, season?: string, count?: number) => Promise<void>;
  setCurrentOutfit: (o: Outfit | null) => void;
  setFilters: (filters: Partial<OutfitFilters>) => void;
  optimisticUpdate: (id: string, data: Partial<Outfit>) => void;
  optimisticDelete: (id: string) => void;
  clearError: () => void;
}

export const useOutfitStore = create<OutfitState>()((set, get) => ({
  outfits: [],
  currentOutfit: null,
  recommendations: [],
  recommendationWarning: null,
  filters: { page: 1, limit: 20 },
  total: 0,
  isLoading: false,
  isRecommending: false,
  error: null,

  fetchOutfits: async (filters) => {
    const merged = { ...get().filters, ...filters };
    set({ isLoading: true, error: null, filters: merged });
    try {
      const result = await outfitsService.list(merged);
      set({ outfits: result.data, total: result.meta.total, isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  fetchOutfit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const outfit = await outfitsService.get(id);
      set({ currentOutfit: outfit, isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  getRecommendations: async (occasion, season, count = 3) => {
    set({ isRecommending: true, error: null });
    try {
      const result = await outfitsService.recommend({ occasion: occasion as never, season, count });
      set({
        recommendations: result.recommendations,
        recommendationWarning: result.meta.warning ?? null,
        isRecommending: false,
      });
    } catch (err) {
      set({ error: extractError(err), isRecommending: false });
    }
  },

  setCurrentOutfit: (o) => set({ currentOutfit: o }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters, page: 1 } })),

  optimisticUpdate: (id, data) =>
    set((s) => ({
      outfits: s.outfits.map((o) => (o.id === id ? { ...o, ...data } : o)),
      currentOutfit: s.currentOutfit?.id === id ? { ...s.currentOutfit, ...data } : s.currentOutfit,
    })),

  optimisticDelete: (id) =>
    set((s) => ({
      outfits: s.outfits.filter((o) => o.id !== id),
      currentOutfit: s.currentOutfit?.id === id ? null : s.currentOutfit,
    })),

  clearError: () => set({ error: null }),
}));
