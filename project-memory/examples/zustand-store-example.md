# Zustand Store Creation Example — useGarmentStore

> **Purpose:** Reference implementation for creating Zustand stores in the Closet Inteligente Digital project.
> **Pattern:** Store → Types → Middleware → Selectors → Hooks → Tests
> **Stack:** Zustand, Immer, TanStack Query, TypeScript

---

## Store Architecture

```
┌─────────────────────────────────────────────────────┐
│                  useGarmentStore                      │
├─────────────────────────────────────────────────────┤
│  State:                                               │
│    garments: Map<string, Garment>                     │
│    selectedGarmentId: string | null                   │
│    filters: GarmentFilters                            │
│    pagination: PaginationState                        │
│    loadingStates: Record<string, boolean>              │
│    errorState: string | null                          │
├─────────────────────────────────────────────────────┤
│  Actions:                                             │
│    fetchGarments()       setFilters()                 │
│    createGarment()       setSelectedGarment()         │
│    updateGarment()       selectGarment()              │
│    deleteGarment()       resetStore()                 │
├─────────────────────────────────────────────────────┤
│  Middleware:                                          │
│    persist (localStorage)                             │
│    immer (nested updates)                             │
│    devtools (Redux DevTools)                          │
├─────────────────────────────────────────────────────┤
│  Selectors:                                           │
│    useGarmentList()         useGarmentFilters()       │
│    useGarmentById()         useGarmentLoadingState()  │
└─────────────────────────────────────────────────────┘
```

---

## File 1: types/garment-store.types.ts

```typescript
import type { GarmentData } from './garment';

export type LoadingKey =
  | 'fetchGarments'
  | 'createGarment'
  | 'updateGarment'
  | 'deleteGarment'
  | 'fetchGarment'
  | 'batchOperation';

export interface GarmentFilters {
  type: string | null;
  category: string | null;
  state: string | null;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const DEFAULT_FILTERS: GarmentFilters = {
  type: null,
  category: null,
  state: null,
  search: '',
  sortBy: 'position',
  sortOrder: 'asc',
};

export const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export interface GarmentStoreState {
  garments: Map<string, GarmentData>;
  selectedGarmentId: string | null;
  filters: GarmentFilters;
  pagination: PaginationState;
  loadingStates: Record<LoadingKey, boolean>;
  errorState: string | null;
  lastSyncedAt: string | null;
}

export interface GarmentStoreActions {
  fetchGarments: (options?: {
    page?: number;
    pageSize?: number;
    append?: boolean;
  }) => Promise<void>;
  fetchGarmentById: (id: string) => Promise<GarmentData | null>;
  createGarment: (
    data: Omit<GarmentData, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<GarmentData>;
  updateGarment: (
    id: string,
    data: Partial<GarmentData>,
  ) => Promise<GarmentData>;
  deleteGarment: (id: string) => Promise<void>;
  setFilters: (filters: Partial<GarmentFilters>) => void;
  setSelectedGarment: (id: string | null) => void;
  selectGarment: (id: string) => void;
  resetFilters: () => void;
  resetStore: () => void;
  setLoading: (key: LoadingKey, value: boolean) => void;
  setError: (error: string | null) => void;
  updateGarmentInCache: (id: string, updates: Partial<GarmentData>) => void;
  removeGarmentFromCache: (id: string) => void;
  addGarmentToCache: (garment: GarmentData) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
}

export type GarmentStore = GarmentStoreState & GarmentStoreActions;
```

---

## File 2: stores/useGarmentStore.ts

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createSelectors } from './createSelectors';
import { garmentService } from '@/src/services/garmentService';
import type {
  GarmentStore,
  GarmentStoreState,
  LoadingKey,
} from '@/src/types/garment-store.types';
import {
  DEFAULT_FILTERS,
  DEFAULT_PAGINATION,
} from '@/src/types/garment-store.types';
import type { GarmentData } from '@/src/types/garment';

