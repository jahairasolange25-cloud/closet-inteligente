# API Integration

## Overview

- **HTTP Client:** Axios v1.x with interceptors
- **Server State:** TanStack Query v5
- **Real-time:** Socket.IO client v4
- **Base URL:** `https://api.closetinteligente.com/v1`

---

## Axios Client Configuration

**File:** `src/lib/api-client.ts`

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.closetinteligente.com/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    'X-Platform': 'web',
    'Accept-Language': 'es',
  },
});
```

---

## Interceptors

### Auth Token Interceptor

```typescript
// Request interceptor: Attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Token Refresh Interceptor

```typescript
// Response interceptor: Handle 401 with token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't retry auth endpoints
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        useAuthStore.setState({
          accessToken,
          refreshToken: newRefreshToken,
        });

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

### Request ID Interceptor

```typescript
apiClient.interceptors.request.use((config) => {
  config.headers['X-Request-Id'] = crypto.randomUUID();
  return config;
});
```

### Retry Interceptor

```typescript
import axiosRetry from 'axios-retry';

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => {
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 ||
      error.response?.status === 503
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.warn(
      `Retry attempt ${retryCount} for ${requestConfig.url}: ${error.message}`
    );
  },
});
```

---

## Error Handling Patterns

### Error Type Definitions

**File:** `src/lib/errors.ts`

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Error de conexión') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Sesión expirada') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ApiError {
  constructor(details: Record<string, string[]>) {
    super(400, 'VALIDATION_ERROR', 'Error de validación', details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends ApiError {
  constructor(public retryAfter: number) {
    super(429, 'RATE_LIMITED', 'Demasiadas solicitudes');
    this.name = 'RateLimitError';
  }
}
```

### Error Handler Utility

**File:** `src/lib/error-handler.ts`

```typescript
import { AxiosError } from 'axios';
import { ApiError, NetworkError, AuthenticationError, ValidationError, RateLimitError } from './errors';

export function handleApiError(error: AxiosError): never {
  if (!error.response) {
    throw new NetworkError();
  }

  const { status, data } = error.response;
  const errorData = data as any;

  switch (status) {
    case 400:
      throw new ValidationError(errorData?.details || {});
    case 401:
      throw new AuthenticationError(errorData?.message);
    case 403:
      throw new ApiError(403, 'FORBIDDEN', errorData?.message || 'Acceso denegado');
    case 404:
      throw new ApiError(404, 'NOT_FOUND', errorData?.message || 'Recurso no encontrado');
    case 409:
      throw new ApiError(409, 'CONFLICT', errorData?.message || 'Conflicto');
    case 413:
      throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Archivo demasiado grande');
    case 429:
      throw new RateLimitError(errorData?.retryAfter || 60);
    case 500:
      throw new ApiError(500, 'INTERNAL_ERROR', 'Error interno del servidor');
    case 503:
      throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Servicio no disponible');
    default:
      throw new ApiError(status, 'UNKNOWN_ERROR', errorData?.message || 'Error desconocido');
  }
}
```

### React Query Error Handler

```typescript
// src/lib/query-client.ts
import { MutationCache, QueryCache } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui-store';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error instanceof AuthenticationError) {
        useAuthStore.getState().logout();
        return;
      }
      if (error instanceof NetworkError) {
        useUIStore.getState().addToast({
          type: 'warning',
          message: 'Sin conexión. Los cambios se sincronizarán cuando vuelvas a estar en línea.',
          duration: 5000,
        });
        return;
      }
      if (error instanceof RateLimitError) {
        useUIStore.getState().addToast({
          type: 'warning',
          message: `Demasiadas solicitudes. Espera ${error.retryAfter} segundos.`,
          duration: error.retryAfter * 1000,
        });
        return;
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof ValidationError) {
        // Validation errors handled at form level
        return;
      }
      useUIStore.getState().addToast({
        type: 'error',
        message: error instanceof ApiError ? error.message : 'Error inesperado',
      });
    },
  }),
});
```

---

## Offline Support

### Offline Detection

```typescript
// src/hooks/use-online-status.ts
import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';

export function useOnlineStatus() {
  const setOnline = useUIStore((s) => s.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);
}
```

### Offline Request Queue

**File:** `src/lib/offline-queue.ts`

