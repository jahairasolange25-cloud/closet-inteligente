'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/websocket';

export function ReconnectBanner() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      setStatus('connected');
      setAttempt(0);
      setTimeout(() => setStatus('connected'), 3000);
    };

    const onDisconnect = () => {
      setStatus('disconnected');
    };

    const onReconnectAttempt = () => {
      setStatus('reconnecting');
      setAttempt((a) => a + 1);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
    };
  }, []);

  if (status === 'connected') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
        status === 'reconnecting'
          ? 'bg-yellow-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            status === 'reconnecting' ? 'bg-yellow-200 animate-pulse' : 'bg-red-200'
          }`}
        />
        {status === 'reconnecting'
          ? `Reconectando... intento ${attempt}`
          : 'Desconectado del servidor'}
      </div>
    </div>
  );
}
