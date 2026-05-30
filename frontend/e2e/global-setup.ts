import { ensureTestAssets } from './fixtures/test-assets';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000/api/v1';
const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 2000;

async function waitForService(url: string, name: string): Promise<void> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status === 401) {
        console.log(`[E2E Setup] ${name} is ready`);
        return;
      }
    } catch {
      // not ready yet
    }
    console.log(`[E2E Setup] Waiting for ${name}... (${i + 1}/${MAX_RETRIES})`);
    await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
  }
  throw new Error(`[E2E Setup] ${name} at ${url} did not become ready in time`);
}

export default async function globalSetup(): Promise<void> {
  console.log('[E2E Setup] Starting global setup...');

  ensureTestAssets();

  await waitForService(`${API_URL}/health`.replace('/api/v1', ''), 'Backend API');
  await waitForService(FRONTEND_URL, 'Frontend');

  console.log('[E2E Setup] All services ready. Beginning E2E run.');
}