```typescript
import { Mutex } from 'async-mutex';

interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private mutex = new Mutex();
  private processing = false;

  private get storageKey() {
    return 'offline-queue';
  }

  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>) {
    await this.mutex.runExclusive(() => {
      this.queue.push({
        ...request,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        retryCount: 0,
      });
      this.persist();
    });
  }

  async process() {
    if (this.processing || !navigator.onLine) return;

    await this.mutex.runExclusive(async () => {
      this.processing = true;
      const batch = [...this.queue];
      this.queue = [];

      for (const request of batch) {
        try {
          await apiClient({
            method: request.method,
            url: request.url,
            data: request.data,
          });
        } catch (error) {
          if (request.retryCount < 3) {
            this.queue.push({
              ...request,
              retryCount: request.retryCount + 1,
            });
          } else {
            console.error(`Failed to sync ${request.url}:`, error);
            useUIStore.getState().addToast({
              type: 'error',
              message: `Error al sincronizar: ${request.url}`,
            });
          }
        }
      }

      this.persist();
      this.processing = false;
    });
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch {
      console.warn('Failed to persist offline queue');
    }
  }

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    localStorage.removeItem(this.storageKey);
  }
}

export const offlineQueue = new OfflineQueue();
```

---

## Type-Safe API Hooks

**File:** `src/hooks/queries/use-garments.ts`

```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { handleApiError } from '@/lib/error-handler';
import { offlineQueue } from '@/lib/offline-queue';

// ========== Queries ==========

export function useGarments(filters: GarmentFilters) {
  return useQuery({
    queryKey: queryKeys.garments.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Garment>>('/garments', {
        params: filters,
      });
      return data;
    },
    placeholderData: keepPreviousData,
    select: (response) => ({
      garments: response.data,
      pagination: response.meta,
    }),
  });
}

export function useGarment(id: string) {
  return useQuery({
    queryKey: queryKeys.garments.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Garment>(`/garments/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useSearchGarments(query: string, filters?: SearchFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.garments.search(query, filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedResponse<Garment>>('/garments/search', {
        params: { q: query, page: pageParam, ...filters },
      });
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: query.length >= 2,
  });
}

export function useGarmentProcessingStatus(id: string) {
  return useQuery({
    queryKey: queryKeys.garments.status(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ProcessingStatusResponse>(`/garments/${id}/status`);
      return data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.processingStatus;
      return status === 'processing' || status === 'pending' ? 2000 : false;
    },
  });
}

// ========== Mutations ==========

export function useCreateGarment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newGarment: CreateGarmentDto) => {
      if (!navigator.onLine) {
        await offlineQueue.enqueue({
          url: '/garments',
          method: 'POST',
          data: newGarment,
        });
        return null;
      }
      const { data } = await apiClient.post<Garment>('/garments', newGarment);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.garments.lists() });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: handleApiError,
  });
}

export function useUpdateGarment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateGarmentDto }) => {
      if (!navigator.onLine) {
        await offlineQueue.enqueue({
          url: `/garments/${id}`,
          method: 'PATCH',
          data: updates,
        });
        return { id, ...updates } as Garment;
      }
      const { data } = await apiClient.patch<Garment>(`/garments/${id}`, updates);
      return data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.garments.detail(id) });
      const previous = queryClient.getQueryData<Garment>(queryKeys.garments.detail(id));
      queryClient.setQueryData<Garment>(queryKeys.garments.detail(id), (old) => ({
        ...old!,
        ...updates,
      }));
      return { previous };
    },
    onError: (err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.garments.detail(id), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.garments.lists() });
    },
  });
}

export function useDeleteGarment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await offlineQueue.enqueue({
          url: `/garments/${id}`,
          method: 'DELETE',
        });
        return id;
      }
      await apiClient.delete(`/garments/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.garments.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.garments.lists() });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUploadGarmentImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await apiClient.post<Garment>(`/garments/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percent}%`);
          }
        },
      });
      return data;
    },
    onSuccess: (garment) => {
      queryClient.setQueryData(queryKeys.garments.detail(garment.id), garment);
      queryClient.invalidateQueries({ queryKey: queryKeys.garments.lists() });
    },
    onError: handleApiError,
  });
}
```

**File:** `src/hooks/queries/use-outfits.ts`

```typescript
export function useOutfits(filters: OutfitFilters) {
  return useQuery({
    queryKey: queryKeys.outfits.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Outfit>>('/outfits', {
        params: filters,
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useOutfit(id: string) {
  return useQuery({
    queryKey: queryKeys.outfits.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Outfit>(`/outfits/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useDailyOutfit() {
  return useQuery({
    queryKey: queryKeys.outfits.daily,
    queryFn: async () => {
      const { data } = await apiClient.get<DailyOutfit>('/outfits/daily');
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

export function useOutfitRecommendations(prefs: RecommendationPrefs) {
  return useQuery({
    queryKey: queryKeys.outfits.recommendations(prefs),
    queryFn: async () => {
      const { data } = await apiClient.post<RecommendationResult>('/outfits/recommend', prefs);
      return data;
    },
    enabled: false, // Manual trigger only
  });
}

export function useCreateOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateOutfitDto) => {
      const { data } = await apiClient.post<Outfit>('/outfits', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outfits.lists() });
    },
  });
}
```

**File:** `src/hooks/queries/use-avatars.ts`

```typescript
export function useAvatars() {
  return useQuery({
    queryKey: queryKeys.avatars.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<Avatar[]>('/avatars');
      return data;
    },
  });
}

