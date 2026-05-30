'use client';

import { useEffect, useState, useRef } from 'react';
import { getSocket } from '@/lib/websocket';
import { cn } from '@/lib/cn';
import * as Tooltip from '@radix-ui/react-tooltip';

type WsState = 'connected' | 'reconnecting' | 'disconnected';

export function WsStatus() {
  const [state, setState] = useState<WsState>('disconnected');
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const attach = () => {
      const socket = getSocket();
      if (!socket) return false;

      const onConnect = () => setState('connected');
      const onDisconnect = () => setState('reconnecting');
      const onError = () => setState('disconnected');

      if (socket.connected) setState('connected');

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onError);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onError);
      };
    };

    const attached = attach();
    let cleanup: (() => void) | null = typeof attached === 'function' ? attached : null;

    if (!cleanup) {
      pollRef.current = setInterval(() => {
        const result = attach();
        if (typeof result === 'function') {
          cleanup = result;
          clearInterval(pollRef.current!);
        }
      }, 500);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (cleanup) cleanup();
    };
  }, []);

  const colorMap: Record<WsState, string> = {
    connected: 'bg-success-500 shadow-[0_0_6px] shadow-success-500/60',
    reconnecting: 'bg-warning-500 animate-pulse-soft',
    disconnected: 'bg-error-500',
  };

  const labelMap: Record<WsState, string> = {
    connected: 'Conectado',
    reconnecting: 'Reconectando...',
    disconnected: 'Desconectado',
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className="h-6 w-6 flex items-center justify-center"
            aria-label={`WebSocket: ${labelMap[state]}`}
          >
            <span className={cn('h-2.5 w-2.5 rounded-full transition-colors', colorMap[state])} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            align="center"
            sideOffset={6}
            className="z-tooltip rounded-lg bg-neutral-800 dark:bg-neutral-200 px-3 py-1.5 text-xs text-white dark:text-neutral-800 shadow-lg animate-fade-in"
          >
            {labelMap[state]}
            <Tooltip.Arrow className="fill-neutral-800 dark:fill-neutral-200" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