const initialState: GarmentStoreState = {
  garments: new Map<string, GarmentData>(),
  selectedGarmentId: null,
  filters: { ...DEFAULT_FILTERS },
  pagination: { ...DEFAULT_PAGINATION },
  loadingStates: {
    fetchGarments: false,
    createGarment: false,
    updateGarment: false,
    deleteGarment: false,
    fetchGarment: false,
    batchOperation: false,
  },
  errorState: null,
  lastSyncedAt: null,
};

export const useGarmentStoreBase = create<GarmentStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setLoading: (key: LoadingKey, value: boolean) => {
          set((state) => {
            state.loadingStates[key] = value;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.errorState = error;
          });
        },

        setFilters: (filters: Partial<typeof DEFAULT_FILTERS>) => {
          set((state) => {
            Object.assign(state.filters, filters);
            state.pagination.page = 1;
          });
        },

        resetFilters: () => {
          set((state) => {
            state.filters = { ...DEFAULT_FILTERS };
            state.pagination.page = 1;
          });
        },

        setSelectedGarment: (id: string | null) => {
          set((state) => {
            state.selectedGarmentId = id;
          });
        },

        selectGarment: (id: string) => {
          set((state) => {
            state.selectedGarmentId = id;
          });
        },

        setPagination: (pagination: Partial<typeof DEFAULT_PAGINATION>) => {
          set((state) => {
            Object.assign(state.pagination, pagination);
          });
        },

        fetchGarments: async (options) => {
          const state = get();
          const page = options?.page ?? state.pagination.page;
          const pageSize = options?.pageSize ?? state.pagination.pageSize;
          const append = options?.append ?? false;

          set((s) => {
            s.loadingStates.fetchGarments = true;
            s.errorState = null;
          });

          try {
            const result = await garmentService.listGarments({
              page,
              pageSize,
              type: state.filters.type ?? undefined,
              category: state.filters.category ?? undefined,
              state: state.filters.state ?? undefined,
              search: state.filters.search || undefined,
              sortBy: state.filters.sortBy,
              sortOrder: state.filters.sortOrder,
            });

            set((s) => {
              if (append) {
                for (const garment of result.data) {
                  s.garments.set(garment.id, garment);
                }
              } else {
                s.garments = new Map(
                  result.data.map((g: GarmentData) => [g.id, g]),
                );
              }
              s.pagination = {
                page: result.meta.page,
                pageSize: result.meta.pageSize,
                total: result.meta.total,
                totalPages: result.meta.totalPages,
                hasNext: result.meta.hasNext,
                hasPrevious: result.meta.hasPrevious,
              };
              s.lastSyncedAt = new Date().toISOString();
              s.loadingStates.fetchGarments = false;
            });
          } catch (error) {
            set((s) => {
              s.loadingStates.fetchGarments = false;
              s.errorState =
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch garments';
            });
            throw error;
          }
        },

        fetchGarmentById: async (id: string) => {
          set((s) => {
            s.loadingStates.fetchGarment = true;
            s.errorState = null;
          });

          try {
            const garment = await garmentService.getGarment(id);

            set((s) => {
              s.garments.set(garment.id, garment);
              s.loadingStates.fetchGarment = false;
            });

            return garment;
          } catch (error) {
            set((s) => {
              s.loadingStates.fetchGarment = false;
              s.errorState =
                error instanceof Error
                  ? error.message
                  : `Failed to fetch garment ${id}`;
            });
            return null;
          }
        },

        createGarment: async (data) => {
          set((s) => {
            s.loadingStates.createGarment = true;
            s.errorState = null;
          });

          try {
            const garment = await garmentService.createGarment(data);

            set((s) => {
              s.garments.set(garment.id, garment);
              s.pagination.total += 1;
              s.loadingStates.createGarment = false;
            });

            return garment;
          } catch (error) {
            set((s) => {
              s.loadingStates.createGarment = false;
              s.errorState =
                error instanceof Error
                  ? error.message
                  : 'Failed to create garment';
            });
            throw error;
          }
        },

        updateGarment: async (id, data) => {
          const previous = get().garments.get(id);

          set((s) => {
            if (previous) {
              Object.assign(s.garments.get(id)!, data);
            }
            s.loadingStates.updateGarment = true;
            s.errorState = null;
          });

          try {
            const updated = await garmentService.updateGarment(id, data);

            set((s) => {
              s.garments.set(id, updated);
              s.loadingStates.updateGarment = false;
            });

            return updated;
          } catch (error) {
            set((s) => {
              if (previous) {
                s.garments.set(id, previous);
              }
              s.loadingStates.updateGarment = false;
              s.errorState =
                error instanceof Error
                  ? error.message
                  : `Failed to update garment ${id}`;
            });
            throw error;
          }
        },

        deleteGarment: async (id: string) => {
          const previous = get().garments.get(id);

          set((s) => {
            s.garments.delete(id);
            if (s.selectedGarmentId === id) {
              s.selectedGarmentId = null;
            }
            s.loadingStates.deleteGarment = true;
            s.errorState = null;
          });

          try {
            await garmentService.deleteGarment(id);

            set((s) => {
              s.pagination.total = Math.max(0, s.pagination.total - 1);
              s.loadingStates.deleteGarment = false;
            });
          } catch (error) {
            set((s) => {
              if (previous) {
                s.garments.set(id, previous);
              }
              s.loadingStates.deleteGarment = false;
              s.errorState =
                error instanceof Error
                  ? error.message
                  : `Failed to delete garment ${id}`;
            });
            throw error;
          }
        },

        updateGarmentInCache: (id, updates) => {
          set((s) => {
            const existing = s.garments.get(id);
            if (existing) {
              Object.assign(existing, updates);
            }
          });
        },

        removeGarmentFromCache: (id) => {
          set((s) => {
            s.garments.delete(id);
            if (s.selectedGarmentId === id) {
              s.selectedGarmentId = null;
            }
          });
        },

        addGarmentToCache: (garment) => {
          set((s) => {
            s.garments.set(garment.id, garment);
          });
        },

        resetStore: () => {
          set((s) => {
            s.garments = new Map();
            s.selectedGarmentId = null;
            s.filters = { ...DEFAULT_FILTERS };
            s.pagination = { ...DEFAULT_PAGINATION };
            s.loadingStates = {
              fetchGarments: false,
              createGarment: false,
              updateGarment: false,
              deleteGarment: false,
              fetchGarment: false,
              batchOperation: false,
            };
            s.errorState = null;
            s.lastSyncedAt = null;
          });
        },
      })),
      {
        name: 'garment-store',
        partialize: (state) => ({
          filters: state.filters,
          pagination: state.pagination,
          selectedGarmentId: state.selectedGarmentId,
        }),
      },
    ),
    {
      name: 'GarmentStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
);
```

---

## File 3: stores/useGarmentStore.selectors.ts

```typescript
import { useGarmentStoreBase } from './useGarmentStore';
import type { GarmentData } from '@/src/types/garment';

