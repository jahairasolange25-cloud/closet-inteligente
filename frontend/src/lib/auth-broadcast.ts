const CHANNEL_NAME = 'closet_auth';

type AuthBroadcastMessage = { type: 'logout' };

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function broadcastLogout(): void {
  getChannel()?.postMessage({ type: 'logout' } satisfies AuthBroadcastMessage);
}

export function subscribeAuthBroadcast(onLogout: () => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<AuthBroadcastMessage>) => {
    if (event.data?.type === 'logout') onLogout();
  };
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
}