export function useAvatar(id: string) {
  return useQuery({
    queryKey: queryKeys.avatars.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Avatar>(`/avatars/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useGenerateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, video }: { id: string; video: File }) => {
      const formData = new FormData();
      formData.append('video', video);
      const { data } = await apiClient.post(`/avatars/${id}/generate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min for video upload
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatars.detail('') });
    },
  });
}
```

**File:** `src/hooks/queries/use-calendar.ts`

```typescript
export function useCalendarRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.calendar.range(startDate, endDate),
    queryFn: async () => {
      const { data } = await apiClient.get<CalendarResponse>('/calendar', {
        params: { startDate, endDate },
      });
      return data;
    },
    enabled: !!startDate && !!endDate,
    placeholderData: keepPreviousData,
  });
}

export function useScheduleOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ScheduleOutfitDto) => {
      const { data } = await apiClient.post('/calendar', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}
```

---

## Socket.IO Client Integration

**File:** `src/lib/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useGarmentStore } from '@/stores/garment-store';
import { useOutfitStore } from '@/stores/outfit-store';
import { useAvatarStore } from '@/stores/avatar-store';
import { useCalendarStore } from '@/stores/calendar-store';
import { useNotificationStore } from '@/stores/notification-store';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket() {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken || socket?.connected) return;

  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'wss://api.closetinteligente.com/ws', {
    auth: { token: `Bearer ${accessToken}` },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
    if (error.message === 'Invalid token') {
      useAuthStore.getState().refreshAccessToken().then(() => {
        socket?.connect();
      });
    }
  });

  // Sync events to Zustand stores
  setupEventHandlers(socket);
}

function setupEventHandlers(socket: Socket) {
  socket.on('garment:created', (data) => {
    useGarmentStore.getState().addGarmentFromWebSocket(data.garment);
  });

  socket.on('garment:updated', (data) => {
    useGarmentStore.getState().updateGarmentFromWebSocket(data.garment);
  });

  socket.on('garment:deleted', (data) => {
    useGarmentStore.getState().removeGarmentFromWebSocket(data.id);
  });

  socket.on('outfit:created', (data) => {
    useOutfitStore.getState().addOutfitFromWebSocket(data.outfit);
  });

  socket.on('outfit:updated', (data) => {
    useOutfitStore.getState().updateOutfitFromWebSocket(data.outfit);
  });

  socket.on('avatar:generated', (data) => {
    useAvatarStore.getState().updateAvatarFromWebSocket(data.avatar);
    useAvatarStore.getState().setGenerationProgress(data.status, 100);
  });

  socket.on('avatar:updated', (data) => {
    useAvatarStore.getState().updateAvatarFromWebSocket(data.avatar);
  });

  socket.on('calendar:updated', (data) => {
    if (data.action === 'created') {
      useCalendarStore.getState().addEntryFromWebSocket(data.entry);
    } else if (data.action === 'updated') {
      useCalendarStore.getState().updateEntryFromWebSocket(data.entry);
    } else if (data.action === 'deleted') {
      useCalendarStore.getState().removeEntryFromWebSocket(data.entry.id);
    }
  });

  socket.on('notification:new', (data) => {
    useNotificationStore.getState().addNotification(data.notification);
    useNotificationStore.getState().updateUnreadCount(1);
  });

  socket.on('garment:processing', (data) => {
    useGarmentStore.getState().updateGarmentFromWebSocket({
      id: data.garmentId,
      processingStatus: data.status,
      processingProgress: data.progress,
    } as any);
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToGarment(garmentId: string) {
  socket?.emit('garment:subscribe', garmentId);
}

export function unsubscribeFromGarment(garmentId: string) {
  socket?.emit('garment:unsubscribe', garmentId);
}
```

---

## API Hooks Barrel Export

**File:** `src/hooks/api.ts`

```typescript
export * from './queries/use-garments';
export * from './queries/use-outfits';
export * from './queries/use-avatars';
export * from './queries/use-calendar';
export * from './queries/use-notifications';
export * from './queries/use-analytics';
export * from './queries/use-auth';
export * from './queries/use-storage';
export * from './queries/use-export';
```