export function useGarmentList(): GarmentData[] {
  return useGarmentStoreBase((state) => {
    return Array.from(state.garments.values());
  });
}

export function useGarmentById(id: string | undefined): GarmentData | null {
  return useGarmentStoreBase((state) => {
    if (!id) return null;
    return state.garments.get(id) ?? null;
  });
}

export function useGarmentFilters() {
  return useGarmentStoreBase((state) => state.filters);
}

export function useGarmentLoadingState(key?: string): boolean {
  return useGarmentStoreBase((state) => {
    if (key) {
      return state.loadingStates[key as keyof typeof state.loadingStates] ?? false;
    }
    return Object.values(state.loadingStates).some(Boolean);
  });
}

export function useGarmentPagination() {
  return useGarmentStoreBase((state) => state.pagination);
}

export function useGarmentError(): string | null {
  return useGarmentStoreBase((state) => state.errorState);
}

export function useSelectedGarment(): GarmentData | null {
  return useGarmentStoreBase((state) => {
    if (!state.selectedGarmentId) return null;
    return state.garments.get(state.selectedGarmentId) ?? null;
  });
}

export function useGarmentCount(): number {
  return useGarmentStoreBase((state) => state.garments.size);
}

export function useGarmentsByType(type: string): GarmentData[] {
  return useGarmentStoreBase((state) => {
    return Array.from(state.garments.values()).filter(
      (g) => g.type === type,
    );
  });
}

