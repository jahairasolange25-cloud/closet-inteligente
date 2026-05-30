import http from 'http';

const API_URL = () => process.env.E2E_API_URL ?? 'http://localhost:4000';

/** Poll a URL until it returns 200 or timeout */
export function waitForServer(url: string, timeoutMs = 60_000): Promise<boolean> {
  const start = Date.now();
  return new Promise((resolve) => {
    const poll = () => {
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            setTimeout(poll, 1_000);
          }
        })
        .on('error', () => setTimeout(poll, 1_000));
    };
    poll();
  });
}

/** Wait for database connectivity via health endpoint */
export function waitForDatabase(timeoutMs = 30_000): Promise<boolean> {
  return waitForServer(`${API_URL()}/health/detailed`, timeoutMs);
}

/** Check if backend is healthy */
export async function isBackendHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL()}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
