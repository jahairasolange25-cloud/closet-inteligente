import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { NormalizedApiError, ApiErrorCode } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_KEY = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY ?? 'closet_access_token';
const REFRESH_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY ?? 'closet_refresh_token';
const CSRF_KEY = 'csrf-token';
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '0.1.0',
    'X-Platform': 'web',
  },
});

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const cookie = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

function ensureCsrfToken(): string {
  const existing = readCookie(CSRF_KEY);
  if (existing) return existing;

  const token = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  document.cookie = `${CSRF_KEY}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
  return token;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    const method = config.method?.toLowerCase();
    if (method && UNSAFE_METHODS.has(method)) {
      config.headers.set('x-csrf-token', ensureCsrfToken());
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            original.headers.set('Authorization', `Bearer ${token}`);
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          {
            withCredentials: true,
            headers: { 'x-csrf-token': ensureCsrfToken() },
          },
        );

        const newAccessToken = data.tokens.accessToken;
        const newRefreshToken = data.tokens.refreshToken;

        if (typeof window !== 'undefined') {
          localStorage.setItem(ACCESS_KEY, newAccessToken);
          localStorage.setItem(REFRESH_KEY, newRefreshToken);
        }

        onTokenRefreshed(newAccessToken);
        original.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return api(original);
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REFRESH_KEY);
          window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

function statusToCode(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 400 && status < 500) return 'VALIDATION_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const data = error.response?.data as {
      message?: string | string[];
      error?: string | { message?: string };
      statusCode?: number;
    } | undefined;

    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Sin conexión. Verifica tu red e intenta de nuevo.',
        status: null,
        retryable: true,
      };
    }

    const rawMsg = data?.message;
    let message: string;
    let fields: Record<string, string[]> | undefined;

    if (Array.isArray(rawMsg)) {
      message = rawMsg[0] ?? 'Error de validación';
      fields = { _: rawMsg };
    } else {
      message = rawMsg ?? (typeof data?.error === 'string' ? data.error : undefined) ?? error.message ?? 'Ocurrió un error inesperado';
    }

    const code: ApiErrorCode = status ? statusToCode(status) : 'UNKNOWN';
    const retryable = status !== null && status >= 500 && status !== 503;

    return { code, message, status, fields, retryable };
  }

  // Plain-object shape (e.g. test mocks or non-Axios wrappers)
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string | string[] }; status?: number } }).response;
    const status = resp?.status ?? null;
    const rawMsg = resp?.data?.message;
    let message: string;
    if (Array.isArray(rawMsg)) {
      message = rawMsg[0] ?? 'Ocurrió un error inesperado';
    } else {
      message = rawMsg ?? 'Ocurrió un error inesperado';
    }
    return { code: status ? statusToCode(status) : 'UNKNOWN', message, status, retryable: false };
  }

  if (error instanceof Error) {
    return { code: 'UNKNOWN', message: error.message, status: null, retryable: false };
  }

  return { code: 'UNKNOWN', message: 'Ocurrió un error inesperado', status: null, retryable: false };
}

export function extractError(error: unknown): string {
  return normalizeApiError(error).message;
}
