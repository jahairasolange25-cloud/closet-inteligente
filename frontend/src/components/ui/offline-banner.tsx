'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const { isOnline, wasOffline, downSince } = useOnlineStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
    } else if (wasOffline) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isOnline, wasOffline]);

  if (!visible) return null;

  const downtime = downSince
    ? Math.floor((Date.now() - downSince.getTime()) / 1000)
    : 0;

  const message = isOnline
    ? 'Conexión restablecida — los datos se han sincronizado.'
    : downtime > 60
      ? `Sin conexión — llevas ${Math.floor(downtime / 60)} min sin conexión.`
      : 'Sin conexión — los cambios se guardarán cuando恢复了la conexión.';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm text-center font-medium transition-all duration-300 ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-yellow-600 text-white'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-200 animate-pulse' : 'bg-yellow-200 animate-pulse'
          }`}
        />
        {message}
      </div>
    </div>
  );
}
