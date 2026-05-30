import { io, type Socket } from 'socket.io-client';
import axios from 'axios';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_KEY = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY ?? 'closet_access_token';
const REFRESH_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY ?? 'closet_refresh_token';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 8;

function getAccessToken(): string {
  return (typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null) ?? '';
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>(
      `${API_URL}/auth/refresh`,
      { refreshToken },
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_KEY, data.tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, data.tokens.refreshToken);
    }
    return data.tokens.accessToken;
  } catch {
    return null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(`${WS_URL}/ws`, {
    auth: { token: getAccessToken() },
    transports: ['websocket', 'polling'],
    reconnection: false, // we handle reconnection manually to refresh the token
    timeout: 10_000,
  });

  socket.on('connect', () => {
    reconnectAttempts = 0;
  });

  socket.on('disconnect', async (reason) => {
    if (reason === 'io server disconnect' || reason === 'io client disconnect') return;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

    const delay = Math.min(1000 * 2 ** reconnectAttempts, 30_000);
    reconnectAttempts++;

    setTimeout(async () => {
      // Refresh token before reconnecting so stale tokens don't cause auth failure
      const newToken = await refreshAccessToken();
      if (!newToken) {
        window.dispatchEvent(new Event('auth:logout'));
        return;
      }
      if (socket) {
        (socket.auth as Record<string, string>).token = newToken;
        socket.connect();
      }
    }, delay);
  });

  socket.on('connect_error', (err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[WS] Connection error:', err.message);
    }
  });

  return socket;
}

export function disconnectSocket(): void {
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // prevent auto-reconnect after explicit logout
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

export type WsEvent =
  | 'garment:created'
  | 'garment:updated'
  | 'garment:deleted'
  | 'garment:pipeline_complete'
  | 'outfit:created'
  | 'outfit:updated'
  | 'outfit:deleted'
  | 'avatar:generated'
  | 'avatar:failed'
  | 'notification:new'
  | 'sync:conflict'
  | 'sync:resolved';
