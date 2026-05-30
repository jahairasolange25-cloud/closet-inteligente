# State Management

## Overview

- **Client State:** Zustand v4 with persist middleware
- **Server State:** TanStack Query v5
- **Real-time State:** WebSocket events update Zustand stores

---

## Zustand Store Designs

### Store Conventions

```typescript
// Naming: use{Feature}Store
// File: src/stores/{feature}-store.ts
// Pattern: Zustand + Immer middleware for immutable updates
// Persistence: zustand/middleware persist where needed
```

---

### useAuthStore

**File:** `src/stores/auth-store.ts`

#### State Shape

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}
```

#### Actions

```typescript
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;    // Check existing token on app start
  clearError: () => void;
}
```

#### Selectors

```typescript
const selectUser = (state: AuthState) => state.user;
const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
const selectIsLoading = (state: AuthState) => state.isLoading;
const selectError = (state: AuthState) => state.error;
```

#### Middleware

```typescript
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    devtools(
      immer((set, get) => ({
        // ... state and actions
      }))
    ),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration between versions
        return persistedState as AuthState;
      },
    }
  )
);
```

#### Implementation

```typescript
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      login: async (email, password) => {
        set((state) => { state.isLoading = true; state.error = null; });
        try {
          const result = await authApi.login({ email, password });
          set((state) => {
            state.user = result.user;
            state.accessToken = result.tokens.accessToken;
            state.refreshToken = result.tokens.refreshToken;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
          apiClient.defaults.headers.common['Authorization'] =
            `Bearer ${result.tokens.accessToken}`;
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message;
          });
          throw error;
        }
      },

      register: async (data) => {
        set((state) => { state.isLoading = true; state.error = null; });
        try {
          const result = await authApi.register(data);
          set((state) => {
            state.user = result.user;
            state.accessToken = result.tokens.accessToken;
            state.refreshToken = result.tokens.refreshToken;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => { state.isLoading = false; state.error = error.message; });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout({ refreshToken: get().refreshToken! });
        } catch {
          // Continue with local logout even if API fails
        }
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.error = null;
        });
        delete apiClient.defaults.headers.common['Authorization'];
      },

      refreshAccessToken: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const result = await authApi.refresh({ refreshToken });
        set((state) => {
          state.accessToken = result.accessToken;
          state.refreshToken = result.refreshToken;
        });
        return result.accessToken;
      },

      updateProfile: async (data) => {
        const updatedUser = await userApi.updateProfile(data);
        set((state) => { state.user = updatedUser; });
      },

      setUser: (user) => set((state) => { state.user = user; }),

      initialize: async () => {
        const token = get().accessToken;
        if (!token) {
          set((state) => { state.isInitialized = true; });
          return;
        }

        try {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const user = await authApi.getMe();
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isInitialized = true;
          });
        } catch {
          // Token expired, try refresh
          try {
            const newToken = await get().refreshAccessToken();
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            const user = await authApi.getMe();
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.isInitialized = true;
            });
          } catch {
            get().logout();
            set((state) => { state.isInitialized = true; });
          }
        }
      },

      clearError: () => set((state) => { state.error = null; }),
    })),
    {
      name: 'closet-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

---

### useGarmentStore

**File:** `src/stores/garment-store.ts`

#### State Shape

```typescript
interface GarmentState {
  garments: Garment[];
  currentGarment: Garment | null;
  filters: {
    category: GarmentCategory | null;
    color: string | null;
    state: GarmentState | null;
    search: string;
    isFavorite: boolean | null;
    tags: string[];
    sortBy: 'name' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isProcessing: boolean;   // AI pipeline running
  error: string | null;
}
```

#### Actions

```typescript
interface GarmentActions {
  fetchGarments: (filters?: Partial<GarmentFilters>) => Promise<void>;
  fetchGarment: (id: string) => Promise<void>;
  createGarment: (data: CreateGarmentDto) => Promise<Garment>;
  updateGarment: (id: string, data: UpdateGarmentDto) => Promise<void>;
  deleteGarment: (id: string) => Promise<void>;
  uploadImage: (id: string, file: File) => Promise<void>;
  setFilters: (filters: Partial<GarmentFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  optimisticUpdate: (id: string, updates: Partial<Garment>) => void;
  addGarmentFromWebSocket: (garment: Garment) => void;
  updateGarmentFromWebSocket: (garment: Garment) => void;
  removeGarmentFromWebSocket: (id: string) => void;
  clearError: () => void;
}
```

#### Selectors

```typescript
const selectGarments = (state: GarmentState) => state.garments;
const selectCurrentGarment = (state: GarmentState) => state.currentGarment;
const selectFilters = (state: GarmentState) => state.filters;
const selectPagination = (state: GarmentState) => state.pagination;
const selectIsLoading = (state: GarmentState) => state.isLoading;
const selectFilteredCount = (state: GarmentState) =>
  state.garments.filter((g) => {
    const f = state.filters;
    if (f.category && g.category !== f.category) return false;
    if (f.color && g.color !== f.color) return false;
    if (f.state && g.state !== f.state) return false;
    return true;
  }).length;
```

---

### useOutfitStore

**File:** `src/stores/outfit-store.ts`

#### State Shape

```typescript
interface OutfitState {
  outfits: Outfit[];
  currentOutfit: Outfit | null;
  recommendations: Recommendation[];
  dailyOutfit: Outfit | null;
  filters: {
    occasion: string | null;
    season: Season | null;
    isFavorite: boolean | null;
    search: string;
  };
  pagination: PaginationState;
  isLoading: boolean;
  isGenerating: boolean;        // preview generation
  recommendationContext: {
    occasion: string;
    temperature: number | null;
    count: number;
  };
  error: string | null;
}
```

#### Actions

```typescript
interface OutfitActions {
  fetchOutfits: (filters?: OutfitFilters) => Promise<void>;
  fetchOutfit: (id: string) => Promise<void>;
  createOutfit: (data: CreateOutfitDto) => Promise<Outfit>;
  updateOutfit: (id: string, data: UpdateOutfitDto) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  generatePreview: (id: string) => Promise<void>;
  getRecommendations: (prefs: RecommendationPrefs) => Promise<void>;
  fetchDailyOutfit: () => Promise<void>;
  scheduleOutfit: (outfitId: string, date: string) => Promise<void>;
  setFilters: (filters: OutfitFilters) => void;
  addOutfitFromWebSocket: (outfit: Outfit) => void;
  updateOutfitFromWebSocket: (outfit: Outfit) => void;
}
```

---

### useAvatarStore

**File:** `src/stores/avatar-store.ts`

#### State Shape

```typescript
interface AvatarState {
  avatars: Avatar[];
  currentAvatar: Avatar | null;
  generation: {
    status: 'idle' | 'uploading' | 'generating' | 'completed' | 'failed';
    progress: number;        // 0-100
    estimatedTime: number;   // seconds
    error: string | null;
  };
  isLoading: boolean;
  error: string | null;
}
```

#### Actions

```typescript
interface AvatarActions {
  fetchAvatars: () => Promise<void>;
  fetchAvatar: (id: string) => Promise<void>;
  createAvatar: (data: CreateAvatarDto) => Promise<Avatar>;
  updateAvatar: (id: string, data: UpdateAvatarDto) => Promise<void>;
  deleteAvatar: (id: string) => Promise<void>;
  generateFromVideo: (id: string, video: File) => Promise<void>;
  setActiveAvatar: (id: string) => Promise<void>;
  setGenerationProgress: (status: string, progress: number) => void;
  addAvatarFromWebSocket: (avatar: Avatar) => void;
  updateAvatarFromWebSocket: (avatar: Avatar) => void;
}
```

---

### useCalendarStore

**File:** `src/stores/calendar-store.ts`

#### State Shape

```typescript
interface CalendarState {
  entries: CalendarEntry[];
  selectedDate: string;           // ISO date
  viewMode: 'month' | 'week' | 'day';
  navigation: {
    year: number;
    month: number;                 // 0-11
    weekStart: string;             // ISO date of week start
  };
  isLoading: boolean;
  error: string | null;
}
```

#### Actions

```typescript
interface CalendarActions {
  fetchRange: (startDate: string, endDate: string) => Promise<void>;
  scheduleOutfit: (outfitId: string, date: string, notes?: string) => Promise<void>;
  updateEntry: (id: string, data: UpdateCalendarDto) => Promise<void>;
  unschedule: (id: string) => Promise<void>;
  fillWeek: (startDate: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  navigateMonth: (direction: 1 | -1) => void;
  navigateWeek: (direction: 1 | -1) => void;
  goToToday: () => void;
  addEntryFromWebSocket: (entry: CalendarEntry) => void;
  updateEntryFromWebSocket: (entry: CalendarEntry) => void;
  removeEntryFromWebSocket: (id: string) => void;
}
```

#### Computed Selectors

```typescript
const selectEntriesForDate = (date: string) =>
  useCalendarStore((state) => state.entries.filter((e) => e.date === date));

const selectEntriesForMonth = (year: number, month: number) =>
  useCalendarStore((state) => state.entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }));

const selectMissingDays = (startDate: string, endDate: string) =>
  useCalendarStore((state) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const missing: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (!state.entries.find((e) => e.date === dateStr)) {
        missing.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
    return missing;
  });
```

---

### useNotificationStore

**File:** `src/stores/notification-store.ts`

#### State Shape

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  pagination: PaginationState;
  isLoading: boolean;
  error: string | null;
}
```

#### Actions

```typescript
interface NotificationActions {
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<NotificationSettings>) => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateUnreadCount: (delta: number) => void;
}
```

---

### useUIStore

**File:** `src/stores/ui-store.ts`

#### State Shape

```typescript
interface UIState {
  sidebar: {
    isOpen: boolean;
    isCollapsed: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  activeModal: string | null;
  activeDrawer: string | null;
  toasts: ToastItem[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
}
```

#### Actions

```typescript
interface UIActions {
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  openDrawer: (drawerId: string) => void;
  closeDrawer: () => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (date: Date) => void;
}
```

---

## TanStack Query Configuration

### QueryClient Setup

**File:** `src/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,         // 2 min
      gcTime: 1000 * 60 * 30,            // 30 min garbage collection
      retry: 2,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});