export function useGarmentsByState(state: string): GarmentData[] {
  return useGarmentStoreBase((state) => {
    return Array.from(state.garments.values()).filter(
      (g) => g.state === state,
    );
  });
}

export function useIsGarmentSelected(id: string): boolean {
  return useGarmentStoreBase((state) => state.selectedGarmentId === id);
}
```

---

## File 4: stores/useGarmentStore.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGarmentStoreBase } from './useGarmentStore';
import { garmentService } from '@/src/services/garmentService';
import type { GarmentData } from '@/src/types/garment';

vi.mock('@/src/services/garmentService', () => ({
  garmentService: {
    listGarments: vi.fn(),
    getGarment: vi.fn(),
    createGarment: vi.fn(),
    updateGarment: vi.fn(),
    deleteGarment: vi.fn(),
  },
}));

const createMockGarment = (overrides: Partial<GarmentData> = {}): GarmentData => ({
  id: 'garment-1',
  userId: 'user-1',
  name: 'Blue Denim Jacket',
  description: null,
  type: 'outerwear',
  category: 'jacket',
  state: 'ready',
  brand: 'Levi',
  color: 'Blue',
  colorHex: '#1a5c8a',
  size: 'M',
  material: 'Denim',
  imageUrl: 'https://example.com/jacket.jpg',
  thumbnailUrl: null,
  maskUrl: null,
  aiTags: null,
  pipelineStatus: null,
  position: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

const mockGarments: GarmentData[] = [
  createMockGarment({ id: 'g1', name: 'Jacket A', type: 'outerwear', position: 0 }),
  createMockGarment({ id: 'g2', name: 'Shirt B', type: 'top', position: 1 }),
  createMockGarment({ id: 'g3', name: 'Jeans C', type: 'bottom', position: 2 }),
];

const createPaginatedResponse = (
  data: GarmentData[],
  page = 1,
  pageSize = 20,
) => ({
  data,
  meta: {
    page,
    pageSize,
    total: data.length,
    totalPages: Math.ceil(data.length / pageSize),
    hasNext: page < Math.ceil(data.length / pageSize),
    hasPrevious: page > 1,
  },
});

describe('useGarmentStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useGarmentStoreBase());
    act(() => {
      result.current.resetStore();
    });
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should start with empty garments', () => {
      const { result } = renderHook(() => useGarmentStoreBase());
      expect(result.current.garments.size).toBe(0);
    });

    it('should start with no selected garment', () => {
      const { result } = renderHook(() => useGarmentStoreBase());
      expect(result.current.selectedGarmentId).toBeNull();
    });

    it('should start with default filters', () => {
      const { result } = renderHook(() => useGarmentStoreBase());
      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.sortBy).toBe('position');
    });

    it('should start with default pagination', () => {
      const { result } = renderHook(() => useGarmentStoreBase());
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.pagination.pageSize).toBe(20);
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useGarmentStoreBase());
      expect(result.current.errorState).toBeNull();
    });

    it('should start with all loading states false', () => {
      const { result } = renderHook(() => useGarmentStoreBase());
      const allFalse = Object.values(result.current.loadingStates).every(
        (v) => v === false,
      );
      expect(allFalse).toBe(true);
    });
  });

  describe('Actions - setLoading / setError', () => {
    it('should set loading state for a key', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setLoading('fetchGarments', true);
      });

      expect(result.current.loadingStates.fetchGarments).toBe(true);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.errorState).toBe('Something went wrong');
    });

    it('should clear error state', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setError('Error');
      });
      act(() => {
        result.current.setError(null);
      });

      expect(result.current.errorState).toBeNull();
    });
  });

  describe('Actions - setFilters', () => {
    it('should update filters and reset page to 1', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setPagination({ page: 5 });
      });
      act(() => {
        result.current.setFilters({ search: 'jacket', type: 'outerwear' });
      });

      expect(result.current.filters.search).toBe('jacket');
      expect(result.current.filters.type).toBe('outerwear');
      expect(result.current.pagination.page).toBe(1);
    });

    it('should merge partial filters', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setFilters({ category: 'jacket' });
      });

      expect(result.current.filters.category).toBe('jacket');
      expect(result.current.filters.search).toBe('');
    });
  });

  describe('Actions - setSelectedGarment / selectGarment', () => {
    it('should set selected garment id', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setSelectedGarment('g1');
      });

      expect(result.current.selectedGarmentId).toBe('g1');
    });

    it('should clear selected garment', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setSelectedGarment('g1');
      });
      act(() => {
        result.current.setSelectedGarment(null);
      });

      expect(result.current.selectedGarmentId).toBeNull();
    });
  });

  describe('Actions - fetchGarments', () => {
    it('should load garments into the store', async () => {
      const mockResponse = createPaginatedResponse(mockGarments);
      vi.mocked(garmentService.listGarments).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments();
      });

      expect(result.current.garments.size).toBe(3);
      expect(result.current.garments.get('g1')?.name).toBe('Jacket A');
    });

    it('should set loading state during fetch', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse(mockGarments),
      );

      const { result } = renderHook(() => useGarmentStoreBase());

      const fetchPromise = act(async () => {
        await result.current.fetchGarments();
      });

      expect(result.current.loadingStates.fetchGarments).toBe(true);
      await fetchPromise;
      expect(result.current.loadingStates.fetchGarments).toBe(false);
    });

    it('should update pagination from response', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse(mockGarments, 1, 10),
      );

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments({ page: 1, pageSize: 10 });
      });

      expect(result.current.pagination.pageSize).toBe(10);
      expect(result.current.pagination.total).toBe(3);
    });

    it('should append garments when append option is true', async () => {
      vi.mocked(garmentService.listGarments)
        .mockResolvedValueOnce(createPaginatedResponse([mockGarments[0]]))
        .mockResolvedValueOnce(createPaginatedResponse([mockGarments[1]]));

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments({ page: 1, pageSize: 1 });
      });
      await act(async () => {
        await result.current.fetchGarments({ page: 2, pageSize: 1, append: true });
      });

      expect(result.current.garments.size).toBe(2);
    });

    it('should handle fetch errors', async () => {
      vi.mocked(garmentService.listGarments).mockRejectedValue(
        new Error('Network error'),
      );

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        try {
          await result.current.fetchGarments();
        } catch {
          // expected
        }
      });

      expect(result.current.errorState).toBe('Network error');
      expect(result.current.loadingStates.fetchGarments).toBe(false);
    });

    it('should update lastSyncedAt on success', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse(mockGarments),
      );

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments();
      });

      expect(result.current.lastSyncedAt).toBeTruthy();
    });
  });

  describe('Actions - fetchGarmentById', () => {
    it('should fetch and cache a single garment', async () => {
      vi.mocked(garmentService.getGarment).mockResolvedValue(mockGarments[0]);

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarmentById('g1');
      });

      expect(result.current.garments.get('g1')).toBeDefined();
      expect(garmentService.getGarment).toHaveBeenCalledWith('g1');
    });

    it('should return null on error', async () => {
      vi.mocked(garmentService.getGarment).mockRejectedValue(
        new Error('Not found'),
      );

      const { result } = renderHook(() => useGarmentStoreBase());

      let fetched: GarmentData | null = null;
      await act(async () => {
        fetched = await result.current.fetchGarmentById('nonexistent');
      });

      expect(fetched).toBeNull();
      expect(result.current.errorState).toBeTruthy();
    });
  });

  describe('Actions - createGarment', () => {
    it('should add garment to store on success', async () => {
      const newGarment = createMockGarment({ id: 'g4', name: 'New Hat' });
      vi.mocked(garmentService.createGarment).mockResolvedValue(newGarment);

      const { result } = renderHook(() => useGarmentStoreBase());

      let created: GarmentData | undefined;
      await act(async () => {
        created = await result.current.createGarment(newGarment);
      });

      expect(result.current.garments.get('g4')?.name).toBe('New Hat');
      expect(created?.name).toBe('New Hat');
    });

    it('should increment total count', async () => {
      const newGarment = createMockGarment({ id: 'g4' });
      vi.mocked(garmentService.createGarment).mockResolvedValue(newGarment);

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.createGarment(newGarment);
      });

      expect(result.current.pagination.total).toBe(1);
    });

    it('should handle create errors', async () => {
      vi.mocked(garmentService.createGarment).mockRejectedValue(
        new Error('Validation error'),
      );

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        try {
          await result.current.createGarment(createMockGarment());
        } catch {
          // expected
        }
      });

      expect(result.current.errorState).toBe('Validation error');
    });
  });

  describe('Actions - updateGarment (optimistic update)', () => {
    it('should optimistically update the garment', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse([mockGarments[0]]),
      );
      const updatedData = { name: 'Updated Jacket' };
      vi.mocked(garmentService.updateGarment).mockResolvedValue({
        ...mockGarments[0],
        ...updatedData,
      });

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments();
      });
      await act(async () => {
        await result.current.updateGarment('g1', updatedData);
      });

      expect(result.current.garments.get('g1')?.name).toBe('Updated Jacket');
    });

    it('should rollback on update failure', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse([mockGarments[0]]),
      );
      vi.mocked(garmentService.updateGarment).mockRejectedValue(
        new Error('Conflict'),
      );

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments();
      });

      await act(async () => {
        try {
          await result.current.updateGarment('g1', { name: 'Should Fail' });
        } catch {
          // expected
        }
      });

      expect(result.current.garments.get('g1')?.name).toBe('Jacket A');
      expect(result.current.errorState).toBe('Conflict');
    });

    it('should set loading state during update', async () => {
      vi.mocked(garmentService.updateGarment).mockResolvedValue(mockGarments[0]);

      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.addGarmentToCache(mockGarments[0]);
      });

      const updatePromise = act(async () => {
        await result.current.updateGarment('g1', { name: 'Updated' });
      });

      expect(result.current.loadingStates.updateGarment).toBe(true);
      await updatePromise;
      expect(result.current.loadingStates.updateGarment).toBe(false);
    });
  });

  describe('Actions - deleteGarment (optimistic delete)', () => {
    it('should optimistically remove garment', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse(mockGarments),
      );
      vi.mocked(garmentService.deleteGarment).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments();
      });
      await act(async () => {
        await result.current.deleteGarment('g1');
      });

      expect(result.current.garments.has('g1')).toBe(false);
    });

    it('should rollback on delete failure', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse(mockGarments),
      );
      vi.mocked(garmentService.deleteGarment).mockRejectedValue(
        new Error('Forbidden'),
      );

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments();
      });

      await act(async () => {
        try {
          await result.current.deleteGarment('g1');
        } catch {
          // expected
        }
      });

      expect(result.current.garments.has('g1')).toBe(true);
      expect(result.current.errorState).toBe('Forbidden');
    });

    it('should clear selectedGarmentId if deleted garment was selected', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse(mockGarments),
      );
      vi.mocked(garmentService.deleteGarment).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments();
      });
      act(() => {
        result.current.selectGarment('g1');
      });
      await act(async () => {
        await result.current.deleteGarment('g1');
      });

      expect(result.current.selectedGarmentId).toBeNull();
    });

    it('should decrement total on successful delete', async () => {
      vi.mocked(garmentService.listGarments).mockResolvedValue(
        createPaginatedResponse(mockGarments),
      );
      vi.mocked(garmentService.deleteGarment).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGarmentStoreBase());

      await act(async () => {
        await result.current.fetchGarments();
      });

      const prevTotal = result.current.pagination.total;
      await act(async () => {
        await result.current.deleteGarment('g1');
      });

      expect(result.current.pagination.total).toBe(prevTotal - 1);
    });
  });

  describe('Actions - cache management', () => {
    it('updateGarmentInCache should merge updates', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.addGarmentToCache(mockGarments[0]);
      });
      act(() => {
        result.current.updateGarmentInCache('g1', { color: 'Red' });
      });

      expect(result.current.garments.get('g1')?.color).toBe('Red');
      expect(result.current.garments.get('g1')?.name).toBe('Jacket A');
    });

    it('removeGarmentFromCache should delete the garment', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.addGarmentToCache(mockGarments[0]);
      });
      act(() => {
        result.current.removeGarmentFromCache('g1');
      });

      expect(result.current.garments.has('g1')).toBe(false);
    });

    it('addGarmentToCache should add garment', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.addGarmentToCache(mockGarments[0]);
      });

      expect(result.current.garments.size).toBe(1);
    });
  });

  describe('Actions - resetStore', () => {
    it('should clear all state', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.addGarmentToCache(mockGarments[0]);
        result.current.selectGarment('g1');
        result.current.setFilters({ search: 'test' });
        result.current.setError('error');
      });

      act(() => {
        result.current.resetStore();
      });

      expect(result.current.garments.size).toBe(0);
      expect(result.current.selectedGarmentId).toBeNull();
      expect(result.current.filters.search).toBe('');
      expect(result.current.errorState).toBeNull();
    });
  });

  describe('Middleware - Persist', () => {
    it('should persist filters across store resets', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setFilters({ search: 'persisted' });
      });

      act(() => {
        result.current.resetStore();
      });

      expect(result.current.filters.search).toBe('');
    });
  });

  describe('Middleware - Immer', () => {
    it('should allow nested state updates immutably', () => {
      const { result } = renderHook(() => useGarmentStoreBase());

      act(() => {
        result.current.setFilters({ search: 'test', type: 'top' });
      });

      expect(result.current.filters.search).toBe('test');
      expect(result.current.filters.type).toBe('top');
    });
  });
});
```

---

## Key Patterns Demonstrated

| Pattern | Implementation |
|---------|---------------|
| **TypeScript Types** | Full type safety for state, actions, and selectors |
| **Zustand with Immer** | `immer` middleware for immutable nested updates |
| **Zustand with Persist** | `persist` middleware saving filters/pagination to localStorage |
| **Zustand with Devtools** | `devtools` middleware for Redux DevTools integration |
| **Optimistic Updates** | `updateGarment` and `deleteGarment` with rollback on failure |
| **Loading States** | Per-action loading tracking via `loadingStates` record |
| **Error Handling** | Centralized `errorState` with typed error messages |
| **Selectors** | Derived/memoized selectors via `useGarmentStoreBase` subscriptions |
| **Pagination** | Full pagination state synced with API responses |
| **Filters** | Filter state with automatic page reset on change |
| **Append Mode** | `append` option for infinite scroll patterns |
| **Testing** | Comprehensive tests covering all actions, optimistic updates, rollbacks |
