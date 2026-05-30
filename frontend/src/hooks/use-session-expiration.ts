'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { api } from '@/lib/api';

const ACCESS_KEY = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY ?? 'closet_access_token';
const REFRESH_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY ?? 'closet_refresh_token';
// Refresh silently 3 minutes before expiry; warn at 1 minute if refresh fails
const REFRESH_BEFORE_MS = 3 * 60 * 1000;
const WARN_BEFORE_MS = 1 * 60 * 1000;

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function useSessionExpiration() {
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const now = Date.now();
    const msUntilRefresh = expiry - now - REFRESH_BEFORE_MS;
    const msUntilWarn = expiry - now - WARN_BEFORE_MS;

    // Proactively refresh the token before it expires
    if (msUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
        if (!refreshToken) return;
        try {
          const { data } = await api.post<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>(
            '/auth/refresh',
            { refreshToken },
          );
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACCESS_KEY, data.tokens.accessToken);
            localStorage.setItem(REFRESH_KEY, data.tokens.refreshToken);
          }
        } catch {
          // Refresh failed — warn the user so they can save their work
          if (msUntilWarn > 0) {
            warnTimerRef.current = setTimeout(() => {
              addToast({
                type: 'warning',
                message: 'Tu sesión expirará pronto. Guarda tu trabajo.',
                duration: 10000,
              });
            }, Math.max(0, msUntilWarn - (Date.now() - now)));
          }
        }
      }, msUntilRefresh);
    } else if (msUntilWarn > 0) {
      // Token will expire soon and we can't proactively refresh — warn
      warnTimerRef.current = setTimeout(() => {
        addToast({
          type: 'warning',
          message: 'Tu sesión expirará en menos de 1 minuto. Guarda tu trabajo.',
          duration: 10000,
        });
      }, msUntilWarn);
    }

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    };
  }, [isAuthenticated, addToast]);
}
