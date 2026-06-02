'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import { useAvatarStore } from '@/stores/avatar-store';
import { connectSocket, disconnectSocket } from '@/lib/websocket';
import { subscribeAuthBroadcast } from '@/lib/auth-broadcast';
import { useSessionExpiration } from '@/hooks/use-session-expiration';
import type { Notification } from '@/types/notification';
import type { Avatar } from '@/types/avatar';
import { Spinner } from '@/components/ui/spinner';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const { isAuthenticated, isRestoring, restoreSession, setUser } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { setAvatar, setGenerationStatus } = useAvatarStore();
  const router = useRouter();
  const pathname = usePathname();
  const restoredRef = useRef(false);
  useSessionExpiration();

  // One-time session restoration on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    restoreSession();

    const handleLogout = () => {
      disconnectSocket();
      setUser(null);
      router.replace('/login');
    };

    // Same-tab logout event (fired by api.ts interceptor on refresh failure)
    window.addEventListener('auth:logout', handleLogout);
    // Cross-tab logout via BroadcastChannel
    const unsubBroadcast = subscribeAuthBroadcast(handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      unsubBroadcast();
    };
  // restoreSession is a stable Zustand action
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route gating — runs after session restoration completes
  useEffect(() => {
    if (isRestoring) return;

    const isPublicPath = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));

    if (isAuthenticated && isPublicPath) {
      router.replace('/');
      return;
    }

    if (!isAuthenticated && !isPublicPath) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    }
  }, [isAuthenticated, isRestoring, pathname, router]);

  // WebSocket lifecycle
  useEffect(() => {
    if (!isAuthenticated || isRestoring) return;

    const ws = connectSocket();

    const onNotification = (data: Notification) => addNotification(data);
    const onAvatarGenerated = (avatar: Avatar) => {
      setAvatar(avatar);
      setGenerationStatus('completed');
    };
    const onAvatarFailed = () => setGenerationStatus('failed');

    ws.on('notification:new', onNotification);
    ws.on('avatar:generated', onAvatarGenerated);
    ws.on('avatar:failed', onAvatarFailed);

    return () => {
      ws.off('notification:new', onNotification);
      ws.off('avatar:generated', onAvatarGenerated);
      ws.off('avatar:failed', onAvatarFailed);
    };
  }, [isAuthenticated, isRestoring, addNotification, setAvatar, setGenerationStatus]);

  // Block render during session restoration on protected routes
  if (isRestoring) {
    const isPublicPath = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (!isPublicPath) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
          <Spinner size="lg" label="Cargando..." />
        </div>
      );
    }
  }

  return <>{children}</>;
}