```

### Query Key Factory

**File:** `src/lib/query-keys.ts`

```typescript
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    preferences: ['auth', 'preferences'] as const,
  },
  garments: {
    all: ['garments'] as const,
    lists: () => [...queryKeys.garments.all, 'list'] as const,
    list: (filters: GarmentFilters) =>
      [...queryKeys.garments.lists(), filters] as const,
    details: () => [...queryKeys.garments.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.garments.details(), id] as const,
    search: (query: string, filters?: SearchFilters) =>
      [...queryKeys.garments.all, 'search', query, filters] as const,
    status: (id: string) =>
      [...queryKeys.garments.all, 'status', id] as const,
  },
  outfits: {
    all: ['outfits'] as const,
    lists: () => [...queryKeys.outfits.all, 'list'] as const,
    list: (filters: OutfitFilters) =>
      [...queryKeys.outfits.lists(), filters] as const,
    details: () => [...queryKeys.outfits.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.outfits.details(), id] as const,
    daily: ['outfits', 'daily'] as const,
    recommendations: (prefs: RecommendationPrefs) =>
      ['outfits', 'recommendations', prefs] as const,
  },
  avatars: {
    all: ['avatars'] as const,
    list: () => [...queryKeys.avatars.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.avatars.all, 'detail', id] as const,
    generationStatus: (id: string) =>
      [...queryKeys.avatars.all, 'generation', id] as const,
  },
  calendar: {
    all: ['calendar'] as const,
    range: (startDate: string, endDate: string) =>
      [...queryKeys.calendar.all, 'range', startDate, endDate] as const,
    summary: (startDate: string, endDate: string) =>
      [...queryKeys.calendar.all, 'summary', startDate, endDate] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (page: number) =>
      [...queryKeys.notifications.all, 'list', page] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
    settings: ['notifications', 'settings'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    garments: (period: string) =>
      [...queryKeys.analytics.all, 'garments', period] as const,
    aiPrecision: ['analytics', 'ai-precision'] as const,
    usage: (period: string) =>
      [...queryKeys.analytics.all, 'usage', period] as const,
    dashboard: (period: string) =>
      [...queryKeys.analytics.all, 'dashboard', period] as const,
  },
};
```

### Stale Time Configuration

| Query Type | Stale Time | GC Time | Refetch Interval |
|------------|------------|---------|-----------------|
| auth/me | 5 min | 30 min | On window focus |
| garments list | 2 min | 30 min | 5 min (polling) |
| garment detail | 5 min | 30 min | On window focus |
| garment search | 1 min | 10 min | On input change |
| processing status | 0 (always stale) | 1 min | 2 sec (polling) |
| outfits list | 2 min | 30 min | 5 min |
| outfit detail | 5 min | 30 min | On window focus |
| daily outfit | 10 min | 60 min | On mount |
| recommendations | 30 min | 60 min | Manual refresh |
| avatars list | 5 min | 30 min | On mount |
| avatar detail | 5 min | 30 min | On window focus |
| avatar gen status | 0 (always stale) | 1 min | 1 sec (polling) |
| calendar range | 5 min | 30 min | On navigate |
| notifications | 30 sec | 5 min | 30 sec (polling) |
| notification settings | 5 min | 30 min | On mount |
| analytics | 10 min | 60 min | 10 min (auto) |

### Cache Invalidation Strategy

```typescript
// After garment mutation
queryClient.invalidateQueries({ queryKey: queryKeys.garments.lists() });
queryClient.invalidateQueries({ queryKey: queryKeys.garments.details() });
queryClient.invalidateQueries({ queryKey: ['analytics'] });

