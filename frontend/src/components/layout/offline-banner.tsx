'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/cn';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const isOffline = !isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Sin conexión a internet"
      className={cn(
        'fixed top-0 left-0 right-0 z-banner flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-transform duration-300',
        'bg-warning-500 text-white',
        isOffline ? 'translate-y-0' : '-translate-y-full',
      )}
    >
      <WifiOff className="h-4 w-4" aria-hidden />
      Sin conexión - los cambios se guardarán cuando vuelvas a conectarte
    </div>
  );
}
