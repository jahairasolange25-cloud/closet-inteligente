import { randomUUID } from 'crypto';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000/api/v1';
const FETCH_TIMEOUT_MS = 15_000;

export interface TestUser {
  email: string;
  password: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

// Matches auth.service.ts buildAuthResponse() shape:
// { user: SafeUser, tokens: { accessToken, refreshToken } }
interface AuthApiResponse {
  user: { id: string; email: string; name: string; avatar: string | null; createdAt: string };
  tokens: { accessToken: string; refreshToken: string };
}

export function makeTestUser(prefix = 'e2e'): TestUser {
  const id = randomUUID().slice(0, 8);
  return {
    email: `${prefix}-${id}@closet-e2e.test`,
    password: 'E2ePassword!123',
    name: `E2E ${prefix} ${id}`,
  };
}

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

export async function registerAndLogin(user: TestUser): Promise<TestUser> {
  console.log(`[E2E Factory] Registering: ${user.email}`);

  const reg = await apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password, name: user.name }),
  });

  if (reg.status === 409) {
    console.log(`[E2E Factory] User already exists (409) — proceeding to login: ${user.email}`);
  } else if (!reg.ok) {
    const body = await reg.text();
    throw new Error(`[E2E Factory] Registration failed ${reg.status} for ${user.email}: ${body}`);
  } else {
    console.log(`[E2E Factory] Registration OK (${reg.status}): ${user.email}`);
  }

  // Retry login up to 3 times to handle transient 429 rate-limit hits from parallel workers
  let loginRes: Response | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    loginRes = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });

    if (loginRes.status === 429 && attempt < 3) {
      const waitMs = attempt * 2_000;
      console.warn(
        `[E2E Factory] Login rate-limited (429) for ${user.email}, ` +
          `retrying in ${waitMs}ms (attempt ${attempt}/3)…`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    break;
  }

  if (!loginRes!.ok) {
    const body = await loginRes!.text();
    throw new Error(
      `[E2E Factory] Login failed ${loginRes!.status} for ${user.email}: ${body}`,
    );
  }

  const data = (await loginRes!.json()) as AuthApiResponse;

  // Guard against response shape drift — surface immediately instead of silent undefined tokens
  if (!data.tokens?.accessToken || !data.tokens?.refreshToken) {
    throw new Error(
      `[E2E Factory] Login response missing tokens for ${user.email}. ` +
        `Top-level keys received: ${JSON.stringify(Object.keys(data))}`,
    );
  }

  console.log(`[E2E Factory] Login OK for ${user.email} (userId: ${data.user?.id})`);

  return {
    ...user,
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
    userId: data.user?.id,
  };
}

export async function deleteTestUser(user: TestUser): Promise<void> {
  if (!user.accessToken) return;
  await apiFetch('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.accessToken}` },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[E2E Factory] Logout cleanup failed for ${user.email}: ${msg}`);
  });
}

export function authHeaders(user: TestUser): Record<string, string> {
  return {
    Authorization: `Bearer ${user.accessToken ?? ''}`,
    'Content-Type': 'application/json',
    'X-Platform': 'web',
    'X-Client-Version': '0.1.0',
  };
}
