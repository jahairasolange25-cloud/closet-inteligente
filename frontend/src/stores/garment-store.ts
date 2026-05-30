import { create } from 'zustand';
import { garmentsService } from '@/services/garments.service';
import { extractError } from '@/lib/api';
import type { Garment, GarmentFilters } from '@/types/garment';

interface GarmentState {
  garments: Garment[];
  currentGarment: Garment | null;
  filters: GarmentFilters;
  total: number;
  isLoading: boolean;
  error: string | null;

  fetchGarments: (filters?: GarmentFilters) => Promise<void>;
  fetchGarment: (id: string) => Promise<void>;
  setCurrentGarment: (g: Garment | null) => void;
  setFilters: (filters: Partial<GarmentFilters>) => void;
  resetFilters: () => void;
  optimisticUpdate: (id: string, data: Partial<Garment>) => void;
  optimisticDelete: (id: string) => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: GarmentFilters = { page: 1, limit: 24, sortBy: 'created_at', sortOrder: 'desc' };

export const useGarmentStore = create<GarmentState>()((set, get) => ({
  garments: [],
  currentGarment: null,
  filters: DEFAULT_FILTERS,
  total: 0,
  isLoading: false,
  error: null,

  fetchGarments: async (filters) => {
    const merged = { ...get().filters, ...filters };
    set({ isLoading: true, error: null, filters: merged });
    try {
      const result = await garmentsService.list(merged);
      set({ garments: result.data, total: result.meta.total, isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  fetchGarment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const garment = await garmentsService.get(id);
      set({ currentGarment: garment, isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  setCurrentGarment: (g) => set({ currentGarment: g }),

  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters, page: 1 } })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  optimisticUpdate: (id, data) =>
    set((s) => ({
      garments: s.garments.map((g) => (g.id === id ? { ...g, ...data } : g)),
      currentGarment: s.currentGarment?.id === id ? { ...s.currentGarment, ...data } : s.currentGarment,
    })),

  optimisticDelete: (id) =>
    set((s) => ({
      garments: s.garments.filter((g) => g.id !== id),
      currentGarment: s.currentGarment?.id === id ? null : s.currentGarment,
    })),

  clearError: () => set({ error: null }),
}));