// After outfit mutation
queryClient.invalidateQueries({ queryKey: queryKeys.outfits.lists() });
queryClient.invalidateQueries({ queryKey: queryKeys.outfits.details() });
queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });

// After calendar mutation
queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });

// After avatar mutation
queryClient.invalidateQueries({ queryKey: queryKeys.avatars.list() });
queryClient.invalidateQueries({ queryKey: queryKeys.avatars.detail('') });
```

### Optimistic Updates

```typescript
// Example: Toggle favorite on garment
const mutation = useMutation({
  mutationFn: (garmentId: string) =>
    api.patchGarment(garmentId, { isFavorite: !currentIsFavorite }),

  onMutate: async (garmentId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: queryKeys.garments.detail(garmentId),
    });

    // Snapshot previous value
    const previous = queryClient.getQueryData(
      queryKeys.garments.detail(garmentId)
    );

    // Optimistically update
    queryClient.setQueryData(queryKeys.garments.detail(garmentId), (old: any) => ({
      ...old,
      isFavorite: !old.isFavorite,
    }));

    return { previous };
  },

  onError: (err, garmentId, context) => {
    // Rollback
    if (context?.previous) {
      queryClient.setQueryData(
        queryKeys.garments.detail(garmentId),
        context.previous
      );
    }
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.garments.detail('') });
  },
});
```

---

## Store Interaction Patterns

### Pattern 1: Zustand for UI + TanStack Query for Server Data

```typescript
// Component combines both
function ClosetPage() {
  const filters = useGarmentStore((s) => s.filters);
  const setFilters = useGarmentStore((s) => s.setFilters);
  const pagination = useGarmentStore((s) => s.pagination);
  const setPage = useGarmentStore((s) => s.setPage);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.garments.list({ ...filters, ...pagination }),
    queryFn: () => api.getGarments({ ...filters, ...pagination }),
  });

  // Sync server data to Zustand when it arrives
  useEffect(() => {
    if (data) {
      useGarmentStore.setState({
        garments: data.data,
        pagination: {
          ...pagination,
          total: data.meta.total,
          totalPages: data.meta.totalPages,
        },
      });
    }
  }, [data]);

  // ... render
}
```

### Pattern 2: WebSocket Event → Zustand Update → Query Invalidation

```typescript
// In a custom hook or provider
function useWebSocketSync() {
  const addGarment = useGarmentStore((s) => s.addGarmentFromWebSocket);
  const updateGarment = useGarmentStore((s) => s.updateGarmentFromWebSocket);
  const removeGarment = useGarmentStore((s) => s.removeGarmentFromWebSocket);

  useEffect(() => {
    const socket = getSocket();

    socket.on('garment:created', (data) => {
      addGarment(data.garment);
      queryClient.invalidateQueries({ queryKey: queryKeys.garments.lists() });
    });

    socket.on('garment:updated', (data) => {
      updateGarment(data.garment);
      queryClient.setQueryData(
        queryKeys.garments.detail(data.garment.id),
        data.garment
      );
    });

    socket.on('garment:deleted', (data) => {
      removeGarment(data.id);
      queryClient.removeQueries({
        queryKey: queryKeys.garments.detail(data.id),
      });
    });

    return () => { socket.off(); };
  }, []);
}
```

### Pattern 3: Optimistic UI with Rollback

```typescript
function FavoriteButton({ garmentId, isFavorite }: Props) {
  const toggleFavorite = useMutation({
    mutationFn: () => api.patchGarment(garmentId, { isFavorite: !isFavorite }),
    onMutate: async () => {
      useGarmentStore.getState().optimisticUpdate(garmentId, {
        isFavorite: !isFavorite,
      });
    },
    onError: () => {
      useGarmentStore.getState().optimisticUpdate(garmentId, {
        isFavorite,
      });
      useUIStore.getState().addToast({
        type: 'error',
        message: 'Error al actualizar favorito',
      });
    },
  });

  return (
    <IconButton
      icon={isFavorite ? 'heart-filled' : 'heart'}
      onClick={() => toggleFavorite.mutate()}
    />
  );
}
```

### Pattern 4: Server-Controlled State (Form Data)

```typescript
function GarmentForm({ garmentId }: { garmentId?: string }) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: garmentId
      ? () => queryClient.getQueryData(queryKeys.garments.detail(garmentId))
      : defaultGarmentValues,
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      garmentId
        ? api.updateGarment(garmentId, data)
        : api.createGarment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.garments.lists() });
      if (garmentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.garments.detail(garmentId),
        });
      }
    },
  });
}
```
